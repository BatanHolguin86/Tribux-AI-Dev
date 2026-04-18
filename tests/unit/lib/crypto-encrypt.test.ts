import { describe, it, expect, vi } from 'vitest'

describe('encrypt/decrypt', () => {
  it('round-trips correctly', async () => {
    // Set a test encryption key (64 hex chars = 32 bytes)
    vi.stubEnv('PLATFORM_ENCRYPTION_KEY', 'a'.repeat(64))

    const { encrypt, decrypt } = await import('@/lib/crypto/encrypt')

    const plaintext = 'ghp_test_token_123456'
    const encrypted = encrypt(plaintext)

    expect(encrypted).not.toBe(plaintext)
    expect(encrypted).toContain(':') // format: iv:tag:data

    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(plaintext)

    vi.unstubAllEnvs()
  })

  it('encrypted format is iv:tag:ciphertext', async () => {
    vi.stubEnv('PLATFORM_ENCRYPTION_KEY', 'b'.repeat(64))

    const { encrypt } = await import('@/lib/crypto/encrypt')
    const encrypted = encrypt('test')
    const parts = encrypted.split(':')

    expect(parts).toHaveLength(3)
    // Each part is base64
    for (const part of parts) {
      expect(part.length).toBeGreaterThan(0)
    }

    vi.unstubAllEnvs()
  })

  it('different plaintexts produce different ciphertexts', async () => {
    vi.stubEnv('PLATFORM_ENCRYPTION_KEY', 'c'.repeat(64))

    const { encrypt } = await import('@/lib/crypto/encrypt')
    const e1 = encrypt('token_a')
    const e2 = encrypt('token_b')

    expect(e1).not.toBe(e2)

    vi.unstubAllEnvs()
  })

  it('same plaintext produces different ciphertexts (random IV)', async () => {
    vi.stubEnv('PLATFORM_ENCRYPTION_KEY', 'd'.repeat(64))

    const { encrypt } = await import('@/lib/crypto/encrypt')
    const e1 = encrypt('same_token')
    const e2 = encrypt('same_token')

    // Different IVs → different ciphertext
    expect(e1).not.toBe(e2)

    vi.unstubAllEnvs()
  })
})
