"""
Enrich bioRxiv candidates with metadata from OpenAlex and filter by topic relevance.

Reads DOIs from candidates.jsonl, queries OpenAlex for each, enriches with
topic classifications / citation counts / affiliations / OA status, and
filters out papers whose topics don't match biology/biotech/computational biology.

Usage:
    python openalex_enrich.py
    python openalex_enrich.py --input ../data/candidates.jsonl --output ../data/enriched.jsonl
    python openalex_enrich.py --dry-run
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from time import sleep

import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

OPENALEX_BASE = "https://api.openalex.org/works/doi"

# OpenAlex topic display names (lowercased) we consider relevant.
# These are broad enough to catch computational biology, synbio, genomics, etc.
RELEVANT_TOPIC_KEYWORDS = {
    "biology",
    "biolog",
    "biotech",
    "biotechnology",
    "genomic",
    "genetic",
    "molecular",
    "biochem",
    "computational biology",
    "bioinformatic",
    "synthetic biology",
    "systems biology",
    "cell biology",
    "microbiology",
    "proteomics",
    "transcriptomics",
    "metabolomics",
    "pharmaceutical",
    "protein",
    "enzyme",
    "sequencing",
    "crispr",
    "gene",
    "genome",
    "dna",
    "rna",
}

DEFAULT_INPUT = Path(__file__).resolve().parent.parent / "data" / "candidates.jsonl"
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "data" / "enriched.jsonl"

# Polite pool header for OpenAlex (they ask for a contact email)
HEADERS = {
    "User-Agent": "biotools-fyi-ingestor/0.1 (mailto:joey@sentinelbio.org)",
}


def load_candidates(path: Path) -> list[dict]:
    """Load candidate papers from a JSONL file."""
    candidates = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                candidates.append(json.loads(line))
    log.info("Loaded %d candidates from %s", len(candidates), path)
    return candidates


def query_openalex(doi: str) -> dict | None:
    """Query OpenAlex for a single DOI. Returns the work object or None."""
    url = f"{OPENALEX_BASE}/{doi}"
    log.info("GET %s", url)
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        if resp.status_code == 404:
            log.warning("DOI not found in OpenAlex: %s", doi)
            return None
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        log.error("Failed to fetch %s: %s", doi, e)
        return None


def extract_enrichment(work: dict) -> dict:
    """Extract the fields we care about from an OpenAlex work object."""
    # Topics
    topics = []
    for t in work.get("topics", []):
        topics.append(
            {
                "name": t.get("display_name"),
                "score": t.get("score"),
                "subfield": t.get("subfield", {}).get("display_name"),
                "field": t.get("field", {}).get("display_name"),
                "domain": t.get("domain", {}).get("display_name"),
            }
        )

    # Author affiliations
    affiliations = []
    for authorship in work.get("authorships", []):
        author_name = authorship.get("author", {}).get("display_name")
        institutions = [
            inst.get("display_name")
            for inst in authorship.get("institutions", [])
            if inst.get("display_name")
        ]
        if author_name:
            affiliations.append(
                {"author": author_name, "institutions": institutions}
            )

    return {
        "topics": topics,
        "cited_by_count": work.get("cited_by_count", 0),
        "affiliations": affiliations,
        "open_access": work.get("open_access", {}),
    }


def is_topic_relevant(enrichment: dict) -> bool:
    """
    Check whether any of the paper's OpenAlex topics match our relevance filter.
    We check topic names, subfields, fields, and domains.
    """
    for topic in enrichment.get("topics", []):
        for field_key in ("name", "subfield", "field", "domain"):
            value = topic.get(field_key)
            if not value:
                continue
            value_lower = value.lower()
            for keyword in RELEVANT_TOPIC_KEYWORDS:
                if keyword in value_lower:
                    return True
    return False


def enrich_candidates(
    candidates: list[dict],
) -> tuple[list[dict], int]:
    """
    Enrich each candidate with OpenAlex data. Returns (enriched_list, filtered_count).
    """
    enriched = []
    filtered = 0

    for i, candidate in enumerate(candidates):
        doi = candidate.get("doi")
        if not doi:
            log.warning("Candidate %d has no DOI — skipping.", i)
            filtered += 1
            continue

        work = query_openalex(doi)
        if work is None:
            log.info("Skipping %s (not in OpenAlex).", doi)
            filtered += 1
            continue

        enrichment = extract_enrichment(work)

        if not is_topic_relevant(enrichment):
            log.info(
                "Filtered out %s — topics not relevant: %s",
                doi,
                [t.get("name") for t in enrichment.get("topics", [])],
            )
            filtered += 1
            continue

        enriched_record = {**candidate, **enrichment}
        enriched.append(enriched_record)

        # Rate-limit: OpenAlex polite pool allows ~10 req/s, but let's be gentle
        if (i + 1) % 5 == 0:
            sleep(0.5)

    log.info(
        "Enrichment done. %d papers enriched, %d filtered out.",
        len(enriched),
        filtered,
    )
    return enriched, filtered


def write_enriched(records: list[dict], output_path: Path) -> None:
    """Write enriched records to a JSONL file (overwrite mode)."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")
    log.info("Wrote %d enriched records to %s", len(records), output_path)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Enrich bioRxiv candidates with OpenAlex metadata and filter by topic."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT,
        help="Input JSONL of candidates. Default: ingest/data/candidates.jsonl",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Output JSONL of enriched candidates. Default: ingest/data/enriched.jsonl",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print enriched candidates to stdout instead of writing to file.",
    )
    args = parser.parse_args()

    if not args.input.exists():
        log.error("Input file not found: %s", args.input)
        sys.exit(1)

    candidates = load_candidates(args.input)
    if not candidates:
        log.info("No candidates to enrich.")
        return

    enriched, filtered = enrich_candidates(candidates)

    if not enriched:
        log.info("No papers survived enrichment + filtering.")
        return

    if args.dry_run:
        log.info("Dry run — printing %d enriched records to stdout:", len(enriched))
        for r in enriched:
            print(json.dumps(r, indent=2))
    else:
        write_enriched(enriched, args.output)


if __name__ == "__main__":
    main()
