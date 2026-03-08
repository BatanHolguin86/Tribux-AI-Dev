'use client'

type AgentHeaderProps = {
  icon: string
  name: string
  specialty: string
  onNewThread: () => void
  isCreating: boolean
}

export function AgentHeader({ icon, name, specialty, onNewThread, isCreating }: AgentHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-lg">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{name}</h2>
          <p className="text-xs text-gray-500">{specialty}</p>
        </div>
      </div>
      <button
        onClick={onNewThread}
        disabled={isCreating}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {isCreating ? '...' : '+ Nueva conversacion'}
      </button>
    </div>
  )
}
