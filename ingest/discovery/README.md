# Discovery: bioRxiv polling and OpenAlex pre-filtering

> **Status: on hold.** These scripts are functional but not yet deployed as a cron job. Run them manually as needed.

This is steps 1-2 of the biotools.fyi paper ingestor pipeline:

1. **`biorxiv_poll.py`** — polls the bioRxiv API for recent preprints in target subject categories (bioinformatics, synthetic biology, systems biology, genomics, biochemistry). Appends matching papers to `ingest/data/candidates.jsonl`.

2. **`openalex_enrich.py`** — takes the candidates JSONL, queries OpenAlex for each DOI, enriches with topic classifications / citation counts / author affiliations / OA status, and filters out papers whose topics don't match biology/biotech. Writes surviving papers to `ingest/data/enriched.jsonl`.

## Prerequisites

```bash
pip install -r requirements.txt
```

Only dependency is `requests`.

## Usage

### Step 1: poll bioRxiv

```bash
# Default: yesterday to today
python ingest/discovery/biorxiv_poll.py

# Custom date range
python ingest/discovery/biorxiv_poll.py --start 2026-04-10 --end 2026-04-15

# Preview without writing
python ingest/discovery/biorxiv_poll.py --dry-run
```

### Step 2: enrich and filter via OpenAlex

```bash
# Default: reads candidates.jsonl, writes enriched.jsonl
python ingest/discovery/openalex_enrich.py

# Preview without writing
python ingest/discovery/openalex_enrich.py --dry-run
```

## Output files

| File | Description |
|---|---|
| `ingest/data/candidates.jsonl` | Raw matches from bioRxiv (append mode) |
| `ingest/data/enriched.jsonl` | Candidates that passed OpenAlex topic filtering (overwrite mode) |

## Next steps

- Wire up as a daily cron job (or GitHub Action)
- Add deduplication on DOI in candidates.jsonl
- Feed enriched.jsonl into downstream scoring/summarisation steps
