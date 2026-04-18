'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type ProjectToolsProps = {
  projectId: string
}

const tools = [
  {
    id: 'designs',
    label: 'Diseño & UX',
    description: 'Pantallas guardadas + kit con agente',
    icon: '🎨',
    path: 'designs',
    gradient: 'from-pink-500/10 to-[#0EA5A3]/10 dark:from-pink-500/5 dark:to-[#0EA5A3]/5',
    iconBg: 'bg-pink-100 dark:bg-pink-900/30',
  },
  {
    id: 'agents',
    label: 'Agentes AI',
    description: 'CTO, Architect, QA y mas',
    icon: '🤖',
    path: 'experts',
    gradient: 'from-[#0EA5A3]/10 to-blue-500/10 dark:from-[#0EA5A3]/5 dark:to-blue-500/5',
    iconBg: 'bg-brand-surface dark:bg-brand-primary/30',
  },
]

export function ProjectTools({ projectId }: ProjectToolsProps) {
  const pathname = usePathname()

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Accesos rápidos
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => {
          const href = `/projects/${projectId}/${tool.path}`
          const isActive = pathname.includes(`/${tool.path}`)

          return (
            <Link
              key={tool.id}
              href={href}
              className={`group relative overflow-hidden rounded-xl border p-3 transition-all ${
                isActive
                  ? 'border-brand-teal dark:border-[#0A1F33] bg-gradient-to-br from-[#E8F4F8] to-[#E8F4F8]/50 dark:from-[#0F2B46]/20 dark:to-[#0F2B46]/10 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
              }`}
            >
              <div
                className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                  isActive ? 'bg-brand-surface dark:bg-brand-primary/30' : tool.iconBg
                }`}
              >
                {tool.icon}
              </div>
              <p
                className={`text-xs font-semibold leading-tight ${
                  isActive ? 'text-brand-primary dark:text-brand-teal' : 'text-gray-800 dark:text-gray-200'
                }`}
              >
                {tool.label}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-gray-400 dark:text-gray-500">
                {tool.description}
              </p>
            </Link>
          )
        })}
      </div>
      <p className="mt-3 text-[10px] leading-snug text-gray-400 dark:text-gray-500">
        <span className="font-medium text-gray-500 dark:text-gray-400">Diseño &amp; UX:</span> pantallas y kit
        visual. <span className="font-medium text-gray-500 dark:text-gray-400">Agentes:</span> mismo proyecto,
        conversaciones por rol (Arquitecto, QA…). La fase actual sigue en el stepper.
      </p>
    </div>
  )
}
