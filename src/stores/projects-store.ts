import { create } from 'zustand'
import type { ProjectWithProgress } from '@/types/project'

type ProjectsStore = {
  projects: ProjectWithProgress[]
  setProjects: (projects: ProjectWithProgress[]) => void
  addProject: (project: ProjectWithProgress) => void
  updateProject: (id: string, updates: Partial<ProjectWithProgress>) => void
  archiveProject: (id: string) => void
  restoreProject: (id: string) => void
}

export const useProjectsStore = create<ProjectsStore>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  archiveProject: (id) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, status: 'archived' as const } : p
      ),
    })),
  restoreProject: (id) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, status: 'active' as const } : p
      ),
    })),
}))
