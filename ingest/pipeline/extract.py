"""
Structured extraction: pull tool metadata from screened papers.

For each paper that passed screening, extract structured fields matching
the biotools.fyi Tool schema: name, function, tags, open-source status,
developer, countries, etc.

Usage:
    python extract.py
    python extract.py --input ../data/screened.jsonl --output ../data/extracted.jsonl
    python extract.py --dry-run
    python extract.py --paper '{"title":"...","abstract":"..."}'
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

DEFAULT_INPUT = Path(__file__).resolve().parent.parent / "data" / "screened.jsonl"
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "data" / "extracted.jsonl"

VALID_TAGS = [
    "Protein structure prediction",
    "Protein design",
    "Small molecule / drug design",
    "Molecular docking",
    "Antibody design",
    "Genomics / DNA design",
    "Gene expression prediction",
    "Pathogen property prediction",
    "Immune modelling / vaccine design",
    "Experimental automation",
    "Protein language model",
    "Other",
]

EXTRACTION_PROMPT = """\
You are a metadata extraction assistant for biotools.fyi, a directory of \
AI-enabled tools for biological research.

Given the paper details below, extract structured metadata for the tool or \
model described. If the paper describes multiple tools, extract the primary one.

Respond with a JSON object matching this schema exactly:

{{
  "name": "tool/model name (e.g. ProteinMPNN, ESMFold)",
  "function": "one-line description of what it does",
  "tags": ["list of tags from the allowed set"],
  "developer": "lab, group, or company name",
  "countries": ["two-letter ISO country codes of the developer(s)"],
  "year": 2026,
  "openSource": {{
    "code": "yes | no | partial | restricted",
    "weights": "yes | no | partial | restricted | n/a",
    "data": "yes | no | partial | restricted | n/a"
  }},
  "summary": "2-3 sentence summary of what the tool does and why it matters",
  "claimType": "generative | predictive | diagnostic | benchmark | methodological | infrastructure | null"
}}

Allowed tags (pick 1-3):
{tags}

Rules:
- "name" should be the tool/model name, not the paper title. If no clear name, use the method name from the paper.
- "countries" should be ISO 3166-1 alpha-2 codes (US, GB, CN, etc.) for the primary affiliation(s).
- For "openSource", check whether the paper mentions a GitHub repo, model weights, or data release. If unknown, default to "no".
- "claimType" describes what the tool claims to do: generate sequences/structures (generative), predict properties (predictive), classify/diagnose (diagnostic), compare tools (benchmark), introduce a method (methodological), or provide infrastructure.
- If a field genuinely cannot be determined from the information given, use null.

Title: {{{{title}}}}

Abstract: {{{{abstract}}}}

Authors: {{{{authors}}}}

Respond ONLY with the JSON object, no other text.
""".format(tags="\n".join(f"- {t}" for t in VALID_TAGS))


def get_anthropic_client():
    try:
        import anthropic
    except ImportError:
        log.error("anthropic package not installed. Run: pip install anthropic")
        sys.exit(1)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        log.error("ANTHROPIC_API_KEY environment variable not set.")
        sys.exit(1)

    return anthropic.Anthropic(api_key=api_key)


def extract_from_paper(client, title: str, abstract: str, authors: str) -> dict | None:
    """Extract structured metadata from a single paper."""
    prompt = (
        EXTRACTION_PROMPT
        .replace("{{title}}", title)
        .replace("{{abstract}}", abstract)
        .replace("{{authors}}", authors)
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        extracted = json.loads(raw)
    except json.JSONDecodeError:
        log.warning("Failed to parse extraction for '%s': %s", title[:60], raw)
        return None

    # Validate tags
    if "tags" in extracted:
        extracted["tags"] = [t for t in extracted["tags"] if t in VALID_TAGS]
        if not extracted["tags"]:
            extracted["tags"] = ["Other"]

    return extracted


def slugify(name: str) -> str:
    """Generate a URL-safe slug from a tool name."""
    import re
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def build_tool_record(extraction: dict, source: dict) -> dict:
    """Combine extracted metadata with source data into a full tool record."""
    name = extraction.get("name") or "Unknown"
    return {
        "name": name,
        "slug": slugify(name),
        "function": extraction.get("function") or "",
        "tags": extraction.get("tags") or ["Other"],
        "countries": extraction.get("countries") or [],
        "year": extraction.get("year") or 2026,
        "openSource": extraction.get("openSource") or {
            "code": "no",
            "weights": "no",
            "data": "no",
        },
        "paperUrl": f"https://doi.org/{source.get('doi')}" if source.get("doi") else None,
        "repoUrl": None,
        "summary": extraction.get("summary") or "",
        "developer": extraction.get("developer") or "",
        "citations": source.get("cited_by_count"),
        "githubStars": None,
        "githubForks": None,
        "riskScore": None,
        "evaluation": None,
        # Metadata for review
        "_extraction": {
            "claimType": extraction.get("claimType"),
            "source_doi": source.get("doi"),
            "source_title": source.get("title"),
            "screen_confidence": source.get("screen", {}).get("confidence"),
            "status": "pending_review",
        },
    }


def load_jsonl(path: Path) -> list[dict]:
    records = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def extract_batch(records: list[dict]) -> list[dict]:
    """Extract metadata from a batch of screened papers."""
    client = get_anthropic_client()
    results = []

    for i, record in enumerate(records):
        title = record.get("title", "")
        abstract = record.get("abstract", "")
        authors = record.get("authors", "")

        log.info("[%d/%d] Extracting: %s", i + 1, len(records), title[:80])

        extraction = extract_from_paper(client, title, abstract, authors)
        if extraction is None:
            log.warning("  -> extraction failed, skipping.")
            continue

        tool_record = build_tool_record(extraction, record)
        results.append(tool_record)
        log.info("  -> extracted: %s (%s)", tool_record["name"], ", ".join(tool_record["tags"]))

    log.info("Extraction complete: %d tools extracted from %d papers.", len(results), len(records))
    return results


def write_jsonl(records: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")
    log.info("Wrote %d records to %s", len(records), path)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract structured tool metadata from screened papers."
    )
    parser.add_argument(
        "--input", type=Path, default=DEFAULT_INPUT,
        help="Input JSONL (screened papers).",
    )
    parser.add_argument(
        "--output", type=Path, default=DEFAULT_OUTPUT,
        help="Output JSONL (extracted tool records).",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print results to stdout instead of writing.",
    )
    parser.add_argument(
        "--paper", type=str, default=None,
        help='Extract from a single paper as JSON string.',
    )
    args = parser.parse_args()

    # Single-paper mode
    if args.paper:
        record = json.loads(args.paper)
        client = get_anthropic_client()
        extraction = extract_from_paper(
            client,
            record.get("title", ""),
            record.get("abstract", ""),
            record.get("authors", ""),
        )
        if extraction:
            tool = build_tool_record(extraction, record)
            print(json.dumps(tool, indent=2))
        else:
            print("Extraction failed.", file=sys.stderr)
        return

    # Batch mode
    if not args.input.exists():
        log.error("Input file not found: %s", args.input)
        sys.exit(1)

    records = load_jsonl(args.input)
    if not records:
        log.info("No records to extract from.")
        return

    results = extract_batch(records)

    if args.dry_run:
        log.info("Dry run — printing %d extracted records:", len(results))
        for r in results:
            print(json.dumps(r, indent=2))
    else:
        write_jsonl(results, args.output)


if __name__ == "__main__":
    main()
