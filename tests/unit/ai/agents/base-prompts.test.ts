import { describe, it, expect } from 'vitest'
import { CTO_VIRTUAL_PROMPT } from '@/lib/ai/agents/cto-virtual'
import { PRODUCT_ARCHITECT_PROMPT } from '@/lib/ai/agents/product-architect'
import { SYSTEM_ARCHITECT_PROMPT } from '@/lib/ai/agents/system-architect'
import { UI_UX_DESIGNER_PROMPT } from '@/lib/ai/agents/ui-ux-designer'
import { LEAD_DEVELOPER_PROMPT } from '@/lib/ai/agents/lead-developer'
import { DB_ADMIN_PROMPT } from '@/lib/ai/agents/db-admin'
import { QA_ENGINEER_PROMPT } from '@/lib/ai/agents/qa-engineer'
import { DEVOPS_ENGINEER_PROMPT } from '@/lib/ai/agents/devops-engineer'

const PROMPTS = [
  { name: 'CTO Virtual', prompt: CTO_VIRTUAL_PROMPT },
  { name: 'Product Architect', prompt: PRODUCT_ARCHITECT_PROMPT },
  { name: 'System Architect', prompt: SYSTEM_ARCHITECT_PROMPT },
  { name: 'UI/UX Designer', prompt: UI_UX_DESIGNER_PROMPT },
  { name: 'Lead Developer', prompt: LEAD_DEVELOPER_PROMPT },
  { name: 'DB Admin', prompt: DB_ADMIN_PROMPT },
  { name: 'QA Engineer', prompt: QA_ENGINEER_PROMPT },
  { name: 'DevOps Engineer', prompt: DEVOPS_ENGINEER_PROMPT },
] as const

describe('Agent base prompts', () => {
  it.each(PROMPTS)('$name incluye ROL y estructura minima del prompt', ({ name, prompt }) => {
    expect(prompt).toMatch(/ROL:/i)
    expect(prompt.length).toBeGreaterThan(200)
    if (name === 'CTO Virtual') {
      expect(prompt).toMatch(/IDENTIDAD Y PERSONALIDAD|GATES Y APROBACION/i)
      expect(prompt).toMatch(/FORMATO DE RESPUESTA|---OPTIONS---/i)
    } else {
      expect(prompt).toMatch(/ESPECIALIDAD:/i)
      expect(prompt).toMatch(/INSTRUCCIONES:/i)
    }
  })

  it('cada prompt incluye STACK TECNICO o referencia al stack', () => {
    const allPrompts = PROMPTS.map((p) => p.prompt)
    for (const prompt of allPrompts) {
      expect(prompt).toMatch(/STACK|Next\.js|Supabase|TypeScript/i)
    }
  })

  it('CTO Virtual incluye lista de agentes para delegacion', () => {
    expect(CTO_VIRTUAL_PROMPT).toContain('Product Architect')
    expect(CTO_VIRTUAL_PROMPT).toContain('System Architect')
    expect(CTO_VIRTUAL_PROMPT).toContain('Lead Developer')
    expect(CTO_VIRTUAL_PROMPT).toContain('DB Admin')
    expect(CTO_VIRTUAL_PROMPT).toContain('QA Engineer')
    expect(CTO_VIRTUAL_PROMPT).toContain('DevOps Engineer')
  })

  it('todos los prompts indican espanol para comunicacion', () => {
    for (const { prompt } of PROMPTS) {
      expect(prompt).toMatch(/espanol|es-LATAM/i)
    }
  })
})
