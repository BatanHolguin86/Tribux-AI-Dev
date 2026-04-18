import { describe, it, expect } from 'vitest'
import { buildAutoFixPrompt } from '@/lib/ai/prompts/auto-fix-agent'

describe('auto-fix agent prompt', () => {
  it('builds prompt with error message', () => {
    const prompt = buildAutoFixPrompt({
      errorMessage: 'Cannot read property "id" of undefined',
    })

    expect(prompt).toContain('Cannot read property')
    expect(prompt).toContain('Lead Developer')
    expect(prompt).toContain('Analiza la causa raiz')
    expect(prompt).toContain('JSON')
  })

  it('includes stack trace when provided', () => {
    const prompt = buildAutoFixPrompt({
      errorMessage: 'TypeError',
      stackTrace: 'at src/lib/utils.ts:42:10\nat src/app/api/route.ts:15:5',
    })

    expect(prompt).toContain('Stack trace')
    expect(prompt).toContain('src/lib/utils.ts:42')
  })

  it('includes affected URL when provided', () => {
    const prompt = buildAutoFixPrompt({
      errorMessage: '500 error',
      affectedUrl: '/api/projects/abc/phases/4/chat',
    })

    expect(prompt).toContain('/api/projects/abc/phases/4/chat')
  })

  it('includes related file contents', () => {
    const prompt = buildAutoFixPrompt({
      errorMessage: 'Error',
      relatedFiles: [
        { path: 'src/lib/utils.ts', content: 'export function foo() { return bar.id }' },
      ],
    })

    expect(prompt).toContain('src/lib/utils.ts')
    expect(prompt).toContain('export function foo')
  })

  it('includes repo structure when provided', () => {
    const prompt = buildAutoFixPrompt({
      errorMessage: 'Error',
      repoStructure: 'src/app/\nsrc/lib/\nsrc/components/',
    })

    expect(prompt).toContain('src/app/')
    expect(prompt).toContain('src/lib/')
  })

  it('requests JSON response format', () => {
    const prompt = buildAutoFixPrompt({ errorMessage: 'Error' })
    expect(prompt).toContain('"analysis"')
    expect(prompt).toContain('"file"')
    expect(prompt).toContain('"fix"')
    expect(prompt).toContain('"commit_message"')
    expect(prompt).toContain('"severity"')
    expect(prompt).toContain('"confidence"')
  })
})
