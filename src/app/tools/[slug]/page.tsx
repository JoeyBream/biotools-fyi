import { notFound } from 'next/navigation'
import Link from 'next/link'
import tools from '@/data/tools.json'
import type { Tool } from '@/lib/types'
import TagBadge from '@/components/TagBadge'
import OpenSourceBadge from '@/components/OpenSourceBadge'

const allTools = tools as Tool[]

export function generateStaticParams() {
  return allTools.map((tool) => ({ slug: tool.slug }))
}

export async function generateMetadata(props: PageProps<'/tools/[slug]'>) {
  const { slug } = await props.params
  const tool = allTools.find((t) => t.slug === slug)
  if (!tool) return { title: 'Tool not found' }
  return {
    title: `${tool.name} — biotools.fyi`,
    description: tool.function,
  }
}

function OpenSourceDetail({ label, value }: { label: string; value: string }) {
  const colour =
    value === 'yes'
      ? 'text-green-700'
      : value === 'restricted' || value === 'partial'
        ? 'text-amber-700'
        : value === 'no'
          ? 'text-red-700'
          : 'text-muted'

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-muted">{label}</span>
      <span className={`font-medium capitalize ${colour}`}>{value}</span>
    </div>
  )
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CN: 'China',
  FR: 'France',
  DK: 'Denmark',
  IL: 'Israel',
  DE: 'Germany',
  JP: 'Japan',
  KR: 'South Korea',
  CA: 'Canada',
  AU: 'Australia',
  CH: 'Switzerland',
  IN: 'India',
}

export default async function ToolPage(props: PageProps<'/tools/[slug]'>) {
  const { slug } = await props.params
  const tool = allTools.find((t) => t.slug === slug)

  if (!tool) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6"
      >
        &larr; Back to directory
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">{tool.name}</h1>
      <p className="mt-1 text-muted">{tool.developer}</p>

      <div className="flex flex-wrap gap-2 mt-4">
        {tool.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </div>

      <p className="mt-6 text-base leading-relaxed">{tool.summary}</p>

      {/* Metadata grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
              Function
            </h3>
            <p className="text-sm">{tool.function}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
              Year
            </h3>
            <p className="text-sm">{tool.year}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
              Country
            </h3>
            <p className="text-sm">
              {tool.countries
                .map((c) => COUNTRY_NAMES[c] ?? c)
                .join(', ')}
            </p>
          </div>

          {tool.riskScore !== null && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
                Risk score (RAND)
              </h3>
              <p className="text-sm">{tool.riskScore}</p>
            </div>
          )}

          {tool.riskScore === null && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
                Risk assessment
              </h3>
              <p className="text-sm text-muted italic">Not yet assessed</p>
            </div>
          )}
        </div>

        {/* Right column — open source details */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
            Open-source status
          </h3>
          <div className="rounded-lg border border-border p-4">
            <div className="mb-3">
              <OpenSourceBadge openSource={tool.openSource} />
            </div>
            <div className="divide-y divide-border text-sm">
              <OpenSourceDetail label="Code" value={tool.openSource.code} />
              <OpenSourceDetail label="Weights" value={tool.openSource.weights} />
              <OpenSourceDetail label="Data" value={tool.openSource.data} />
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mt-8 flex flex-wrap gap-3">
        {tool.paperUrl && (
          <a
            href={tool.paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Paper
          </a>
        )}
        {tool.repoUrl && (
          <a
            href={tool.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Repository
          </a>
        )}
      </div>
    </div>
  )
}
