import { create } from 'zustand'
import type { KiroDocumentType } from '@/types/feature'

type FeatureState = {
  id: string
  name: string
  description: string | null
  status: string
  documents: Record<KiroDocumentType, {
    id: string
    content: string | null
    version: number
    status: string
  } | null>
  conversations: Record<KiroDocumentType, Array<{ role: string; content: string }>>
}

type Phase01Store = {
  features: FeatureState[]
  activeFeatureId: string | null
  activeDocType: KiroDocumentType
  setFeatures: (features: FeatureState[]) => void
  setActiveFeatureId: (id: string | null) => void
  setActiveDocType: (docType: KiroDocumentType) => void
  updateFeatureStatus: (featureId: string, status: string) => void
  updateFeatureDocument: (
    featureId: string,
    docType: KiroDocumentType,
    doc: { id: string; content: string | null; version: number; status: string },
  ) => void
}

export const usePhase01Store = create<Phase01Store>((set) => ({
  features: [],
  activeFeatureId: null,
  activeDocType: 'requirements',
  setFeatures: (features) => set({ features }),
  setActiveFeatureId: (id) => set({ activeFeatureId: id, activeDocType: 'requirements' }),
  setActiveDocType: (docType) => set({ activeDocType: docType }),
  updateFeatureStatus: (featureId, status) =>
    set((state) => ({
      features: state.features.map((f) =>
        f.id === featureId ? { ...f, status } : f
      ),
    })),
  updateFeatureDocument: (featureId, docType, doc) =>
    set((state) => ({
      features: state.features.map((f) =>
        f.id === featureId
          ? { ...f, documents: { ...f.documents, [docType]: doc } }
          : f
      ),
    })),
}))
