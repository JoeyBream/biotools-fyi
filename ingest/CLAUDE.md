# Paper ingestor — reviewer guide

You are helping a reviewer evaluate AI biology papers for inclusion in the biotools.fyi directory.

## Setup (one-time)

```bash
cd ingest
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # paste the Anthropic API key into .env
```

## How review works

The reviewer gives you DOIs or bioRxiv URLs. You:

1. Run the pipeline to screen and extract metadata
2. Present each result as a **review card** (format below)
3. Ask the reviewer to pick a numbered option
4. Save their decisions to `ingest/data/reviewed.json` (persists between sessions via git)
5. Commit after each review session

### Review card format

For each extracted tool, present it like this:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Paper 1 of 5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Name:        TSvelo
  Function:    RNA velocity inference using neural ODEs
  Tags:        Gene expression prediction
  Developer:   Shanghai Jiao Tong University
  Countries:   CN
  Year:        2024
  Open source: code=no, weights=no, data=no
  Claim type:  predictive
  Confidence:  0.95
  DOI:         10.1101/2024.12.24.630058

  Summary:     TSvelo is a framework for RNA velocity that models
               the cascade of transcription and splicing...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [1] Approve as-is
  [2] Approve with edits
  [3] Reject
  [4] Skip (come back later)
```

- If the reviewer picks **[2]**, ask which fields to change. Present the editable fields as a numbered list:
  ```
  Which field to edit?
  [1] Name         (TSvelo)
  [2] Function     (RNA velocity inference using neural ODEs)
  [3] Tags         (Gene expression prediction)
  [4] Developer    (Shanghai Jiao Tong University)
  [5] Countries    (CN)
  [6] Open source  (code=no, weights=no, data=no)
  [7] Summary
  [8] Done editing — approve
  ```
- After editing, show the updated card and confirm.

### Saving decisions

After the reviewer finishes (or after each decision), update `ingest/data/reviewed.json`:

```python
import json
from pathlib import Path

reviewed_path = Path("ingest/data/reviewed.json")
data = json.loads(reviewed_path.read_text())

# For approved tools, append the full tool record (without _extraction/_status keys)
data["approved"].append(clean_record)

# For rejected tools, append a minimal record
data["rejected"].append({"doi": "...", "name": "...", "reason": "reviewer rejected"})

reviewed_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
```

After finishing a review session, commit the changes:
```bash
git add ingest/data/reviewed.json
git commit -m "Review session: approved N, rejected M tools"
git push
```

## Running the pipeline

```bash
# Activate the venv first
source ingest/.venv/bin/activate

# Process papers (outputs JSON for review)
python ingest/run_pipeline.py --json DOI1 DOI2 DOI3

# From a file of DOIs
python ingest/run_pipeline.py --json --file papers.txt
```

## Checking previous reviews

To see what's already been reviewed:
```bash
cat ingest/data/reviewed.json | python3 -m json.tool
```

Or read the file directly — the `approved` array has all approved tools, `rejected` has rejected ones with reasons.

## Merging approved tools into the live directory

This is done by Joey (not the reviewer):
```bash
python ingest/merge.py           # merge approved into tools.json
python ingest/merge.py --dry-run # preview first
```

## Architecture

```
run_pipeline.py          <- DOI in, structured JSON out
pipeline/
  screen.py              <- LLM screening (relevant or not?)
  extract.py             <- structured metadata extraction
  review.py              <- legacy terminal review (optional)
data/
  reviewed.json          <- persistent review ledger (committed to git)
  *.jsonl                <- working files (gitignored)
merge.py                 <- push approved tools into src/data/tools.json
```

## Allowed tags

When editing tags, these are the valid options:
- Protein structure prediction
- Protein design
- Small molecule / drug design
- Molecular docking
- Antibody design
- Genomics / DNA design
- Gene expression prediction
- Pathogen property prediction
- Immune modelling / vaccine design
- Experimental automation
- Protein language model
- Other
