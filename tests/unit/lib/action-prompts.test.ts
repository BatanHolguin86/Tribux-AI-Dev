import { describe, it, expect } from 'vitest'
import {
  scaffoldProjectPrompt,
  applyDatabaseSchemaPrompt,
  configureAuthPrompt,
  generateEnvTemplatePrompt,
  generateTaskCodePrompt,
} from '@/lib/ai/prompts/action-prompts'

const ctx = { projectName: 'Test App', repoUrl: 'https://github.com/t/r', architecture: 'Next.js', features: 'Auth' }

describe('action prompts', () => {
  it('scaffoldProjectPrompt returns non-empty with project name', () => {
    const p = scaffoldProjectPrompt(ctx)
    expect(p.length).toBeGreaterThan(50)
    expect(p).toContain('Test App')
  })

  it('applyDatabaseSchemaPrompt returns non-empty', () => {
    const p = applyDatabaseSchemaPrompt(ctx)
    expect(p.length).toBeGreaterThan(50)
  })

  it('configureAuthPrompt returns non-empty', () => {
    const p = configureAuthPrompt(ctx)
    expect(p.length).toBeGreaterThan(50)
  })

  it('generateEnvTemplatePrompt returns non-empty', () => {
    const p = generateEnvTemplatePrompt(ctx)
    expect(p.length).toBeGreaterThan(50)
  })

  it('generateTaskCodePrompt returns non-empty', () => {
    const p = generateTaskCodePrompt({ ...ctx, taskKey: 'TASK-1', taskTitle: 'Test', taskDescription: 'Desc' })
    expect(p.length).toBeGreaterThan(50)
  })

  it('all prompts include project name', () => {
    const prompts = [scaffoldProjectPrompt(ctx), applyDatabaseSchemaPrompt(ctx), configureAuthPrompt(ctx), generateEnvTemplatePrompt(ctx)]
    for (const p of prompts) {
      expect(p).toContain('Test App')
    }
  })
})
