import Link from 'next/link'

export const metadata = {
  title: 'Paper ingestor — biotools.fyi',
  description:
    'How we automatically discover, screen, and catalogue new AI biology tools from the literature.',
}

const STEPS = [
  {
    number: 1,
    title: 'Discovery',
    status: 'built' as const,
    description:
      'Poll bioRxiv daily for preprints in target subject categories (bioinformatics, synthetic biology, systems biology, genomics, biochemistry).',
  },
  {
    number: 2,
    title: 'Enrichment and pre-filtering',
    status: 'built' as const,
    description:
      'Query OpenAlex for each DOI to pull topic classifications, citation counts, author affiliations, and open-access status. Filter out papers whose topics fall outside biology and biotech.',
  },
  {
    number: 3,
    title: 'LLM screening',
    status: 'built' as const,
    description:
      'Send each paper\'s title and abstract to an LLM with a structured prompt: "Does this paper develop or benchmark a new computational tool for biological design?" Papers scored below threshold are discarded.',
  },
  {
    number: 4,
    title: 'Structured extraction',
    status: 'built' as const,
    description:
      'For papers that pass screening, extract structured fields: tool name, function, model type (generative / predictive / benchmark), target molecule, open-source status, and suggested tags from our taxonomy.',
  },
  {
    number: 5,
    title: 'Human review queue',
    status: 'built' as const,
    description:
      'Extracted records land in a review queue. A human reviewer confirms or edits the extraction before the tool is added to the live directory.',
  },
]

const STATUS_STYLES = {
  built: { label: 'Built', className: 'bg-green-100 text-green-800' },
  'in progress': { label: 'In progress', className: 'bg-amber-100 text-amber-800' },
  planned: { label: 'Planned', className: 'bg-gray-100 text-gray-600' },
}

export default function PipelinePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6"
      >
        &larr; Back to directory
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Paper ingestor</h1>
      <p className="mt-3 text-muted max-w-2xl">
        We&apos;re building a pipeline that automatically discovers new AI biology
        tools from the preprint literature, extracts structured metadata, and
        queues them for human review before they appear in the directory.
      </p>

      <p className="mt-4 text-sm text-muted">
        The goal: a living, continuously updated catalogue — not a static
        spreadsheet that goes stale. If you know of a paper we&apos;ve missed,{' '}
        <Link href="/submit" className="underline hover:text-foreground">
          submit it directly
        </Link>
        .
      </p>

      {/* Pipeline steps */}
      <div className="mt-10 space-y-6">
        <h2 className="text-lg font-semibold">Pipeline</h2>

        <div className="space-y-4">
          {STEPS.map((step) => {
            const style = STATUS_STYLES[step.status]
            return (
              <div
                key={step.number}
                className="rounded-lg border border-border p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-surface text-sm font-semibold">
                    {step.number}
                  </span>
                  <h3 className="font-medium">{step.title}</h3>
                  <span
                    className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${style.className}`}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="text-sm text-muted pl-10">{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Data sources */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold">Data sources</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted list-disc pl-5">
          <li>
            <strong>bioRxiv</strong> — daily preprint polling, filtered by
            subject category
          </li>
          <li>
            <strong>OpenAlex</strong> — topic enrichment, citation counts,
            affiliations
          </li>
          <li>
            <strong>Epoch AI</strong> — baseline dataset of 1,194 AI models
            (376 biology models imported)
          </li>
        </ul>
      </div>

      {/* What we extract */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold">What we extract</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted list-disc pl-5">
          <li>Tool name and developer</li>
          <li>Function and model type (generative, predictive, benchmark)</li>
          <li>Target molecule or system</li>
          <li>Open-source status (code, weights, data)</li>
          <li>Tags from our taxonomy</li>
          <li>Paper URL and repository link</li>
        </ul>
      </div>

      {/* Status */}
      <div className="mt-10 rounded-lg border border-border p-5 bg-surface">
        <h2 className="text-lg font-semibold mb-2">Current status</h2>
        <p className="text-sm text-muted">
          The pipeline is functional and ready for testing with example papers.
          We are not yet running automated daily polling — papers are being
          tested manually through the screening and extraction steps.
        </p>
      </div>
    </div>
  )
}
