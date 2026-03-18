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
    // Match inline code first, then bold, then italic
    const codeMatch = remaining.match(/`([^`]+)`/)
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/)

    const code = codeMatch?.index ?? Infinity
    const bold = boldMatch?.index ?? Infinity
    const italic = italicMatch?.index ?? Infinity

    const earliest = Math.min(code, bold, italic)
    if (earliest === Infinity) {
      parts.push(remaining)
      break
    }

    if (code <= bold && code <= italic && codeMatch) {
      if (codeMatch.index! > 0) parts.push(remaining.slice(0, codeMatch.index!))
      parts.push(
        <code key={keyIdx++} className="rounded bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 text-[12px] font-mono text-violet-700 dark:text-violet-300">
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch.index! + codeMatch[0].length)
    } else if (bold <= italic && boldMatch) {
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
  // First, extract code blocks to avoid parsing their content
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g
  const segments: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'code', content: match[2].trim(), lang: match[1] || undefined })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return segments.map((segment, si) => {
    if (segment.type === 'code') {
      return (
        <pre key={si} className="my-2 overflow-x-auto rounded-lg bg-gray-900 dark:bg-gray-950 p-3 text-[12px] leading-relaxed">
          <code className="text-gray-100 font-mono">{segment.content}</code>
        </pre>
      )
    }

    // Process text segments
    const paragraphs = segment.content.split(/\n{2,}/)

    return paragraphs.map((paragraph, pi) => {
      const trimmed = paragraph.trim()
      if (!trimmed) return null

      // Horizontal rule
      if (/^-{3,}$/.test(trimmed)) {
        return <hr key={`${si}-${pi}`} className="my-3 border-gray-200 dark:border-gray-700" />
      }

      // Headings
      const h2Match = trimmed.match(/^##\s+(.+)/)
      if (h2Match) {
        return (
          <h3 key={`${si}-${pi}`} className="mt-3 mb-1.5 text-[13px] font-bold text-gray-900 dark:text-gray-100">
            {renderInline(h2Match[1])}
          </h3>
        )
      }

      const h3Match = trimmed.match(/^###\s+(.+)/)
      if (h3Match) {
        return (
          <h4 key={`${si}-${pi}`} className="mt-2.5 mb-1 text-[13px] font-semibold text-gray-800 dark:text-gray-200">
            {renderInline(h3Match[1])}
          </h4>
        )
      }

      const h1Match = trimmed.match(/^#\s+(.+)/)
      if (h1Match) {
        return (
          <h2 key={`${si}-${pi}`} className="mt-3 mb-1.5 text-[14px] font-bold text-gray-900 dark:text-gray-100">
            {renderInline(h1Match[1])}
          </h2>
        )
      }

      const lines = paragraph.split('\n')

      // Check if it's a list block
      const nonEmptyLines = lines.filter((l) => l.trim())
      const isList = nonEmptyLines.length > 0 && nonEmptyLines.every(
        (l) => l.trimStart().startsWith('- ') || l.trimStart().startsWith('* ') || /^\s*\d+\.\s/.test(l) || l.trimStart().startsWith('- [ ]') || l.trimStart().startsWith('- [x]')
      )

      if (isList) {
        const items = nonEmptyLines
        const isNumbered = items.some((l) => /^\s*\d+\.\s/.test(l))
        const Tag = isNumbered ? 'ol' : 'ul'
        return (
          <Tag key={`${si}-${pi}`} className={`my-1.5 space-y-1 pl-4 ${isNumbered ? 'list-decimal' : 'list-disc'} ${isUser ? 'marker:text-violet-200' : 'marker:text-violet-400 dark:marker:text-violet-500'}`}>
            {items.map((item, li) => {
              const cleaned = item.replace(/^\s*[-*]\s(\[[ x]\]\s?)?|^\s*\d+\.\s/, '')
              const isChecked = item.includes('[x]')
              const isCheckbox = item.includes('[ ]') || item.includes('[x]')
              return (
                <li key={li} className="pl-0.5 text-[13px]">
                  {isCheckbox && (
                    <span className={`mr-1.5 inline-block ${isChecked ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {isChecked ? '✓' : '○'}
                    </span>
                  )}
                  {renderInline(cleaned)}
                </li>
              )
            })}
          </Tag>
        )
      }

      // Regular paragraph
      return (
        <p key={`${si}-${pi}`} className={pi > 0 ? 'mt-2' : ''}>
          {lines.map((line, li) => (
            <React.Fragment key={li}>
              {li > 0 && <br />}
              {renderInline(line)}
            </React.Fragment>
          ))}
        </p>
      )
    })
  })
}

export function ChatMessage({ role, content, createdAt }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          isUser
            ? 'bg-violet-600 text-white'
            : 'bg-violet-50 dark:bg-violet-900/30 ring-1 ring-violet-100 dark:ring-violet-800/50'
        }`}
      >
        {isUser ? 'Tú' : '🧠'}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[80%] min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-violet-600 text-white'
              : 'rounded-tl-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 ring-1 ring-gray-100 dark:ring-gray-700'
          }`}
        >
          {renderMarkdown(content, isUser)}
        </div>
        {createdAt && (
          <p className={`mt-1 text-[10px] text-gray-400 dark:text-gray-500 ${isUser ? 'text-right' : ''}`}>
            {formatRelativeDate(createdAt)}
          </p>
        )}
      </div>
    </div>
  )
}
