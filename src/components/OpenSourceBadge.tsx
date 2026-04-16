import type { Tool } from '@/lib/types'

function isFullyOpen(os: Tool['openSource']): boolean {
  return (
    os.code === 'yes' &&
    (os.weights === 'yes' || os.weights === 'n/a') &&
    (os.data === 'yes' || os.data === 'n/a')
  )
}

function isPartiallyOpen(os: Tool['openSource']): boolean {
  return !isFullyOpen(os) && (os.code === 'yes' || os.weights === 'yes')
}

export default function OpenSourceBadge({ openSource }: { openSource: Tool['openSource'] }) {
  if (isFullyOpen(openSource)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        Fully open
      </span>
    )
  }

  if (isPartiallyOpen(openSource)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
        Partially open
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
      <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
      Restricted
    </span>
  )
}

export { isFullyOpen, isPartiallyOpen }
