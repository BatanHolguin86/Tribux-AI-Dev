import { create } from 'zustand'
import type { Phase00Section, SectionStatus } from '@/types/conversation'
import type { ProjectDocument } from '@/types/document'

type Phase00Store = {
  activeSection: Phase00Section
  sectionStatuses: Record<Phase00Section, SectionStatus>
  activeDocument: ProjectDocument | null
  isGenerating: boolean
  setActiveSection: (section: Phase00Section) => void
  setSectionStatus: (section: Phase00Section, status: SectionStatus) => void
  approveSection: (section: Phase00Section) => void
  setDocument: (doc: ProjectDocument | null) => void
  setIsGenerating: (val: boolean) => void
}

export const usePhase00Store = create<Phase00Store>((set) => ({
  activeSection: 'problem_statement',
  sectionStatuses: {
    problem_statement: 'pending',
    personas: 'pending',
    value_proposition: 'pending',
    metrics: 'pending',
    competitive_analysis: 'pending',
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
