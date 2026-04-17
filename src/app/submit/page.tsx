import Link from 'next/link'

export const metadata = {
  title: 'Submit a tool — biotools.fyi',
  description: 'Suggest an AI biology tool or paper for inclusion in the directory.',
}

export default function SubmitPage() {
  const mailto =
    'mailto:joey@armadillobio.com?subject=biotools.fyi%20submission&body=Paper%20URL%20or%20DOI%3A%20%0A%0ATool%20name%20(if%20known)%3A%20%0A%0ANotes%3A%20'

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6"
      >
        &larr; Back to directory
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Submit a tool</h1>
      <p className="mt-3 text-muted">
        Know of an AI biology tool or paper that should be in the directory?
        Send us the details and we&apos;ll review it for inclusion.
      </p>

      <div className="mt-8 rounded-lg border border-border p-6 space-y-5">
        <div>
          <label
            htmlFor="paper-url"
            className="block text-sm font-medium mb-1"
          >
            Paper URL or DOI <span className="text-red-500">*</span>
          </label>
          <input
            id="paper-url"
            type="text"
            placeholder="https://doi.org/10.1234/... or arXiv link"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            readOnly={false}
          />
        </div>

        <div>
          <label
            htmlFor="tool-name"
            className="block text-sm font-medium mb-1"
          >
            Tool name{' '}
            <span className="text-muted font-normal">(if known)</span>
          </label>
          <input
            id="tool-name"
            type="text"
            placeholder="e.g. ThermoMPNN"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Your email{' '}
            <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <a
          href={mailto}
          className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Submit via email
        </a>

        <p className="text-xs text-muted text-center">
          This opens your email client with the details pre-filled. We review
          submissions manually and aim to add tools within a few days.
        </p>
      </div>
    </div>
  )
}
