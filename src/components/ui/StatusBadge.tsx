'use client'

type BadgeVariant = 'completed' | 'in_progress' | 'pending' | 'blocked' | 'gate'

type StatusBadgeProps = {
  variant: BadgeVariant
  label?: string
  className?: string
}

const BADGE_CONFIG: Record<BadgeVariant, { dot: string; bg: string; text: string; defaultLabel: string }> = {
  completed: {
    dot: 'bg-[#10B981]',
    bg: 'bg-[#10B981]/10',
    text: 'text-[#10B981]',
    defaultLabel: 'Completada',
  },
  in_progress: {
    dot: 'bg-[#3B82F6]',
    bg: 'bg-[#3B82F6]/10',
    text: 'text-[#3B82F6]',
    defaultLabel: 'En progreso',
  },
  pending: {
    dot: 'bg-[#F97316]',
    bg: 'bg-[#F97316]/10',
    text: 'text-[#F97316]',
    defaultLabel: 'Pendiente aprobacion',
  },
  blocked: {
    dot: 'bg-[#EF4444]',
    bg: 'bg-[#EF4444]/10',
    text: 'text-[#EF4444]',
    defaultLabel: 'Bloqueada',
  },
  gate: {
    dot: 'bg-[#F97316]',
    bg: 'bg-[#F97316]/10',
    text: 'text-[#F97316]',
    defaultLabel: 'Gate pendiente',
  },
}

export function StatusBadge({ variant, label, className = '' }: StatusBadgeProps) {
  const config = BADGE_CONFIG[variant]

  return (
    <span role="status" className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} px-3 py-1 text-xs font-medium ${config.text} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {label ?? config.defaultLabel}
    </span>
  )
}
