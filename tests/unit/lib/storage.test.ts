import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so mock variables are available when vi.mock factory runs
const {
  mockUpload,
  mockDownload,
  mockCreateSignedUrl,
  mockFrom,
  MOCK_UUID,
} = vi.hoisted(() => {
  const mockUpload = vi.fn()
  const mockDownload = vi.fn()
  const mockCreateSignedUrl = vi.fn()
  const mockFrom = vi.fn().mockImplementation(() => ({
    upload: mockUpload,
    download: mockDownload,
    createSignedUrl: mockCreateSignedUrl,
  }))
  const MOCK_UUID = 'aaaa-bbbb-cccc-dddd'
  return { mockUpload, mockDownload, mockCreateSignedUrl, mockFrom, MOCK_UUID }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    storage: { from: mockFrom },
  }),
}))

// Mock crypto.randomUUID for chat-attachments
vi.stubGlobal('crypto', {
  ...globalThis.crypto,
  randomUUID: () => MOCK_UUID,
})

import { uploadDocument, getDocument, getSignedUrl } from '@/lib/storage/documents'
import { uploadChatAttachment } from '@/lib/storage/chat-attachments'

beforeEach(() => {
  vi.clearAllMocks()
  // Restore the from mock implementation after clearAllMocks
  mockFrom.mockImplementation(() => ({
    upload: mockUpload,
    download: mockDownload,
    createSignedUrl: mockCreateSignedUrl,
  }))
})

describe('uploadDocument', () => {
  it('uploads to the project-documents bucket with correct path', async () => {
    mockUpload.mockResolvedValue({ error: null })

    const result = await uploadDocument('proj-1', 'spec.md', '# Hello')

    expect(mockFrom).toHaveBeenCalledWith('project-documents')
    expect(mockUpload).toHaveBeenCalledWith(
      'projects/proj-1/spec.md',
      '# Hello',
      { contentType: 'text/markdown', upsert: true },
    )
    expect(result).toBe('projects/proj-1/spec.md')
  })

  it('throws on upload error', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'Bucket not found' } })

    await expect(uploadDocument('proj-1', 'doc.md', 'content')).rejects.toThrow(
      'Failed to upload document: Bucket not found',
    )
  })
})

describe('getDocument', () => {
  it('downloads from the project-documents bucket', async () => {
    const blob = new Blob(['# Content'], { type: 'text/markdown' })
    mockDownload.mockResolvedValue({ data: blob, error: null })

    const result = await getDocument('proj-1', 'spec.md')

    expect(mockFrom).toHaveBeenCalledWith('project-documents')
    expect(mockDownload).toHaveBeenCalledWith('projects/proj-1/spec.md')
    expect(result).toBe('# Content')
  })

  it('throws on download error', async () => {
    mockDownload.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    await expect(getDocument('proj-1', 'missing.md')).rejects.toThrow(
      'Failed to download document: Not found',
    )
  })
})

describe('getSignedUrl', () => {
  it('creates signed URL for documents bucket', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed' },
      error: null,
    })

    const url = await getSignedUrl('documents', 'projects/proj-1/file.md')

    expect(mockFrom).toHaveBeenCalledWith('project-documents')
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('projects/proj-1/file.md', 3600)
    expect(url).toBe('https://example.com/signed')
  })

  it('creates signed URL for designs bucket', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/design-signed' },
      error: null,
    })

    const url = await getSignedUrl('designs', 'path/to/image.png', 7200)

    expect(mockFrom).toHaveBeenCalledWith('project-designs')
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('path/to/image.png', 7200)
    expect(url).toBe('https://example.com/design-signed')
  })

  it('uses default expiry of 3600 seconds', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed' },
      error: null,
    })

    await getSignedUrl('documents', 'some-path')

    expect(mockCreateSignedUrl).toHaveBeenCalledWith('some-path', 3600)
  })

  it('throws on signed URL error', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: 'Unauthorized' },
    })

    await expect(getSignedUrl('documents', 'path')).rejects.toThrow(
      'Failed to create signed URL: Unauthorized',
    )
  })
})

describe('uploadChatAttachment', () => {
  it('uploads file to project-chat bucket with sanitized name', async () => {
    mockUpload.mockResolvedValue({ error: null })

    const file = new File(['hello'], 'my file (1).txt', { type: 'text/plain' })
    const result = await uploadChatAttachment('proj-1', 'thread-1', file)

    expect(mockFrom).toHaveBeenCalledWith('project-chat')
    // Filename should have spaces and special chars replaced with underscores
    const expectedPath = `projects/proj-1/chat-attachments/thread-1/${MOCK_UUID}-my_file__1_.txt`
    expect(mockUpload).toHaveBeenCalledWith(expectedPath, file, {
      contentType: 'text/plain',
    })
    expect(result).toEqual({
      id: MOCK_UUID,
      filename: 'my file (1).txt',
      mimeType: 'text/plain',
      size: file.size,
      path: expectedPath,
      created_at: expect.any(String),
    })
  })

  it('defaults mimeType to application/octet-stream when file.type is empty', async () => {
    mockUpload.mockResolvedValue({ error: null })

    const file = new File(['data'], 'binary.bin', { type: '' })
    const result = await uploadChatAttachment('proj-1', 'thread-1', file)

    expect(mockUpload).toHaveBeenCalledWith(
      expect.any(String),
      file,
      { contentType: 'application/octet-stream' },
    )
    expect(result.mimeType).toBe('application/octet-stream')
  })

  it('throws on upload error', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'Quota exceeded' } })

    const file = new File(['data'], 'big.zip', { type: 'application/zip' })
    await expect(uploadChatAttachment('proj-1', 'thread-1', file)).rejects.toThrow(
      'Failed to upload chat attachment: Quota exceeded',
    )
  })

  it('returns correct metadata shape', async () => {
    mockUpload.mockResolvedValue({ error: null })

    const file = new File(['test'], 'doc.pdf', { type: 'application/pdf' })
    const result = await uploadChatAttachment('proj-2', 'thread-5', file)

    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('filename', 'doc.pdf')
    expect(result).toHaveProperty('mimeType', 'application/pdf')
    expect(result).toHaveProperty('size')
    expect(result).toHaveProperty('path')
    expect(result).toHaveProperty('created_at')
    // created_at should be a valid ISO string
    expect(new Date(result.created_at).toISOString()).toBe(result.created_at)
  })
})
