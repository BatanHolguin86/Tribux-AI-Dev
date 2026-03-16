'use client'

import React from 'react'
import { formatRelativeDate } from '@/lib/utils'

type ChatMessageProps = {
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIdx = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    const italicMatch = remaining.match(/\*(.+?)\*/)

    const bold = boldMatch?.index ?? Infinity
    const italic = italicMatch?.index ?? Infinity

    if (bold === Infinity && italic === Infinity) {
      parts.push(remaining)
      break
    }

    if (bold <= italic && boldMatch) {
      if (boldMatch.index! > 0) parts.push(remaining.slice(0, boldMatch.index!))
      parts.push(<strong key={keyIdx++} className="font-semibold">{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch.index! + boldMatch[0].length)
    } else if (italicMatch) {
      if (italicMatch.index! > 0) parts.push(remaining.slice(0, italicMatch.index!))
      parts.push(<em key={keyIdx++}>{italicMatch[1]}</em>)
      remaining = remaining.slice(italicMatch.index! + italicMatch[0].length)
    }
  }

  return parts
}

function renderMarkdown(text: string, isUser: boolean): React.ReactNode {
  // Split into paragraphs (double newline) then process each paragraph
  const paragraphs = text.split(/\n{2,}/)

  return paragraphs.map((paragraph, pi) => {
    const lines = paragraph.split('\n')

    // Check if it's a list block
    const isList = lines.every((l) => l.startsWith('- ') || l.startsWith('* ') || /^\d+\.\s/.test(l) || !l.trim())
    if (isList && lines.some((l) => l.trim())) {
      const items = lines.filter((l) => l.trim())
      const isNumbered = items.some((l) => /^\d+\.\s/.test(l))
      const Tag = isNumbered ? 'ol' : 'ul'
      return (
        <Tag key={pi} className={`my-1.5 space-y-0.5 pl-4 ${isNumbered ? 'list-decimal' : 'list-disc'} ${isUser ? 'marker:text-violet-200' : 'marker:text-gray-400'}`}>
          {items.map((item, li) => (
            <li key={li} className="pl-0.5">
              {renderInline(item.replace(/^[-*]\s|^\d+\.\s/, ''))}
            </li>
          ))}
        </Tag>
      )
    }

    // Regular paragraph — join lines with <br />
    return (
      <p key={pi} className={pi > 0 ? 'mt-2' : ''}>
        {lines.map((line, li) => (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {renderInline(line)}
          </React.Fragment>
        ))}
      </p>
    )
  })
}

export function ChatMessage({ role, content, createdAt }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold shadow-sm ${
          isUser
            ? 'bg-violet-600 text-white'
            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 ring-1 ring-gray-200'
        }`}
      >
        {isUser ? 'Tu' : 'AI'}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[80%] min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-violet-600 text-white'
              : 'rounded-tl-sm bg-gray-50 text-gray-800 ring-1 ring-gray-100'
          }`}
        >
          {renderMarkdown(content, isUser)}
        </div>
        {createdAt && (
          <p className={`mt-1 text-[10px] text-gray-400 ${isUser ? 'text-right' : ''}`}>
            {formatRelativeDate(createdAt)}
          </p>
        )}
      </div>
    </div>
  )
}
