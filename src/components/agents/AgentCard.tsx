'use client'

type AgentCardProps = {
  icon: string
  name: string
  specialty: string
  threadCount: number
  isActive: boolean
  isLocked: boolean
  onClick: () => void
}

export function AgentCard({
  icon,
  name,
  specialty,
  threadCount,
  isActive,
  isLocked,
  onClick,
}: AgentCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
        isActive
          ? 'border border-violet-300 bg-violet-50'
          : isLocked
            ? 'cursor-not-allowed opacity-50'
            : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg">
        {isLocked ? (
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ) : (
          icon
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        <p className="truncate text-xs text-gray-500">{specialty}</p>
      </div>
      {threadCount > 0 && !isLocked && (
        <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
          {threadCount}
        </span>
      )}
    </button>
  )
}
