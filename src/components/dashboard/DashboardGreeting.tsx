'use client'

import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'

function greetingForHour(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

type Props = { displayName: string }

export function DashboardGreeting({ displayName }: Props) {
  const greeting = useMemo(() => greetingForHour(), [])

  const first = displayName.split(' ')[0] || displayName

  return (
    <div>
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#0EA5A3]" aria-hidden />
        <h1 className="font-display text-2xl font-bold text-[#0F2B46] dark:text-white">
          {greeting}, {first}
        </h1>
      </div>
      <p className="mt-0.5 text-sm text-[#94A3B8]">
        Tus proyectos y progreso.
      </p>
    </div>
  )
}
