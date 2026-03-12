import { createClient } from '@/lib/supabase/server'

const CHAT_BUCKET = 'project-chat'

export type ChatAttachmentMetadata = {
  id: string
  filename: string
  mimeType: string
  size: number
  path: string
  created_at: string
}

export async function uploadChatAttachment(
  projectId: string,
  threadId: string,
  file: File,
): Promise<ChatAttachmentMetadata> {
  const supabase = await createClient()

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const path = `projects/${projectId}/chat-attachments/${threadId}/${id}-${safeName}`

  const { error } = await supabase.storage.from(CHAT_BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
  })

  if (error) {
    throw new Error(`Failed to upload chat attachment: ${error.message}`)
  }

  return {
    id,
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    path,
    created_at: createdAt,
  }
}

