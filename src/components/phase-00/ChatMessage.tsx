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
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold shadow-sm dark:shadow-gray-900/20 ${
          isUser
            ? 'bg-[#0F2B46] text-white'
            : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-600'
        }`}
      >
        {isUser ? 'Tu' : 'AI'}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[80%] min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-[#0F2B46] text-white'
              : 'rounded-tl-sm bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 ring-1 ring-gray-100 dark:ring-gray-800'
          }`}
        >
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
        {createdAt && (
          <p className={`mt-1 text-xs text-gray-400 dark:text-gray-500 ${isUser ? 'text-right' : ''}`}>
            {formatRelativeDate(createdAt)}
          </p>
        )}
      </div>
    </div>
  )
}
