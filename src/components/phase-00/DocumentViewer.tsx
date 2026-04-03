'use client'

type DocumentViewerProps = {
  content: string
}

export function DocumentViewer({ content }: DocumentViewerProps) {
  if (!content) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        El documento aparecera aqui cuando se genere.
      </div>
    )
  }

  // Simple markdown rendering — headings, bold, lists, tables
  const lines = content.split('\n')
  const rendered = lines.map((line, i) => {
    // Headings
    if (line.startsWith('### ')) return <h3 key={i} className="mt-4 mb-2 text-sm font-semibold text-gray-900">{line.slice(4)}</h3>
    if (line.startsWith('## ')) return <h2 key={i} className="mt-5 mb-2 text-base font-bold text-gray-900">{line.slice(3)}</h2>
    if (line.startsWith('# ')) return <h1 key={i} className="mt-6 mb-3 text-lg font-display font-bold text-gray-900">{line.slice(2)}</h1>

    // List items
    if (line.startsWith('- **')) {
      const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/)
      if (match) {
        return (
          <li key={i} className="ml-4 mt-1 text-sm text-gray-700">
            <span className="font-semibold">{match[1]}</span>
            {match[2] && <>: {match[2]}</>}
          </li>
        )
      }
    }
    if (line.startsWith('- ')) return <li key={i} className="ml-4 mt-1 text-sm text-gray-700">{line.slice(2)}</li>
    if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 mt-1 list-decimal text-sm text-gray-700">{line.replace(/^\d+\.\s/, '')}</li>

    // Table rows
    if (line.startsWith('|')) {
      if (line.includes('---')) return null
      const cells = line.split('|').filter(Boolean).map((c) => c.trim())
      return (
        <tr key={i} className="border-b border-gray-100">
          {cells.map((cell, j) => (
            <td key={j} className="px-2 py-1 text-xs text-gray-600">{cell}</td>
          ))}
        </tr>
      )
    }

    // Empty line
    if (!line.trim()) return <div key={i} className="h-2" />

    // Regular paragraph
    return <p key={i} className="mt-1 text-sm text-gray-700">{line}</p>
  })

  return <div className="flex-1 overflow-y-auto px-4 py-3">{rendered}</div>
}
