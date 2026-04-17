#!/usr/bin/env python3
"""
Run the full paper ingestor pipeline on a list of papers.

Accepts papers as DOIs, bioRxiv URLs, or a JSON file with title/abstract.
Screens each for relevance, extracts structured metadata, and outputs
results as CSV or JSON.

Usage:
    # Screen and extract from DOIs
    python run_pipeline.py 10.1101/2024.01.01.123456 10.1101/2024.02.02.654321

    # Output as CSV (default)
    python run_pipeline.py --csv 10.1101/2024.01.01.123456

    # Output as JSON
    python run_pipeline.py --json 10.1101/2024.01.01.123456

    # From a file (one DOI per line, or JSONL with title/abstract)
    python run_pipeline.py --file papers.txt

    # Dry run (show what would be processed)
    python run_pipeline.py --dry-run 10.1101/2024.01.01.123456

Prerequisites:
    pip install -r requirements.txt
    export ANTHROPIC_API_KEY=sk-ant-...
"""

import argparse
import csv
import io
import json
import logging
import os
import re
import sys
from pathlib import Path

import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# Add parent paths so we can import pipeline modules
sys.path.insert(0, str(Path(__file__).resolve().parent))

from pipeline.screen import screen_paper, get_anthropic_client
from pipeline.extract import extract_from_paper, build_tool_record, slugify


def resolve_doi(raw: str) -> str:
    """Extract a DOI from a URL or raw string."""
    raw = raw.strip()
    # Handle bioRxiv URLs
    m = re.search(r"(10\.\d{4,}/[^\s]+)", raw)
    if m:
        return m.group(1).rstrip("/")
    return raw


def fetch_paper_metadata(doi: str) -> dict | None:
    """Fetch title and abstract from bioRxiv API for a DOI."""
    # Try bioRxiv first
    url = f"https://api.biorxiv.org/details/biorxiv/{doi}"
    log.info("Fetching metadata for %s", doi)
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        collection = data.get("collection", [])
        if collection:
            paper = collection[0]
            return {
                "doi": doi,
                "title": paper.get("title", ""),
                "abstract": paper.get("abstract", ""),
                "authors": paper.get("authors", ""),
                "date": paper.get("date", ""),
                "category": paper.get("category", ""),
            }
    except Exception as e:
        log.warning("bioRxiv lookup failed for %s: %s", doi, e)

    # Fallback: try CrossRef
    try:
        url = f"https://api.crossref.org/works/{doi}"
        resp = requests.get(url, timeout=30, headers={"User-Agent": "biotools-fyi/0.1"})
        resp.raise_for_status()
        item = resp.json().get("message", {})
        title = " ".join(item.get("title", []))
        abstract = item.get("abstract", "")
        # Strip HTML tags from CrossRef abstract
        abstract = re.sub(r"<[^>]+>", "", abstract)
        authors = "; ".join(
            f"{a.get('family', '')}, {a.get('given', '')}"
            for a in item.get("author", [])
        )
        return {
            "doi": doi,
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "date": "",
            "category": "",
        }
    except Exception as e:
        log.warning("CrossRef lookup also failed for %s: %s", doi, e)

    return None


def process_papers(papers: list[dict], confidence_threshold: float = 0.5) -> list[dict]:
    """Run screening and extraction on a list of papers."""
    client = get_anthropic_client()
    results = []

    for i, paper in enumerate(papers):
        title = paper.get("title", "")
        abstract = paper.get("abstract", "")
        authors = paper.get("authors", "")

        log.info("[%d/%d] Processing: %s", i + 1, len(papers), title[:80])

        # Step 1: Screen
        screen_result = screen_paper(client, title, abstract or "(no abstract)")
        is_relevant = screen_result.get("relevant") and screen_result.get("confidence", 0) >= confidence_threshold

        if not is_relevant:
            log.info("  -> REJECTED: %s", screen_result.get("reason", ""))
            results.append({
                "doi": paper.get("doi", ""),
                "title": title,
                "status": "rejected",
                "reason": screen_result.get("reason", ""),
                "confidence": screen_result.get("confidence", 0),
            })
            continue

        # Step 2: Extract
        extraction = extract_from_paper(client, title, abstract, authors)
        if extraction is None:
            log.warning("  -> extraction failed.")
            results.append({
                "doi": paper.get("doi", ""),
                "title": title,
                "status": "extraction_failed",
                "reason": "LLM extraction returned unparseable result",
                "confidence": screen_result.get("confidence", 0),
            })
            continue

        tool = build_tool_record(extraction, {**paper, "screen": screen_result})
        tool["_status"] = "extracted"
        results.append(tool)
        log.info("  -> EXTRACTED: %s (%s)", tool["name"], ", ".join(tool["tags"]))

    return results


def results_to_csv(results: list[dict]) -> str:
    """Convert results to CSV string."""
    fields = [
        "status", "name", "function", "tags", "developer", "countries",
        "year", "open_source_code", "open_source_weights", "open_source_data",
        "claim_type", "confidence", "doi", "summary", "reason",
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()

    for r in results:
        status = r.get("_status") or r.get("status", "unknown")
        os_info = r.get("openSource", {})
        extraction = r.get("_extraction", {})

        row = {
            "status": status,
            "name": r.get("name", ""),
            "function": r.get("function", ""),
            "tags": "; ".join(r.get("tags", [])),
            "developer": r.get("developer", ""),
            "countries": "; ".join(r.get("countries", [])),
            "year": r.get("year", ""),
            "open_source_code": os_info.get("code", ""),
            "open_source_weights": os_info.get("weights", ""),
            "open_source_data": os_info.get("data", ""),
            "claim_type": extraction.get("claimType", ""),
            "confidence": extraction.get("screen_confidence") or r.get("confidence", ""),
            "doi": extraction.get("source_doi") or r.get("doi", ""),
            "summary": r.get("summary", ""),
            "reason": r.get("reason", ""),
        }
        writer.writerow(row)

    return output.getvalue()


def load_input_file(path: Path) -> list[str]:
    """Load DOIs from a file (one per line, or JSONL)."""
    dois = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Try parsing as JSON
            try:
                data = json.loads(line)
                if isinstance(data, dict) and "doi" in data:
                    dois.append(data["doi"])
                    continue
            except json.JSONDecodeError:
                pass
            dois.append(line)
    return dois


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the biotools.fyi paper ingestor pipeline.",
        epilog="Example: python run_pipeline.py 10.1101/2024.01.01.123456",
    )
    parser.add_argument(
        "papers", nargs="*",
        help="DOIs or bioRxiv URLs to process.",
    )
    parser.add_argument(
        "--file", type=Path, default=None,
        help="File with DOIs (one per line).",
    )
    parser.add_argument(
        "--csv", action="store_true", default=True,
        help="Output as CSV (default).",
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Output as JSON instead of CSV.",
    )
    parser.add_argument(
        "--threshold", type=float, default=0.5,
        help="Minimum screening confidence. Default: 0.5.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Fetch metadata but skip LLM calls.",
    )
    args = parser.parse_args()

    # Collect DOIs
    raw_inputs = list(args.papers or [])
    if args.file:
        raw_inputs.extend(load_input_file(args.file))

    if not raw_inputs:
        parser.error("No papers provided. Pass DOIs as arguments or use --file.")

    dois = [resolve_doi(r) for r in raw_inputs]
    log.info("Processing %d paper(s).", len(dois))

    # Fetch metadata
    papers = []
    for doi in dois:
        meta = fetch_paper_metadata(doi)
        if meta:
            papers.append(meta)
        else:
            log.warning("Could not fetch metadata for %s — skipping.", doi)

    if not papers:
        log.error("No papers with retrievable metadata.")
        sys.exit(1)

    if args.dry_run:
        log.info("Dry run — metadata fetched for %d papers:", len(papers))
        for p in papers:
            print(f"  {p['doi']}: {p['title'][:80]}")
        return

    # Run pipeline
    results = process_papers(papers, args.threshold)

    # Output
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(results_to_csv(results))


if __name__ == "__main__":
    main()
