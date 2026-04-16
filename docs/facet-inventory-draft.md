# Facet inventory (draft)

Contributed by a biologist collaborator. Shelved for later — too granular for v1. To be filtered by:
- Can this be obtained from the paper + SI / code repo without running the tool?
- How much analyst interpretation is required?
- Does this expose a common rhetorical inflation?
- Co-variation too high → merge
- LLM-manageable vs human-eyes-needed

## A. Paper-level framing

- Claim type: generative / predictive / diagnostic / benchmark / methodological / infrastructure / meta-analysis.
- Primary deliverable: model weights / code / dataset / analysis / design examples / pipeline.
- Intended deployment context: research tool / pharma pipeline / teaching / regulatory.
- Novelty type: new architecture / new training data / new task / new evaluation / new finding.
- Positioning claim: SOTA / complementary / replacement / stepping-stone.

## B. Biomolecule scope

- Biomolecule class: protein monomer, multimer, membrane, IDP/IDR, glycoprotein, metalloprotein, RNA, DNA, small molecule, complex.
- Size range.
- Fold class coverage (SCOP/CATH level).
- Functional class (EC class, GO term, receptor family).
- Taxonomic coverage.
- Engineering class: natural / engineered / de novo.

## C. Task specification

- Task type: structure prediction, sequence design, mutation effect, binding affinity, generation, retrieval, scoring, clustering.
- Conditioning modality: sequence only, structure, multiple-sequence alignment, ligand, hotspot, motif, function spec, text.
- Output modality: sequence, structure, scalar score, distribution, trajectory, multiple outputs.
- Single vs. multi-objective.
- Deterministic vs. stochastic (sampled).

## D. Training data

- Source: PDB, UniProt, AlphaFold DB, metagenomic, proprietary.
- Preprocessing: clustering, filtering, augmentation.
- Scale: number of sequences / structures / labels.
- Label quality: gold-standard / noisy / weak-supervision.
- Training-data cutoff date.
- Data licence / access.
- Contamination audit: overlap with evaluation sets tested?

## E. Evaluation data

- Evaluation dataset identity: named benchmarks, PDB IDs, UniProt IDs.
- Evaluation data source type (rung 3-11 above).
- Author-collected vs. third-party.
- Heterogeneity: single-assay vs. aggregated.
- Size and unit (see section 2).
- Experimental noise reported.
- Label definition (e.g., "stability" = DG_unfold / Tm / protease resistance).
- Eval data cutoff date relative to training cutoff.

## F. Distribution relationship

- Split type: random / sequence-cluster / structure-cluster / fold / family / temporal / organism.
- Clustering threshold.
- OOD probes: intentional out-of-distribution tests.
- Zero-shot / few-shot / fine-tuned.
- Leakage audit: was it done, at what level.

## G. Metrics

- Structural: RMSD, TM-score, lDDT, pLDDT, pTM, GDT, interface-RMSD.
- Sequence: recovery, perplexity, identity.
- Thermodynamic: DG, DDG, Tm.
- Binding: K_d, K_i, IC50, EC50, AUC, competition ratio.
- Kinetic: k_on, k_off.
- Functional: activity, selectivity, specificity.
- Expression: yield, solubility, folded fraction.
- Design: success rate, diversity, novelty, filter-pass rate.
- Calibration: Brier, ECE, coverage.
- Statistical aggregation: mean / median / top-k / success-at-threshold.
- Uncertainty quantification reported.

## H. Baselines and comparison

- SOTA comparator identified.
- Ablation of own method.
- Random / trivial baseline.
- Classical (non-ML) baseline (e.g., Rosetta, FoldX, BLAST).
- Previous version of own method.
- Fair-comparison audit: same splits, same metrics, same compute.

## I. Selection pressure (the funnel)

- Number of candidates generated.
- Number passing in silico filters.
- Number experimentally tested.
- Filter criteria disclosed.
- Top-k vs. all-reported.
- Human curation involved at any step.

## J. Failure and negative reporting

- Failures enumerated.
- Failures mechanistically attributed.
- Hard-case analysis present.
- Outlier analysis present.
- Null hypothesis defined.
- Pre-registered predictions (rare; still worth flagging).

## K. Pipeline decomposition

- Components in pipeline (full DAG if possible).
- Which components were trained vs. fixed / inherited.
- Credit assignment: which component the paper claims responsibility for.
- Compute per component.
- Dependency versions (specific model checkpoints, commit hashes).

## L. Observation vs. intervention

- Correlational evidence.
- Ablation studies.
- Counterfactual / synthetic controls.
- Interventional perturbation (fine-tuning, weight editing, data intervention).
- Mechanistic probing (attention analysis, probing classifiers, feature importance).

## M. Reproducibility and provenance (central to your directory)

- Code released.
- Weights released.
- Training data released / documented.
- Evaluation data released.
- Seeds fixed; stochasticity reported.
- Hyperparameters disclosed.
- Compute disclosed.
- Reproducibility externally confirmed.
- Licence (code / weights / data - separately).
- Environment frozen (Docker/conda/lockfile).
- Versioning policy (SemVer, DOI, model card versioning).

## N. Safety, dual-use, biosecurity

- Training-data filtering for hazardous sequences.
- Evaluation excludes hazardous targets.
- Red-team evaluation reported.
- Release policy: open, gated, API-only, internal.
- Terms of use restrict certain uses.
- Responsible disclosure process.
- Relevance to biosecurity review.
- Dual-use assessment stated.

## O. Statistical rigour

- Sample size justification / power.
- Confidence intervals or bootstrap reported.
- Multiple-testing correction applied.
- Cross-validation folds reported.
- Effect sizes reported.
- Calibration of reported uncertainty checked.

## P. Temporal and versioning

- Publication date.
- Preprint-to-journal delta.
- Training-data cutoff.
- Benchmark publication date.
- Method version history (v1 / v2 / successor).
- Temporal leakage audit.

## Q. Extrapolation evidence (maps to my A-D tiers)

- Multiple distinct test distributions.
- Explicit OOD probes.
- Temporal / new-target generalisation.
- Cross-species / cross-family generalisation.
- Bounded failure-mode claims.
- Mechanism / principle articulated.

## R. Human involvement

- Manual design decisions.
- Expert filtering beyond stated criteria.
- Design-test-learn iteration cycles.
- Fully automated vs. human-in-the-loop.

## S. Economic / practical deployment

- Compute cost per unit output.
- Wall-time to first useful result.
- Minimum hardware.
- GUI / API / CLI availability.
- Dependency complexity.
- Expertise barrier.
- Cost to replicate evaluation.

## T. Community and ecosystem

- Prior citations into this method (when available).
- Existing third-party uses.
- Integrations with common pipelines.
- Known incompatibilities.
