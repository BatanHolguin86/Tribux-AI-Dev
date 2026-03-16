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
    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">v{version}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            status === 'approved'
              ? 'bg-green-100 text-green-700 dark:text-green-400'
              : 'bg-amber-50 text-amber-600'
          }`}
        >
          {status === 'approved' ? 'Aprobado' : 'Borrador'}
        </span>
      </div>
      <button
        onClick={onToggleEdit}
        className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
      >
        {isEditing ? 'Vista previa' : 'Editar'}
      </button>
    </div>
  )
}
