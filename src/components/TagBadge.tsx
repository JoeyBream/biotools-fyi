const TAG_COLOURS: Record<string, string> = {
  'Protein structure prediction': 'bg-blue-100 text-blue-800',
  'Protein design': 'bg-purple-100 text-purple-800',
  'Small molecule / drug design': 'bg-pink-100 text-pink-800',
  'Molecular docking': 'bg-amber-100 text-amber-800',
  'Antibody design': 'bg-rose-100 text-rose-800',
  'Genomics / DNA design': 'bg-green-100 text-green-800',
  'Gene expression prediction': 'bg-teal-100 text-teal-800',
  'Pathogen property prediction': 'bg-red-100 text-red-800',
  'Immune modelling / vaccine design': 'bg-indigo-100 text-indigo-800',
  'Experimental automation': 'bg-orange-100 text-orange-800',
  'Protein language model': 'bg-cyan-100 text-cyan-800',
}

export default function TagBadge({
  tag,
  onClick,
  active,
}: {
  tag: string
  onClick?: () => void
  active?: boolean
}) {
  const base = TAG_COLOURS[tag] ?? 'bg-gray-100 text-gray-800'
  const classes = [
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
    active ? `${base} ring-2 ring-offset-1 ring-current` : base,
    onClick ? 'cursor-pointer hover:opacity-80' : '',
  ].join(' ')

  return onClick ? (
    <button type="button" className={classes} onClick={onClick}>
      {tag}
    </button>
  ) : (
    <span className={classes}>{tag}</span>
  )
}
