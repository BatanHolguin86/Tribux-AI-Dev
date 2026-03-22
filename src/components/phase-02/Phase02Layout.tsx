'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { Phase02Section, SectionStatus } from '@/types/conversation'
import { SectionNav } from './SectionNav'
import { ChatPanel } from './ChatPanel'
import { DocumentPanel } from './DocumentPanel'
import { Phase02FinalGate } from './Phase02FinalGate'

type SectionData = {
  key: Phase02Section
  label: string
  status: SectionStatus
  messages: Array<{ role: string; content: string; created_at: string }>
  document: {
    id: string
    content: string | null
    version: number
    status: string
  } | null
}

type Phase02LayoutProps = {
  projectId: string
  sections: SectionData[]
  initialActiveSection: Phase02Section
  approvedDesigns: Array<{
    id: string
    screen_name: string
    type: string
    status: string
    created_at: string
  }>
}

export function Phase02Layout({
  projectId,
  sections: initialSections,
  initialActiveSection,
  approvedDesigns,
}: Phase02LayoutProps) {
  const [sections, setSections] = useState(initialSections)
  const [activeSection, setActiveSection] = useState<Phase02Section>(initialActiveSection)
  const [mobileTab, setMobileTab] = useState<'chat' | 'document'>('chat')

  const currentSection = sections.find((s) => s.key === activeSection)!
  const allApproved = sections.every((s) => s.status === 'approved')

  const handleSectionApproved = useCallback(() => {
    setSections((prev) =>
      prev.map((s) =>
        s.key === activeSection ? { ...s, status: 'approved' as SectionStatus } : s
      )
    )
  }, [activeSection])

  const handleDocumentGenerated = useCallback(() => {
    window.location.reload()
  }, [])

  const approvedCount = sections.filter((s) => s.status === 'approved').length
  const totalSections = sections.length

  return (
    <div>
      {/* Header: progreso + puente arquitectura/diseño */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {approvedCount} de {totalSections} secciones completadas
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-1.5 rounded-full bg-violet-600 transition-all"
                style={{ width: `${(approvedCount / totalSections) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {Math.round((approvedCount / totalSections) * 100)}%
            </span>
          </div>
        </div>

        {/* Architecture & Design summary */}
        <div className="grid w-full gap-3 text-xs text-gray-700 dark:text-gray-300 lg:w-auto lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Arquitectura
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/docs/02-architecture/system-architecture"
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                >
                  Diagrama de sistema
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/02-architecture/database-schema"
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                >
                  Esquema de base de datos
                </Link>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              ADRs clave
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/docs/02-architecture/decisions/ADR-001-stack-selection"
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                >
                  Stack selection
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/02-architecture/decisions/ADR-002-supabase-auth"
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                >
                  Supabase Auth
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/02-architecture/decisions/ADR-005-agent-architecture"
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                >
                  Agent architecture
                </Link>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Diseños UI/UX
            </p>
            {approvedDesigns.length === 0 ? (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Aún no hay diseños aprobados.{' '}
                <Link
                  href={`/projects/${projectId}/designs`}
                  className="font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                >
                  Generar diseños
                </Link>
              </p>
            ) : (
              <ul className="space-y-1">
                {approvedDesigns.slice(0, 3).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {d.screen_name || 'Pantalla sin nombre'}
                    </span>
                    <span className="rounded-full bg-green-100 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                      Aprobado
                    </span>
                  </li>
                ))}
                {approvedDesigns.length > 3 && (
                  <li className="text-[11px] text-gray-500 dark:text-gray-400">
                    +{approvedDesigns.length - 3} más
                  </li>
                )}
                <li>
                  <Link
                    href={`/projects/${projectId}/designs`}
                    className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                  >
                    Ver todos los diseños
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {allApproved ? (
        <Phase02FinalGate projectId={projectId} />
      ) : (
        <>
          {/* Mobile tabs */}
          <div className="mb-3 flex border-b border-gray-200 dark:border-gray-700 lg:hidden">
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mobileTab === 'chat'
                  ? 'border-b-2 border-violet-600 text-violet-700 dark:text-violet-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Conversacion
            </button>
            <button
              onClick={() => setMobileTab('document')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mobileTab === 'document'
                  ? 'border-b-2 border-violet-600 text-violet-700 dark:text-violet-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Documento
            </button>
          </div>

          {/* Desktop: split view */}
          <div className="flex h-[var(--content-height)] gap-4">
            {/* Left: Chat */}
            <div className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 lg:flex-[6] ${
              mobileTab !== 'chat' ? 'hidden lg:flex' : 'flex'
            }`}>
              <SectionNav
                sections={sections.map((s) => ({ key: s.key, status: s.status }))}
                activeSection={activeSection}
                onSelect={setActiveSection}
              />
              <ChatPanel
                projectId={projectId}
                section={activeSection}
                sectionStatus={currentSection.status}
                initialMessages={currentSection.messages}
                hasDocument={currentSection.document !== null}
                onSectionApproved={handleSectionApproved}
                onDocumentGenerated={handleDocumentGenerated}
              />
            </div>

            {/* Right: Document */}
            <div className={`lg:flex-[4] ${
              mobileTab !== 'document' ? 'hidden lg:flex' : 'flex'
            }`}>
              <DocumentPanel
                projectId={projectId}
                section={activeSection}
                document={currentSection.document}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
