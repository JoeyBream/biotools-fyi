# Pipeline: LLM screening, extraction, and review

Steps 3-5 of the biotools.fyi paper ingestor.

## Prerequisites

```bash
pip install -r ../requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

### Step 3: LLM screening

Classifies papers as relevant/not relevant using Claude.

```bash
# Batch mode (reads enriched.jsonl from discovery step)
python ingest/pipeline/screen.py

# Screen a single paper
python ingest/pipeline/screen.py --paper '{"title":"ProteinMPNN...","abstract":"..."}'

# Adjust confidence threshold (default 0.5)
python ingest/pipeline/screen.py --threshold 0.7

# Preview
python ingest/pipeline/screen.py --dry-run
```

### Step 4: structured extraction

Extracts tool metadata (name, function, tags, open-source status, etc.) from screened papers.

```bash
# Batch mode (reads screened.jsonl)
python ingest/pipeline/extract.py

# Extract from a single paper
python ingest/pipeline/extract.py --paper '{"title":"...","abstract":"...","authors":"..."}'

# Preview
python ingest/pipeline/extract.py --dry-run
```

### Step 5: human review

Interactive review queue for extracted records.

```bash
# Interactive review
python ingest/pipeline/review.py

# List pending records
python ingest/pipeline/review.py --list

# Approve all (testing only)
python ingest/pipeline/review.py --approve-all
```

## Data flow

```
enriched.jsonl  ->  screen.py  ->  screened.jsonl
                                   rejected.jsonl
screened.jsonl  ->  extract.py ->  extracted.jsonl
extracted.jsonl ->  review.py  ->  approved.jsonl
                                   review_rejected.jsonl
```

Approved records are ready to be merged into `src/data/tools.json`.
