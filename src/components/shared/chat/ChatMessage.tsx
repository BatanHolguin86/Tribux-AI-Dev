'use client'

import { formatRelativeDate } from '@/lib/utils'

type ChatMessageProps = {
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

export function ChatMessage({ role, content, createdAt }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isUser ? 'bg-gray-200 text-gray-600' : 'bg-violet-100 text-violet-600'
        }`}
      >
        {isUser ? 'Tu' : 'AI'}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-2.5 text-sm ${
            isUser
              ? 'rounded-br-md bg-violet-600 text-white'
              : 'rounded-bl-md bg-gray-100 text-gray-800'
          }`}
        >
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
        {createdAt && (
          <p className={`mt-1 text-xs text-gray-400 ${isUser ? 'text-right' : ''}`}>
            {formatRelativeDate(createdAt)}
          </p>
        )}
      </div>
    </div>
  )
}
