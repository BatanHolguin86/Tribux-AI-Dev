'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type ProjectToolsProps = {
  projectId: string
}

const tools = [
  { id: 'designs', label: 'Design Generator', icon: '🎨', path: 'designs' },
  { id: 'agents', label: 'Agentes AI', icon: '🤖', path: 'agents' },
]

export function ProjectTools({ projectId }: ProjectToolsProps) {
  const pathname = usePathname()

  return (
    <nav className="rounded-lg border border-gray-200 bg-white p-3">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Herramientas
      </h3>
      <div className="space-y-1">
        {tools.map((tool) => {
          const href = `/projects/${projectId}/${tool.path}`
          const isActive = pathname.includes(`/${tool.path}`)

          return (
            <Link
              key={tool.id}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-violet-50 text-violet-700 ring-2 ring-violet-400 ring-offset-1'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{tool.icon}</span>
              <span className="flex-1 truncate text-xs font-medium">{tool.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
