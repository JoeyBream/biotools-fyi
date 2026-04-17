'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Tool } from '@/lib/types'
import { ALL_TAGS } from '@/lib/types'
import TagBadge from './TagBadge'
import OpenSourceBadge from './OpenSourceBadge'
import { isFullyOpen } from './OpenSourceBadge'

type SortKey = 'name' | 'year' | 'citations'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 50

function formatCitations(n: number | null): string {
  if (n === null) return '\u2014'
  return n.toLocaleString('en-GB')
}

export default function Dashboard({ tools }: { tools: Tool[] }) {
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [openSourceOnly, setOpenSourceOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('citations')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
    setVisibleCount(PAGE_SIZE)
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return tools
      .filter((t) => {
        if (q) {
          const haystack = `${t.name} ${t.function} ${t.tags.join(' ')} ${t.developer}`.toLowerCase()
          if (!haystack.includes(q)) return false
        }
        if (activeTags.size > 0) {
          if (!t.tags.some((tag) => activeTags.has(tag))) return false
        }
        if (openSourceOnly && !isFullyOpen(t.openSource)) return false
        return true
      })
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'name') return mul * a.name.localeCompare(b.name)
        if (sortKey === 'year') return mul * (a.year - b.year)
        // Citations: nulls always last
        const ac = a.citations ?? -1
        const bc = b.citations ?? -1
        if (ac === -1 && bc === -1) return a.name.localeCompare(b.name)
        if (ac === -1) return 1
        if (bc === -1) return -1
        return mul * (ac - bc)
      })
  }, [tools, query, activeTags, openSourceOnly, sortKey, sortDir])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const usedTags = useMemo(() => {
    const s = new Set<string>()
    tools.forEach((t) => t.tags.forEach((tag) => s.add(tag)))
    return ALL_TAGS.filter((tag) => s.has(tag))
  }, [tools])

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' \u2191' : ' \u2193'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search tools by name, function, or tag\u2026"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setVisibleCount(PAGE_SIZE)
          }}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {usedTags.map((tag) => (
            <TagBadge
              key={tag}
              tag={tag}
              active={activeTags.has(tag)}
              onClick={() => toggleTag(tag)}
            />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={openSourceOnly}
              onChange={(e) => {
                setOpenSourceOnly(e.target.checked)
                setVisibleCount(PAGE_SIZE)
              }}
              className="rounded border-border"
            />
            Fully open source only
          </label>
          {(activeTags.size > 0 || openSourceOnly || query) && (
            <button
              type="button"
              onClick={() => {
                setActiveTags(new Set())
                setOpenSourceOnly(false)
                setQuery('')
                setVisibleCount(PAGE_SIZE)
              }}
              className="text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted mb-4">
        {filtered.length} tool{filtered.length !== 1 ? 's' : ''}
        {hasMore && ` (showing ${visibleCount})`}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th
                className="text-left px-4 py-3 font-medium text-muted cursor-pointer select-none hover:text-foreground"
                onClick={() => toggleSort('name')}
              >
                Tool{sortArrow('name')}
              </th>
              <th
                className="text-right px-4 py-3 font-medium text-muted cursor-pointer select-none hover:text-foreground hidden sm:table-cell"
                onClick={() => toggleSort('citations')}
              >
                Citations{sortArrow('citations')}
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted hidden md:table-cell">
                Tags
              </th>
              <th
                className="text-left px-4 py-3 font-medium text-muted cursor-pointer select-none hover:text-foreground hidden sm:table-cell"
                onClick={() => toggleSort('year')}
              >
                Year{sortArrow('year')}
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted hidden lg:table-cell">
                Open source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((tool) => (
              <tr
                key={tool.slug}
                className="hover:bg-surface transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {tool.name}
                  </Link>
                  <p className="text-xs text-muted mt-0.5 line-clamp-1 max-w-xs">
                    {tool.function}
                  </p>
                </td>
                <td className="px-4 py-3 text-right text-muted tabular-nums hidden sm:table-cell">
                  {formatCitations(tool.citations)}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {tool.tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted hidden sm:table-cell">
                  {tool.year}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <OpenSourceBadge openSource={tool.openSource} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No tools match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-6 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary-light transition-colors"
          >
            Show more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  )
}
