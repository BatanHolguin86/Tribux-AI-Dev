'use client'

import { SECTION_LABELS } from '@/lib/ai/prompts/phase-02'
import type { Phase02Section } from '@/types/conversation'
import { DocumentPanel as SharedDocumentPanel } from '@/components/shared/document/DocumentPanel'

type DocumentPanelProps = {
  projectId: string
  section: Phase02Section
  document: {
    id: string
    content: string | null
    version: number
    status: string
  } | null
}

export function DocumentPanel({ projectId, section, document }: DocumentPanelProps) {
  return (
    <SharedDocumentPanel
      projectId={projectId}
      title={SECTION_LABELS[section]}
      document={document}
    />
  )
}
