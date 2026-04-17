"""
LLM screening: classify whether a paper develops or benchmarks a new
computational tool for biological design.

Reads enriched candidates (JSONL), sends title + abstract to Claude,
and writes papers that pass the relevance threshold to screened.jsonl.

Usage:
    python screen.py
    python screen.py --input ../data/enriched.jsonl --output ../data/screened.jsonl
    python screen.py --dry-run
    python screen.py --paper '{"doi":"...","title":"...","abstract":"..."}'
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path


def _load_dotenv() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip()
            if key and key not in os.environ:
                os.environ[key] = value


_load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

DEFAULT_INPUT = Path(__file__).resolve().parent.parent / "data" / "enriched.jsonl"
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "data" / "screened.jsonl"

SCREENING_PROMPT = """\
You are a screening assistant for biotools.fyi, a directory of AI-enabled tools \
for biological research. Your job is to decide whether a preprint paper \
describes or benchmarks a new computational tool relevant to biodesign.

A paper is RELEVANT if it:
- Introduces a new ML/AI model, algorithm, or software tool for biology
- Benchmarks or compares existing computational biology tools
- Presents a significant methodological advance in protein design, \
  molecular design, genomics, gene expression prediction, antibody design, \
  molecular docking, or related fields

A paper is NOT RELEVANT if it:
- Is purely experimental wet-lab work with no computational tool
- Is a review article without a new tool or benchmark
- Is computational but targets a domain outside biology (NLP, vision, etc.)
- Is a dataset release without an accompanying tool or model

Given the title and abstract below, respond with a JSON object:
{
  "relevant": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "one-sentence explanation"
}

Title: {{title}}

Abstract: {{abstract}}

Respond ONLY with the JSON object, no other text.
"""


def get_anthropic_client():
    """Lazily import and return an Anthropic client."""
    try:
        import anthropic
    except ImportError:
        log.error(
            "anthropic package not installed. Run: pip install anthropic"
        )
        sys.exit(1)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        log.error("ANTHROPIC_API_KEY environment variable not set.")
        sys.exit(1)

    return anthropic.Anthropic(api_key=api_key)


def screen_paper(client, title: str, abstract: str) -> dict:
    """Send a single paper to Claude for screening. Returns parsed JSON."""
    prompt = SCREENING_PROMPT.replace("{{title}}", title).replace(
        "{{abstract}}", abstract
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    # Parse — handle possible markdown code fences
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        log.warning("Failed to parse LLM response for '%s': %s", title[:60], raw)
        return {"relevant": False, "confidence": 0.0, "reason": "parse error"}


def load_jsonl(path: Path) -> list[dict]:
    records = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def screen_batch(
    records: list[dict],
    confidence_threshold: float = 0.5,
) -> tuple[list[dict], list[dict]]:
    """Screen a batch of papers. Returns (passed, rejected)."""
    client = get_anthropic_client()
    passed = []
    rejected = []

    for i, record in enumerate(records):
        title = record.get("title", "")
        abstract = record.get("abstract", "")

        if not title:
            log.warning("Record %d has no title — skipping.", i)
            rejected.append({**record, "screen": {"relevant": False, "reason": "no title"}})
            continue

        log.info("[%d/%d] Screening: %s", i + 1, len(records), title[:80])
        result = screen_paper(client, title, abstract or "(no abstract)")

        record_with_screen = {**record, "screen": result}

        if result.get("relevant") and result.get("confidence", 0) >= confidence_threshold:
            passed.append(record_with_screen)
            log.info("  -> PASS (confidence: %.2f) %s", result.get("confidence", 0), result.get("reason", ""))
        else:
            rejected.append(record_with_screen)
            log.info("  -> REJECT (confidence: %.2f) %s", result.get("confidence", 0), result.get("reason", ""))

    log.info("Screening complete: %d passed, %d rejected.", len(passed), len(rejected))
    return passed, rejected


def write_jsonl(records: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")
    log.info("Wrote %d records to %s", len(records), path)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="LLM screening: classify papers as relevant to biotools.fyi."
    )
    parser.add_argument(
        "--input", type=Path, default=DEFAULT_INPUT,
        help="Input JSONL (enriched candidates).",
    )
    parser.add_argument(
        "--output", type=Path, default=DEFAULT_OUTPUT,
        help="Output JSONL (screened, passed papers).",
    )
    parser.add_argument(
        "--threshold", type=float, default=0.5,
        help="Minimum confidence to pass screening. Default: 0.5.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print results to stdout instead of writing.",
    )
    parser.add_argument(
        "--paper", type=str, default=None,
        help='Screen a single paper as JSON string: \'{"title":"...","abstract":"..."}\'',
    )
    args = parser.parse_args()

    # Single-paper mode
    if args.paper:
        record = json.loads(args.paper)
        client = get_anthropic_client()
        result = screen_paper(client, record.get("title", ""), record.get("abstract", ""))
        print(json.dumps(result, indent=2))
        return

    # Batch mode
    if not args.input.exists():
        log.error("Input file not found: %s", args.input)
        sys.exit(1)

    records = load_jsonl(args.input)
    if not records:
        log.info("No records to screen.")
        return

    passed, rejected = screen_batch(records, args.threshold)

    if args.dry_run:
        log.info("Dry run — printing %d passed records:", len(passed))
        for r in passed:
            print(json.dumps(r, indent=2))
    else:
        write_jsonl(passed, args.output)
        # Also save rejected for audit
        rejected_path = args.output.parent / "rejected.jsonl"
        write_jsonl(rejected, rejected_path)


if __name__ == "__main__":
    main()
