'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type ProjectToolsProps = {
  projectId: string
}

const tools = [
  {
    id: 'designs',
    label: 'Design Generator',
    description: 'Wireframes y mockups desde specs',
    icon: '🎨',
    path: 'designs',
    gradient: 'from-pink-500/10 to-violet-500/10 dark:from-pink-500/5 dark:to-violet-500/5',
    iconBg: 'bg-pink-100 dark:bg-pink-900/30',
  },
  {
    id: 'agents',
    label: 'Agentes AI',
    description: 'CTO, Architect, QA y mas',
    icon: '🤖',
    path: 'agents',
    gradient: 'from-violet-500/10 to-blue-500/10 dark:from-violet-500/5 dark:to-blue-500/5',
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
  },
]

export function ProjectTools({ projectId }: ProjectToolsProps) {
  const pathname = usePathname()

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Herramientas
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
                  ? 'border-violet-300 dark:border-violet-700 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-900/10 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
              }`}
            >
              <div
                className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                  isActive ? 'bg-violet-100 dark:bg-violet-900/30' : tool.iconBg
                }`}
              >
                {tool.icon}
              </div>
              <p
                className={`text-xs font-semibold leading-tight ${
                  isActive ? 'text-violet-700 dark:text-violet-400' : 'text-gray-800 dark:text-gray-200'
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
    </div>
  )
}
