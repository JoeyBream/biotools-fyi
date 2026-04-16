# Biological Design Tools Index

A live, searchable dashboard of AI-enabled biological tools — their capabilities, risk profiles, and relevance to different users.

Based on the methodology from the [Global Risk Index for AI-enabled Biological Tools](https://doi.org/10.71172/wjyw-6dyc) (CLTR & RAND Europe, September 2025).

## Who is this for?

- **Policy folks:** See our categorisation of tools to understand dual-use risk across the landscape. Filter by composite risk score (Red / Amber / Green) to prioritise governance attention.
- **Model developers:** See how your model ranks for misuse-relevant capability and maturity. Schedule a call with us to discuss which KYC / managed access tools may best fit your project.
- **Biology researchers:** Choose your use case (protein engineering, pathogen property prediction, etc.) and see which tools are most relevant.
- **Evaluators:** See which models have been tested against which misuse scenarios. Expand the corpus by attempting new use cases and reporting your findings.

## How it works

1. We ingest research papers (via OpenAlex, arXiv, targeted search) and identify the AI-enabled biological tool.
2. We match the tool against our database, or create a new entry.
3. An AI API categorises the tool across the RAND/CLTR framework:
   - **Category** (1 of 8): viral vector design, protein engineering, small biomolecule design, genetic modification & genome design, pathogen property prediction, host-pathogen interaction prediction, immune system modelling & vaccine design, experimental design / simulation / automation.
   - **Misuse-relevant capability** (Very Low → Critical): scored against predefined misuse scenarios per category.
   - **Maturity & availability** (1–5 across 5 dimensions): scientific maturity, market demand, regulatory landscape, funding, ease of access.
   - **Composite score**: Red (recommend action) / Amber (consider action) / Green (monitor).
4. Landscape metadata: country of origin, year of release, open-source status (code / weights / data), potential for change.

## What is this similar to?

- **Product Hunt** — people use it to find tools relevant for their job. This is similar, but for AI-enabled biology tools with a risk lens.
- **There's an AI for That** — same concept of discovering AI tools by use case. We add biosecurity risk assessment on top.
- **Neurosnap.ai** — a paid platform where you choose from hosted bio-AI tools. Our site is the free discovery + risk layer; Neurosnap is the paid execution layer.

## Data model

Each tool entry contains:

| Field | Type | Example |
|---|---|---|
| `name` | string | AlphaFold 3 |
| `function` | string | Predicts structural interactions between proteins, nucleic acids, small molecules |
| `categories` | string[] | ["protein_engineering"] |
| `country` | string[] | ["GB", "US"] |
| `year` | number | 2024 |
| `open_source` | object | { code: true, weights: true, data: true } |
| `misuse_capability` | enum | very_low / low / medium / high / critical |
| `misuse_scenarios` | string[] | Scored scenarios from the RAND/CLTR rubric |
| `maturity_availability` | number | 3.6 (average of 5 dimensions) |
| `composite_score` | enum | red / amber / green |
| `potential_for_change` | enum | small / moderate / large |
| `paper_url` | string | Link to primary publication |
| `repo_url` | string | Link to code repository |
| `plain_summary` | string | AI-generated plain-language risk summary |

## Tech stack

- **Frontend:** Next.js (App Router) + Tailwind CSS
- **Database:** Supabase (Postgres)
- **Ingestion pipeline:** OpenAlex API + Claude API for categorisation
- **Deployment:** Vercel

## Status

Early development. Seeding with the 57 state-of-the-art tools from the RAND/CLTR Global Risk Index.

## Licence

MIT

## Contact

Joey Bream — joey@sentinelbio.org
