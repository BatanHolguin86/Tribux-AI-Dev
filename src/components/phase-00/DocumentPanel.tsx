'use client'

import { useState } from 'react'
import { SECTION_LABELS } from '@/lib/ai/prompts/phase-00'
import type { Phase00Section } from '@/types/conversation'
import { DocumentHeader } from './DocumentHeader'
import { DocumentViewer } from './DocumentViewer'
import { DocumentEditor } from './DocumentEditor'

type DocumentPanelProps = {
  projectId: string
  section: Phase00Section
  document: {
    id: string
    content: string | null
    version: number
    status: string
  } | null
}

export function DocumentPanel({ projectId, section, document }: DocumentPanelProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (!document) {
    return (
      <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">{SECTION_LABELS[section]}</h3>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div>
            <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              Conversa con el orquestador para generar este documento.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-white">
      <DocumentHeader
        title={SECTION_LABELS[section]}
        version={document.version}
        status={document.status}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
      />
      {isEditing ? (
        <DocumentEditor
          content={document.content ?? ''}
          documentId={document.id}
          projectId={projectId}
        />
      ) : (
        <DocumentViewer content={document.content ?? ''} />
      )}
    </div>
  )
}
