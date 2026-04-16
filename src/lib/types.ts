export interface Tool {
  name: string
  slug: string
  function: string
  tags: string[]
  countries: string[]
  year: number
  openSource: {
    code: 'yes' | 'no' | 'partial' | 'restricted'
    weights: 'yes' | 'no' | 'partial' | 'restricted' | 'n/a'
    data: 'yes' | 'no' | 'partial' | 'restricted' | 'n/a'
  }
  paperUrl: string | null
  repoUrl: string | null
  summary: string
  developer: string
  riskScore: number | null
  evaluation: EvaluationProfile | null
}

export interface EvaluationProfile {
  claimType: ClaimType | null
  evaluationLadderMax: number | null
  evaluationLadderDistribution: number[] | null
  unitOfEvaluation: string | null
  unitIndependenceNote: string | null
  selectionFunnelRatio: string | null
  pipelineComponents: string[] | null
  creditAssignment: string | null
  failuresEnumerated: boolean | null
  sotaBaselineNamed: string | null
  ablationPresent: boolean | null
  interventionalEvidence: boolean | null
  statedScope: string | null
  effectiveScope: string | null
  dualUseNote: string | null
}

export type ClaimType =
  | 'generative'
  | 'predictive'
  | 'diagnostic'
  | 'benchmark'
  | 'methodological'
  | 'infrastructure'

export const EVALUATION_LADDER: { level: number; type: string; example: string }[] = [
  { level: 0, type: 'Self-consistency', example: 'Same model, different seeds/temps/prompts' },
  { level: 1, type: 'Model-vs-model (in silico filter)', example: 'ProteinMPNN sequence scored by AF2 pLDDT/pTM' },
  { level: 2, type: 'Model-vs-reference-structure', example: 'RMSD/TM-score to a known native' },
  { level: 3, type: 'Held-out computational labels', example: 'Predictions vs. labels from another computational method' },
  { level: 4, type: 'Aggregated literature labels', example: 'Predictions vs. curated DDG / Kd from many papers' },
  { level: 5, type: 'Single-assay high-throughput experiment', example: 'Megascale, DMS, yeast display sort-seq' },
  { level: 6, type: 'Purpose-collected biophysics', example: 'Authors run SPR / BLI / ITC / CD / thermal shift on designs' },
  { level: 7, type: 'Structural validation', example: 'X-ray, cryo-EM, NMR on the actual designs' },
  { level: 8, type: 'Functional assay in controlled system', example: 'Competitive binding, enzymatic activity, inhibition' },
  { level: 9, type: 'Cellular validation', example: 'Reporter, localisation, signalling in cells' },
  { level: 10, type: 'Organism validation', example: 'Mouse, fly, plant' },
  { level: 11, type: 'Clinical / field', example: 'Human trials, deployed use' },
]

export const ALL_TAGS = [
  'Protein structure prediction',
  'Protein design',
  'Small molecule / drug design',
  'Molecular docking',
  'Antibody design',
  'Genomics / DNA design',
  'Gene expression prediction',
  'Pathogen property prediction',
  'Immune modelling / vaccine design',
  'Experimental automation',
  'Protein language model',
] as const

export type Tag = (typeof ALL_TAGS)[number]
