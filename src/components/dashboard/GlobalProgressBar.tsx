import type { ProjectWithProgress } from '@/types/project'
import { PHASE_NAMES } from '@/types/project'

type Props = { projects: ProjectWithProgress[] }

const PHASE_COLORS: Record<number, string> = {
  0: '#6366F1',
  1: '#8B5CF6',
  2: '#0EA5A3',
  3: '#0EA5A3',
  4: '#10B981',
  5: '#F59E0B',
  6: '#F97316',
  7: '#EF4444',
}

export function GlobalProgressBar({ projects }: Props) {
  const totalPhases = projects.length * 8
  const completedPhases = projects.reduce((sum, p) => sum + p.phases_completed, 0)
  const overallProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

  const phaseBreakdown = Array.from({ length: 8 }, (_, i) => {
    const completed = projects.filter((p) => {
      const phase = p.phases?.find((ph) => ph.phase_number === i)
      return phase?.status === 'completed'
    }).length
    return { phase: i, completed, total: projects.length, color: PHASE_COLORS[i] ?? '#6B7280' }
  })

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-[#0F2B46]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-[#0F2B46] dark:text-white">
          Progreso global
        </h3>
        <span className="rounded-full bg-[#E8F4F8] px-2.5 py-0.5 text-xs font-bold text-[#0F2B46] dark:bg-[#0EA5A3]/20 dark:text-[#0EA5A3]">
          {overallProgress}%
        </span>
      </div>

      <div className="flex gap-1">
        {phaseBreakdown.map((pb) => (
          <div
            key={pb.phase}
            className="flex-1"
            title={`${PHASE_NAMES[pb.phase]}: ${pb.completed}/${pb.total}`}
          >
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: pb.total > 0 ? `${(pb.completed / pb.total) * 100}%` : '0%',
                  backgroundColor: pb.color,
                }}
              />
            </div>
            <p className="mt-1 text-center text-[9px] text-gray-400 dark:text-gray-500">
              {String(pb.phase).padStart(2, '0')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
