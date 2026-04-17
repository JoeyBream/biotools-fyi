"""
Human review queue: present extracted tool records for approval.

Reads extracted.jsonl, presents each record interactively, and lets the
reviewer approve, edit, or reject. Approved records are written to
approved.jsonl, ready for merging into the live tools.json.

Usage:
    python review.py                          # interactive review
    python review.py --input ../data/extracted.jsonl
    python review.py --list                   # just show what's pending
    python review.py --approve-all            # approve everything (testing only)
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

DEFAULT_INPUT = Path(__file__).resolve().parent.parent / "data" / "extracted.jsonl"
DEFAULT_APPROVED = Path(__file__).resolve().parent.parent / "data" / "approved.jsonl"
DEFAULT_REJECTED = Path(__file__).resolve().parent.parent / "data" / "review_rejected.jsonl"


def load_jsonl(path: Path) -> list[dict]:
    records = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def write_jsonl(records: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")


def format_record(record: dict) -> str:
    """Pretty-print a tool record for review."""
    extraction = record.get("_extraction", {})
    lines = [
        f"  Name:       {record.get('name')}",
        f"  Function:   {record.get('function')}",
        f"  Tags:       {', '.join(record.get('tags', []))}",
        f"  Developer:  {record.get('developer')}",
        f"  Countries:  {', '.join(record.get('countries', []))}",
        f"  Year:       {record.get('year')}",
        f"  Open src:   code={record.get('openSource', {}).get('code')}, "
        f"weights={record.get('openSource', {}).get('weights')}, "
        f"data={record.get('openSource', {}).get('data')}",
        f"  Paper URL:  {record.get('paperUrl')}",
        f"  Summary:    {record.get('summary')}",
        f"  Claim type: {extraction.get('claimType')}",
        f"  Confidence: {extraction.get('screen_confidence')}",
        f"  Source DOI: {extraction.get('source_doi')}",
    ]
    return "\n".join(lines)


def clean_for_export(record: dict) -> dict:
    """Remove internal _extraction metadata before export."""
    cleaned = {k: v for k, v in record.items() if not k.startswith("_")}
    return cleaned


def interactive_review(records: list[dict]) -> tuple[list[dict], list[dict]]:
    """Run interactive review. Returns (approved, rejected)."""
    approved = []
    rejected = []

    print(f"\n{'=' * 60}")
    print(f"  REVIEW QUEUE: {len(records)} tools pending")
    print(f"{'=' * 60}\n")

    for i, record in enumerate(records):
        print(f"\n--- [{i + 1}/{len(records)}] ---")
        print(format_record(record))
        print()

        while True:
            choice = input("  [a]pprove / [r]eject / [e]dit name / [s]kip / [q]uit: ").strip().lower()

            if choice == "a":
                approved.append(record)
                print("  -> Approved.")
                break
            elif choice == "r":
                rejected.append(record)
                print("  -> Rejected.")
                break
            elif choice == "e":
                new_name = input("  New name: ").strip()
                if new_name:
                    record["name"] = new_name
                    record["slug"] = new_name.lower().replace(" ", "-")
                    print(f"  -> Name updated to '{new_name}'. Now approve or reject.")
                else:
                    print("  -> No change.")
            elif choice == "s":
                print("  -> Skipped (will remain in queue).")
                break
            elif choice == "q":
                print("  -> Quitting review.")
                return approved, rejected
            else:
                print("  Invalid choice. Use a/r/e/s/q.")

    return approved, rejected


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Human review queue for extracted tool records."
    )
    parser.add_argument(
        "--input", type=Path, default=DEFAULT_INPUT,
        help="Input JSONL (extracted records).",
    )
    parser.add_argument(
        "--approved", type=Path, default=DEFAULT_APPROVED,
        help="Output JSONL for approved records.",
    )
    parser.add_argument(
        "--rejected", type=Path, default=DEFAULT_REJECTED,
        help="Output JSONL for rejected records.",
    )
    parser.add_argument(
        "--list", action="store_true",
        help="List pending records without interactive review.",
    )
    parser.add_argument(
        "--approve-all", action="store_true",
        help="Approve all records without review (for testing).",
    )
    args = parser.parse_args()

    if not args.input.exists():
        log.error("Input file not found: %s", args.input)
        sys.exit(1)

    records = load_jsonl(args.input)
    if not records:
        log.info("No records to review.")
        return

    # List mode
    if args.list:
        print(f"\n{len(records)} tools pending review:\n")
        for i, r in enumerate(records):
            print(f"  {i + 1}. {r.get('name')} — {r.get('function', '')[:60]}")
        return

    # Approve-all mode
    if args.approve_all:
        log.info("Approving all %d records.", len(records))
        cleaned = [clean_for_export(r) for r in records]
        write_jsonl(cleaned, args.approved)
        log.info("Wrote %d approved records to %s", len(cleaned), args.approved)
        return

    # Interactive mode
    approved, rejected = interactive_review(records)

    if approved:
        cleaned = [clean_for_export(r) for r in approved]
        write_jsonl(cleaned, args.approved)
        log.info("Wrote %d approved records to %s", len(cleaned), args.approved)

    if rejected:
        write_jsonl(rejected, args.rejected)
        log.info("Wrote %d rejected records to %s", len(rejected), args.rejected)

    remaining = len(records) - len(approved) - len(rejected)
    if remaining > 0:
        log.info("%d records were skipped and remain in the queue.", remaining)


if __name__ == "__main__":
    main()
