import { create } from 'zustand'
import type { Phase02Section, SectionStatus } from '@/types/conversation'
import type { ProjectDocument } from '@/types/document'

type Phase02Store = {
  activeSection: Phase02Section
  sectionStatuses: Record<Phase02Section, SectionStatus>
  activeDocument: ProjectDocument | null
  isGenerating: boolean
  setActiveSection: (section: Phase02Section) => void
  setSectionStatus: (section: Phase02Section, status: SectionStatus) => void
  approveSection: (section: Phase02Section) => void
  setDocument: (doc: ProjectDocument | null) => void
  setIsGenerating: (val: boolean) => void
}

export const usePhase02Store = create<Phase02Store>((set) => ({
  activeSection: 'system_architecture',
  sectionStatuses: {
    system_architecture: 'pending',
    database_design: 'pending',
    api_design: 'pending',
    architecture_decisions: 'pending',
  },
  activeDocument: null,
  isGenerating: false,
  setActiveSection: (section) => set({ activeSection: section }),
  setSectionStatus: (section, status) =>
    set((state) => ({
      sectionStatuses: { ...state.sectionStatuses, [section]: status },
    })),
  approveSection: (section) =>
    set((state) => ({
      sectionStatuses: { ...state.sectionStatuses, [section]: 'approved' },
    })),
  setDocument: (doc) => set({ activeDocument: doc }),
  setIsGenerating: (val) => set({ isGenerating: val }),
}))
