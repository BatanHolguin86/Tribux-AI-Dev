'use client'

import React from 'react'

type DocumentViewerProps = {
  content: string
}

function renderInline(text: string) {
  // Process **bold** and *italic* inline
  const parts: Array<string | React.ReactElement> = []
  let remaining = text
  let keyIdx = 0

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index))
      }
      parts.push(<strong key={keyIdx++} className="font-semibold text-gray-900 dark:text-gray-100">{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
      continue
    }

    // No more matches
    parts.push(remaining)
    break
  }

  return parts
}

export function DocumentViewer({ content }: DocumentViewerProps) {
  if (!content) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        El documento aparecera aqui cuando se genere.
      </div>
    )
  }

  const lines = content.split('\n')
  const rendered = lines.map((line, i) => {
    // Horizontal rule
    if (/^---+$/.test(line.trim())) return <hr key={i} className="my-4 border-gray-200 dark:border-gray-700" />

    // Headings
    if (line.startsWith('### ')) return <h3 key={i} className="mt-5 mb-1.5 text-sm font-bold text-gray-900 dark:text-gray-100">{renderInline(line.slice(4))}</h3>
    if (line.startsWith('## ')) return <h2 key={i} className="mt-6 mb-2 text-base font-bold text-gray-900 dark:text-gray-100">{renderInline(line.slice(3))}</h2>
    if (line.startsWith('# ')) return <h1 key={i} className="mt-6 mb-2 text-lg font-display font-bold text-gray-900 dark:text-gray-100">{renderInline(line.slice(2))}</h1>

    // List items with bold
    if (line.startsWith('- ')) {
      return (
        <li key={i} className="ml-4 mt-1.5 list-disc text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {renderInline(line.slice(2))}
        </li>
      )
    }

    // Numbered list items
    if (/^\d+\.\s/.test(line)) {
      return (
        <li key={i} className="ml-4 mt-1.5 list-decimal text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {renderInline(line.replace(/^\d+\.\s/, ''))}
        </li>
      )
    }

    // Table rows
    if (line.startsWith('|')) {
      if (line.includes('---')) return null
      const cells = line.split('|').filter(Boolean).map((c) => c.trim())
      return (
        <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
          {cells.map((cell, j) => (
            <td key={j} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400">{renderInline(cell)}</td>
          ))}
        </tr>
      )
    }

    // Empty line
    if (!line.trim()) return <div key={i} className="h-3" />

    // Regular paragraph
    return <p key={i} className="mt-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{renderInline(line)}</p>
  })

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="prose-sm">{rendered}</div>
    </div>
  )
}
