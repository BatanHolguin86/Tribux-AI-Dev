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

  const completed = features.filter((f) => f.status === 'approved' || f.status === 'spec_complete').length

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-3 py-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Features</h3>
          <span className="text-xs text-gray-400">{completed}/{features.length}</span>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
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
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-violet-600 transition-colors hover:bg-violet-50"
          >
            <span>+</span> Agregar feature
          </button>
        )}
      </div>
    </div>
  )
}
