#!/usr/bin/env python3
"""
Merge approved tools from reviewed.json into the live tools.json.

Reads ingest/data/reviewed.json, deduplicates by slug against the existing
tools.json, appends new tools, and writes the updated file.

Usage:
    python ingest/merge.py                 # merge and write
    python ingest/merge.py --dry-run       # show what would be added
"""

import argparse
import json
import logging
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

REVIEWED_PATH = Path(__file__).resolve().parent / "data" / "reviewed.json"
TOOLS_PATH = Path(__file__).resolve().parent.parent / "src" / "data" / "tools.json"


def load_reviewed() -> list[dict]:
    with open(REVIEWED_PATH) as f:
        data = json.load(f)
    return data.get("approved", [])


def load_tools() -> list[dict]:
    with open(TOOLS_PATH) as f:
        return json.load(f)


def clean_for_tools_json(record: dict) -> dict:
    """Strip internal fields and ensure schema compliance."""
    cleaned = {}
    schema_fields = [
        "name", "slug", "function", "tags", "countries", "year",
        "openSource", "paperUrl", "repoUrl", "summary", "developer",
        "citations", "githubStars", "githubForks", "riskScore", "evaluation",
    ]
    for field in schema_fields:
        cleaned[field] = record.get(field)

    # Ensure defaults for nullable fields
    for nullable in ["paperUrl", "repoUrl", "citations", "githubStars", "githubForks", "riskScore", "evaluation"]:
        if cleaned[nullable] is None:
            cleaned[nullable] = None  # explicit null

    return cleaned


def main() -> None:
    parser = argparse.ArgumentParser(description="Merge approved tools into tools.json.")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing.")
    args = parser.parse_args()

    approved = load_reviewed()
    if not approved:
        log.info("No approved tools to merge.")
        return

    tools = load_tools()
    existing_slugs = {t["slug"] for t in tools}

    new_tools = []
    for record in approved:
        slug = record.get("slug", "")
        if slug in existing_slugs:
            log.info("Skipping %s — already in tools.json.", slug)
            continue
        new_tools.append(clean_for_tools_json(record))

    if not new_tools:
        log.info("All approved tools are already in tools.json.")
        return

    if args.dry_run:
        log.info("Dry run — would add %d tools:", len(new_tools))
        for t in new_tools:
            log.info("  + %s (%s)", t["name"], ", ".join(t.get("tags", [])))
        return

    tools.extend(new_tools)
    with open(TOOLS_PATH, "w") as f:
        json.dump(tools, f, indent=2, ensure_ascii=False)
    log.info("Added %d tools to %s (total: %d).", len(new_tools), TOOLS_PATH, len(tools))


if __name__ == "__main__":
    main()
