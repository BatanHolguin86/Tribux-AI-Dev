type ProgressBarProps = {
  value: number
  size?: 'sm' | 'md'
}

export function ProgressBar({ value, size = 'sm' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${height}`}>
        <div
          className={`${height} rounded-full bg-gradient-to-r from-[#0EA5A3] to-indigo-500 transition-all`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{clamped}%</span>
    </div>
  )
}
