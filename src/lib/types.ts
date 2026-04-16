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
}

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
