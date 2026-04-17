# Paper ingestor pipeline

This directory contains the biotools.fyi paper ingestion pipeline. It takes DOIs or bioRxiv URLs, screens them for relevance using an LLM, extracts structured metadata, and outputs results for human review.

## Quick start

```bash
# Set up (one-time)
cd ingest
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...

# Run the pipeline on papers (DOIs or bioRxiv URLs)
python run_pipeline.py 10.1101/2024.01.01.123456 10.1101/2024.02.02.654321

# Output as CSV (default) or JSON
python run_pipeline.py --csv 10.1101/2024.01.01.123456
python run_pipeline.py --json 10.1101/2024.01.01.123456

# From a file (one DOI per line)
python run_pipeline.py --file papers.txt
```

## Common tasks

### "Run the pipeline on these papers and show me the output as CSV"

```bash
source ingest/.venv/bin/activate
export ANTHROPIC_API_KEY=sk-ant-...
python ingest/run_pipeline.py DOI1 DOI2 DOI3
```

This will print a CSV table with columns: status, name, function, tags, developer, countries, year, open_source_code/weights/data, claim_type, confidence, doi, summary.

### "Screen a single paper"

```bash
python ingest/pipeline/screen.py --paper '{"title":"...","abstract":"..."}'
```

### "Extract metadata from a single paper"

```bash
python ingest/pipeline/extract.py --paper '{"title":"...","abstract":"...","authors":"..."}'
```

## Architecture

```
run_pipeline.py          <- convenience wrapper (DOI in, CSV/JSON out)
discovery/
  biorxiv_poll.py        <- step 1: poll bioRxiv for preprints
  openalex_enrich.py     <- step 2: enrich with OpenAlex metadata
pipeline/
  screen.py              <- step 3: LLM screening (relevant or not?)
  extract.py             <- step 4: structured metadata extraction
  review.py              <- step 5: interactive human review queue
data/                    <- working data (gitignored)
```

## Notes

- The pipeline uses Claude Sonnet 4.6 for screening and extraction.
- Screening confidence threshold defaults to 0.5 (adjustable with --threshold).
- Papers that fail screening are logged with a reason.
- All scripts support --dry-run for testing without API calls.
