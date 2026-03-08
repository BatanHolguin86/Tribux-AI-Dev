const INDUSTRY_COLORS: Record<string, string> = {
  fintech: 'bg-emerald-100 text-emerald-700',
  salud: 'bg-red-100 text-red-700',
  educacion: 'bg-blue-100 text-blue-700',
  ecommerce: 'bg-amber-100 text-amber-700',
  foodtech: 'bg-orange-100 text-orange-700',
  saas: 'bg-indigo-100 text-indigo-700',
  logistica: 'bg-cyan-100 text-cyan-700',
  inmobiliaria: 'bg-teal-100 text-teal-700',
}

type IndustryTagProps = {
  industry: string
}

export function IndustryTag({ industry }: IndustryTagProps) {
  const key = industry.toLowerCase()
  const colorClass = INDUSTRY_COLORS[key] ?? 'bg-gray-100 text-gray-600'

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {industry}
    </span>
  )
}
