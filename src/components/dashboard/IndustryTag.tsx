const INDUSTRY_COLORS: Record<string, string> = {
  fintech: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  salud: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  educacion: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  ecommerce: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  foodtech: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
  saas: 'bg-brand-surface dark:bg-brand-primary/20 text-brand-primary dark:text-brand-teal',
  logistica: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400',
  inmobiliaria: 'bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400',
}

type IndustryTagProps = {
  industry: string
}

export function IndustryTag({ industry }: IndustryTagProps) {
  const key = industry.toLowerCase()
  const colorClass = INDUSTRY_COLORS[key] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {industry}
    </span>
  )
}
