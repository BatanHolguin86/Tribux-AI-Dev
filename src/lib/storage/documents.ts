import { createClient } from '@/lib/supabase/server'

const DOCUMENTS_BUCKET = 'project-documents'
const DESIGNS_BUCKET = 'project-designs'

export async function uploadDocument(
  projectId: string,
  path: string,
  content: string,
): Promise<string> {
  const supabase = await createClient()
  const fullPath = `projects/${projectId}/${path}`

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(fullPath, content, {
      contentType: 'text/markdown',
      upsert: true,
    })

  if (error) throw new Error(`Failed to upload document: ${error.message}`)
  return fullPath
}

export async function getDocument(
  projectId: string,
  path: string,
): Promise<string> {
  const supabase = await createClient()
  const fullPath = `projects/${projectId}/${path}`

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(fullPath)

  if (error) throw new Error(`Failed to download document: ${error.message}`)
  return await data.text()
}

export async function getSignedUrl(
  bucket: 'documents' | 'designs',
  path: string,
  expiresIn = 3600,
): Promise<string> {
  const supabase = await createClient()
  const bucketName = bucket === 'documents' ? DOCUMENTS_BUCKET : DESIGNS_BUCKET

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(path, expiresIn)

  if (error) throw new Error(`Failed to create signed URL: ${error.message}`)
  return data.signedUrl
}
