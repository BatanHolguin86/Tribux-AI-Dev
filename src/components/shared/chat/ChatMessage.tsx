'use client'

import React from 'react'
import { formatRelativeDate } from '@/lib/utils'

type ChatMessageProps = {
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Process inline bold and italic
    const processed = line
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')

    if (processed !== line) {
      return <span key={i} dangerouslySetInnerHTML={{ __html: processed }} />
    }
    return <span key={i}>{line}</span>
  })
}

export function ChatMessage({ role, content, createdAt }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          isUser ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {isUser ? 'Tu' : 'AI'}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-md bg-violet-600 text-white'
              : 'rounded-tl-md bg-gray-100 text-gray-800'
          }`}
        >
          <div className="whitespace-pre-wrap [&_b]:font-semibold [&_i]:italic">
            {renderMarkdown(content)}
          </div>
        </div>
        {createdAt && (
          <p className={`mt-0.5 text-[10px] text-gray-400 ${isUser ? 'text-right' : ''}`}>
            {formatRelativeDate(createdAt)}
          </p>
        )}
      </div>
    </div>
  )
}
