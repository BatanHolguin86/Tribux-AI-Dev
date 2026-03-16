'use client'

import { useState } from 'react'
import { DocumentHeader } from './DocumentHeader'
import { DocumentViewer } from './DocumentViewer'
import { DocumentEditor } from './DocumentEditor'

type DocumentPanelProps = {
  projectId: string
  title: string
  document: {
    id: string
    content: string | null
    version: number
    status: string
  } | null
  apiBasePath?: string
}

export function DocumentPanel({ projectId, title, document, apiBasePath }: DocumentPanelProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (!document) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Conversa con el orquestador para generar este documento.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const docApiPath = apiBasePath
    ? `${apiBasePath}/${document.id}`
    : `/api/projects/${projectId}/documents/${document.id}`

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <DocumentHeader
        title={title}
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
