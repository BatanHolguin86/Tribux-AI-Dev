'use client'

import React, { useRef, useEffect, useState } from 'react'
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
        <code key={keyIdx++} className="rounded bg-violet-50 px-2 py-0.5 font-mono text-xs text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
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

/** Detects full HTML documents */
function isFullHtmlDocument(content: string): boolean {
  const trimmed = content.trim()
  return trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<!doctype')
}

/** Detects HTML snippets with multiple tags and class attributes (e.g. Tailwind wireframes) */
function isHtmlSnippet(content: string): boolean {
  const tagMatches = content.match(/<(?:div|section|nav|header|main|footer|button|form|input|article|aside|ul|ol|table|img|svg|span|p|h[1-6])\b[^>]*>/gi)
  return (tagMatches?.length ?? 0) >= 3
}

/** Wraps an HTML snippet in a full document with Tailwind CDN for iframe rendering */
function wrapInHtmlDocument(snippet: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>* { font-family: 'Inter', sans-serif; } body { margin: 0; }</style>
</head>
<body class="bg-white p-4">
${snippet}
</body>
</html>`
}

function HtmlPreview({ content }: { content: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(400)
  const [showCode, setShowCode] = useState(false)

  // Ensure content is a full document for iframe rendering
  const fullHtml = isFullHtmlDocument(content) ? content : wrapInHtmlDocument(content)

  useEffect(() => {
    if (!iframeRef.current) return
    function handleLoad() {
      try {
        const doc = iframeRef.current?.contentDocument
        if (doc?.body) {
          setHeight(Math.max(doc.body.scrollHeight + 20, 200))
        }
      } catch { /* cross-origin */ }
    }
    const iframe = iframeRef.current
    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [fullHtml])

  return (
    <div className="my-2 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vista previa</span>
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-[10px] font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
        >
          {showCode ? 'Ver diseño' : 'Ver código'}
        </button>
      </div>
      {showCode ? (
        <pre className="overflow-x-auto p-3 text-xs leading-relaxed bg-gray-900 dark:bg-gray-950 max-h-[400px] overflow-y-auto">
          <code className="font-mono text-gray-100">{content}</code>
        </pre>
      ) : (
        <div className="flex justify-center bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={fullHtml}
            className="w-full border-0 bg-white"
            style={{ height, maxHeight: 800 }}
            sandbox="allow-scripts"
            title="Design preview"
          />
        </div>
      )}
    </div>
  )
}

/**
 * Extracts raw HTML blocks from text that aren't inside code fences.
 * Returns segments of type 'text', 'code', or 'html'.
 */
function extractHtmlBlocks(
  text: string,
): Array<{ type: 'text' | 'html'; content: string }> {
  // Find contiguous blocks of HTML tags in plain text
  // Match from the first HTML tag to the last closing tag
  const htmlBlockRegex = /(<(?:div|section|nav|header|main|footer|article|aside|body|html)\b[^>]*>[\s\S]*?<\/(?:div|section|nav|header|main|footer|article|aside|body|html)>)/gi

  const segments: Array<{ type: 'text' | 'html'; content: string }> = []
  let lastIndex = 0
  let match

  // Reset regex
  const regex = new RegExp(htmlBlockRegex.source, 'gi')
  while ((match = regex.exec(text)) !== null) {
    // Only treat as HTML if it has enough tags (not just a single inline tag)
    if (!isHtmlSnippet(match[1])) continue

    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).trim()
      if (before) segments.push({ type: 'text', content: before })
    }
    segments.push({ type: 'html', content: match[1] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim()
    if (remaining) segments.push({ type: 'text', content: remaining })
  }

  // If no HTML blocks were found but the whole text is HTML-like, treat it as one block
  if (segments.length === 0 && isHtmlSnippet(text)) {
    return [{ type: 'html', content: text }]
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }]
}

function renderMarkdown(text: string, isUser: boolean): React.ReactNode {
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
      // Render HTML in code fences as visual preview
      const looksLikeHtml =
        segment.lang === 'html' ||
        (!segment.lang && (isFullHtmlDocument(segment.content) || isHtmlSnippet(segment.content)))
      if (looksLikeHtml) {
        return <HtmlPreview key={si} content={segment.content} />
      }
      return (
        <pre key={si} className="my-2 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs leading-relaxed dark:bg-gray-950">
          <code className="font-mono text-gray-100">{segment.content}</code>
        </pre>
      )
    }

    // For text segments: check if they contain raw HTML blocks (agent didn't use code fences)
    const subSegments = extractHtmlBlocks(segment.content)
    const hasHtml = subSegments.some((s) => s.type === 'html')

    if (hasHtml) {
      return (
        <React.Fragment key={si}>
          {subSegments.map((sub, ssi) => {
            if (sub.type === 'html') {
              return <HtmlPreview key={`${si}-html-${ssi}`} content={sub.content} />
            }
            return renderTextContent(sub.content, isUser, `${si}-${ssi}`)
          })}
        </React.Fragment>
      )
    }

    return renderTextContent(segment.content, isUser, String(si))
  })
}

function renderTextContent(text: string, isUser: boolean, keyPrefix: string): React.ReactNode {
  const paragraphs = text.split(/\n{2,}/)

  return paragraphs.map((paragraph, pi) => {
    const trimmed = paragraph.trim()
    if (!trimmed) return null

    if (/^-{3,}$/.test(trimmed)) {
      return <hr key={`${keyPrefix}-${pi}`} className="my-3 border-gray-200 dark:border-gray-700" />
    }

    const h1Match = trimmed.match(/^#\s+(.+)/)
    if (h1Match) {
      return (
        <h2 key={`${keyPrefix}-${pi}`} className="mt-4 mb-2 text-sm font-bold text-gray-900 dark:text-gray-100">
          {renderInline(h1Match[1])}
        </h2>
      )
    }

    const h2Match = trimmed.match(/^##\s+(.+)/)
    if (h2Match) {
      return (
        <h3 key={`${keyPrefix}-${pi}`} className="mt-4 mb-2 text-sm font-bold text-gray-900 dark:text-gray-100">
          {renderInline(h2Match[1])}
        </h3>
      )
    }

    const h3Match = trimmed.match(/^###\s+(.+)/)
    if (h3Match) {
      return (
        <h4 key={`${keyPrefix}-${pi}`} className="mt-3 mb-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200">
          {renderInline(h3Match[1])}
        </h4>
      )
    }

    const h4Match = trimmed.match(/^####\s+(.+)/)
    if (h4Match) {
      return (
        <h5 key={`${keyPrefix}-${pi}`} className="mt-2 mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
          {renderInline(h4Match[1])}
        </h5>
      )
    }

    const lines = paragraph.split('\n')

    const nonEmptyLines = lines.filter((l) => l.trim())
    const isList = nonEmptyLines.length > 0 && nonEmptyLines.every(
      (l) => l.trimStart().startsWith('- ') || l.trimStart().startsWith('* ') || /^\s*\d+\.\s/.test(l) || l.trimStart().startsWith('- [ ]') || l.trimStart().startsWith('- [x]')
    )

    if (isList) {
      const items = nonEmptyLines
      const isNumbered = items.some((l) => /^\s*\d+\.\s/.test(l))
      const Tag = isNumbered ? 'ol' : 'ul'
      return (
        <Tag
          key={`${keyPrefix}-${pi}`}
          className={`my-1.5 space-y-1 pl-4 ${isNumbered ? 'list-decimal' : 'list-disc'} ${
            isUser ? 'marker:text-violet-300' : 'marker:text-violet-500 dark:marker:text-violet-400'
          }`}
        >
          {items.map((item, li) => {
            const cleaned = item.replace(/^\s*[-*]\s(\[[ x]\]\s?)?|^\s*\d+\.\s/, '')
            const isChecked = item.includes('[x]')
            const isCheckbox = item.includes('[ ]') || item.includes('[x]')
            return (
              <li key={li} className="pl-0.5 text-sm">
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

    return (
      <p key={`${keyPrefix}-${pi}`} className={pi > 0 ? 'mt-2' : ''}>
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
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          isUser
            ? 'bg-violet-600 text-white'
            : 'bg-violet-50 ring-1 ring-violet-100 dark:bg-violet-900/30 dark:ring-violet-800/50'
        }`}
      >
        {isUser ? 'Tú' : '🧠'}
      </div>

      <div className={`max-w-[80%] min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-violet-600 text-white'
              : 'rounded-tl-sm bg-gray-50 text-gray-700 ring-1 ring-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700'
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
