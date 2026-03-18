'use client'

import type { KiroDocumentType } from '@/types/feature'
import { KIRO_DOC_TYPES, KIRO_DOC_LABELS } from '@/lib/ai/prompts/phase-01'

type DocumentTypeNavProps = {
  documents: Record<KiroDocumentType, { status: string } | null>
  activeDocType: KiroDocumentType
  onSelect: (docType: KiroDocumentType) => void
}

function isDocAccessible(
  docType: KiroDocumentType,
  documents: Record<KiroDocumentType, { status: string } | null>,
): boolean {
  const idx = KIRO_DOC_TYPES.indexOf(docType)
  if (idx === 0) return true
  const prevType = KIRO_DOC_TYPES[idx - 1]
  return documents[prevType]?.status === 'approved'
}

export function DocumentTypeNav({ documents, activeDocType, onSelect }: DocumentTypeNavProps) {
  return (
    <div className="border-b border-gray-100">
      <div className="flex gap-1 px-3 py-2">
        {KIRO_DOC_TYPES.map((dt) => {
          const doc = documents[dt]
          const accessible = isDocAccessible(dt, documents)
          const isActive = dt === activeDocType
          const isApproved = doc?.status === 'approved'
          const isLocked = !accessible

          return (
            <button
              key={dt}
              onClick={() => accessible && onSelect(dt)}
              disabled={isLocked}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-violet-100 text-violet-700'
                  : isLocked
                    ? 'cursor-not-allowed text-gray-300'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isApproved ? (
                <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : isLocked ? (
                <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : null}
              {KIRO_DOC_LABELS[dt]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
