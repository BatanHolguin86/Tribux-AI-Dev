'use client'

type DocumentHeaderProps = {
  title: string
  version: number
  status: string
  isEditing: boolean
  onToggleEdit: () => void
}

export function DocumentHeader({
  title,
  version,
  status,
  isEditing,
  onToggleEdit,
}: DocumentHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-xs text-gray-400">v{version}</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
              status === 'approved'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {status === 'approved' ? 'Aprobado' : 'Borrador'}
          </span>
        </div>
      </div>
      <button
        onClick={onToggleEdit}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
      >
        {isEditing ? 'Ver formateado' : 'Editar'}
      </button>
    </div>
  )
}
