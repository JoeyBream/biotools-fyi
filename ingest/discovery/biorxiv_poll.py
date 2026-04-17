"""
Poll bioRxiv for recent preprints in relevant subject categories.

Queries the bioRxiv API for papers published in a given date range,
filters by subject category, and appends candidate papers to a JSONL file.

Usage:
    python biorxiv_poll.py                          # yesterday to today
    python biorxiv_poll.py --start 2026-04-10 --end 2026-04-15
    python biorxiv_poll.py --dry-run                # print results, don't write
"""

import argparse
import json
import logging
import sys
from datetime import date, timedelta
from pathlib import Path
from time import sleep

import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

BASE_URL = "https://api.biorxiv.org/details/biorxiv"
RESULTS_PER_PAGE = 100

SUBJECT_CATEGORIES = {
    "bioinformatics",
    "synthetic biology",
    "systems biology",
    "genomics",
    "biochemistry",
}

DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "data" / "candidates.jsonl"


def fetch_page(start: str, end: str, cursor: int) -> dict:
    """Fetch a single page of results from the bioRxiv API."""
    url = f"{BASE_URL}/{start}/{end}/{cursor}"
    log.info("GET %s", url)
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.json()


def poll_biorxiv(start: str, end: str) -> list[dict]:
    """
    Poll all pages for the given date range and return papers
    whose category matches our subject list.
    """
    cursor = 0
    candidates = []
    total_seen = 0

    while True:
        data = fetch_page(start, end, cursor)
        messages = data.get("messages", [{}])
        meta = messages[0] if messages else {}
        total_count = int(meta.get("total", 0))

        collection = data.get("collection", [])
        if not collection:
            log.info("No results returned at cursor %d — done.", cursor)
            break

        for paper in collection:
            total_seen += 1
            category = paper.get("category", "").lower()
            if category in SUBJECT_CATEGORIES:
                candidates.append(
                    {
                        "doi": paper.get("doi"),
                        "title": paper.get("title"),
                        "authors": paper.get("authors"),
                        "abstract": paper.get("abstract"),
                        "category": category,
                        "date": paper.get("date"),
                    }
                )

        log.info(
            "Page at cursor %d: %d papers fetched, %d matched so far (total in range: %s)",
            cursor,
            len(collection),
            len(candidates),
            total_count,
        )

        cursor += RESULTS_PER_PAGE
        if cursor >= total_count:
            break

        # Be polite to the API
        sleep(1)

    log.info(
        "Finished. Scanned %d papers, %d matched subject filters.",
        total_seen,
        len(candidates),
    )
    return candidates


def write_candidates(candidates: list[dict], output_path: Path) -> None:
    """Append candidates to a JSONL file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "a") as f:
        for c in candidates:
            f.write(json.dumps(c) + "\n")
    log.info("Appended %d candidates to %s", len(candidates), output_path)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Poll bioRxiv for preprints in target subject categories."
    )
    parser.add_argument(
        "--start",
        type=str,
        default=(date.today() - timedelta(days=1)).isoformat(),
        help="Start date (YYYY-MM-DD). Default: yesterday.",
    )
    parser.add_argument(
        "--end",
        type=str,
        default=date.today().isoformat(),
        help="End date (YYYY-MM-DD). Default: today.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Output JSONL path. Default: ingest/data/candidates.jsonl",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print candidates to stdout instead of writing to file.",
    )
    args = parser.parse_args()

    log.info("Polling bioRxiv for %s to %s", args.start, args.end)
    candidates = poll_biorxiv(args.start, args.end)

    if not candidates:
        log.info("No matching papers found.")
        return

    if args.dry_run:
        log.info("Dry run — printing %d candidates to stdout:", len(candidates))
        for c in candidates:
            print(json.dumps(c, indent=2))
    else:
        write_candidates(candidates, args.output)


if __name__ == "__main__":
    main()
