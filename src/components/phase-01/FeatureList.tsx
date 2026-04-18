'use client'

import { useState } from 'react'
import type { KiroDocumentType } from '@/types/feature'
import { FeatureItem } from './FeatureItem'
import { AddFeatureForm } from './AddFeatureForm'

type Feature = {
  id: string
  name: string
  status: string
  documents: Record<KiroDocumentType, { status: string } | null>
}

type FeatureListProps = {
  projectId: string
  features: Feature[]
  activeFeatureId: string | null
  onSelect: (featureId: string) => void
  onFeatureAdded: () => void
}

export function FeatureList({
  projectId,
  features,
  activeFeatureId,
  onSelect,
  onFeatureAdded,
}: FeatureListProps) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((f) => (
          <FeatureItem
            key={f.id}
            name={f.name}
            status={f.status}
            documents={f.documents}
            isActive={f.id === activeFeatureId}
            onClick={() => onSelect(f.id)}
          />
        ))}
      </div>

      {showAdd ? (
        <AddFeatureForm
          projectId={projectId}
          onCreated={() => {
            setShowAdd(false)
            onFeatureAdded()
          }}
          onCancel={() => setShowAdd(false)}
        />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-brand-primary transition-colors hover:border-brand-teal hover:bg-brand-surface/50 dark:border-gray-700 dark:text-brand-teal dark:hover:border-brand-primary dark:hover:bg-brand-navy/20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar feature
        </button>
      )}
    </div>
  )
}
