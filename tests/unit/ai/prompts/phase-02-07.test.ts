import { describe, it, expect } from 'vitest'
import {
  buildPhase02Prompt,
  buildDocumentGenerationPrompt,
  PHASE02_SECTIONS,
  SECTION_LABELS as PHASE02_LABELS,
  SECTION_DOC_NAMES,
} from '@/lib/ai/prompts/phase-02'
import type { Phase02Section } from '@/types/conversation'
import {
  PHASE03_SECTIONS,
  SECTION_LABELS as PHASE03_LABELS,
  CATEGORY_CONFIGS as PHASE03_CONFIGS,
} from '@/lib/ai/prompts/phase-03'
import type { Phase03Section } from '@/lib/ai/prompts/phase-03'
import {
  PHASE05_SECTIONS,
  SECTION_LABELS as PHASE05_LABELS,
  CATEGORY_CONFIGS as PHASE05_CONFIGS,
} from '@/lib/ai/prompts/phase-05'
import type { Phase05Section } from '@/lib/ai/prompts/phase-05'
import {
  PHASE06_SECTIONS,
  SECTION_LABELS as PHASE06_LABELS,
  CATEGORY_CONFIGS as PHASE06_CONFIGS,
} from '@/lib/ai/prompts/phase-06'
import type { Phase06Section } from '@/lib/ai/prompts/phase-06'
import {
  PHASE07_SECTIONS,
  SECTION_LABELS as PHASE07_LABELS,
  CATEGORY_CONFIGS as PHASE07_CONFIGS,
} from '@/lib/ai/prompts/phase-07'
import type { Phase07Section } from '@/lib/ai/prompts/phase-07'

// --- Phase 02 context type matching the source ---
type Phase02Context = {
  name: string
  description: string | null
  industry: string | null
  persona: string | null
  approvedSections: string[]
  discoveryDocs: string
  featureSpecs: string
  designArtifactsSummary: string
}

const basePhase02Context: Phase02Context = {
  name: 'TestProject',
  description: 'A SaaS for testing',
  industry: 'Technology',
  persona: 'Startup founder',
  approvedSections: [],
  discoveryDocs: '### Discovery\nBrief aprobado del proyecto...',
  featureSpecs: '### Feature Auth\nUser can login...',
  designArtifactsSummary: '',
}

// =============================================================================
// Phase 02 — buildPhase02Prompt
// =============================================================================

describe('buildPhase02Prompt', () => {
  it('returns a non-empty string for system_architecture', () => {
    const prompt = buildPhase02Prompt('system_architecture', basePhase02Context)
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(300)
  })

  it('includes CTO Virtual base prompt', () => {
    const prompt = buildPhase02Prompt('system_architecture', basePhase02Context)
    expect(prompt).toContain('ROL: Eres el CTO Virtual de Tribux')
  })

  it('injects project name into the prompt', () => {
    const prompt = buildPhase02Prompt('database_design', basePhase02Context)
    expect(prompt).toContain('Nombre: TestProject')
  })

  it('injects description, industry and persona', () => {
    const prompt = buildPhase02Prompt('api_design', basePhase02Context)
    expect(prompt).toContain('Descripcion: A SaaS for testing')
    expect(prompt).toContain('Industria: Technology')
    expect(prompt).toContain('Perfil del usuario: Startup founder')
  })

  it('uses placeholders for null optional fields', () => {
    const ctx: Phase02Context = {
      ...basePhase02Context,
      description: null,
      industry: null,
      persona: null,
    }
    const prompt = buildPhase02Prompt('system_architecture', ctx)
    expect(prompt).toContain('Descripcion: No proporcionada aun')
    expect(prompt).toContain('Industria: No especificada')
    expect(prompt).toContain('Perfil del usuario: No especificado')
  })

  it('includes approved sections when present', () => {
    const ctx: Phase02Context = {
      ...basePhase02Context,
      approvedSections: ['System Architecture', 'Database Design'],
    }
    const prompt = buildPhase02Prompt('api_design', ctx)
    expect(prompt).toContain('SECCIONES DE ARCHITECTURE YA APROBADAS: System Architecture, Database Design')
  })

  it('does not include approved sections text when empty', () => {
    const prompt = buildPhase02Prompt('system_architecture', basePhase02Context)
    expect(prompt).not.toContain('SECCIONES DE ARCHITECTURE YA APROBADAS')
  })

  it('includes discovery docs when provided', () => {
    const prompt = buildPhase02Prompt('system_architecture', basePhase02Context)
    expect(prompt).toContain('DOCUMENTOS DE DISCOVERY (Phase 00 aprobados)')
    expect(prompt).toContain('Brief aprobado del proyecto')
  })

  it('omits discovery docs section when empty', () => {
    const ctx: Phase02Context = { ...basePhase02Context, discoveryDocs: '' }
    const prompt = buildPhase02Prompt('system_architecture', ctx)
    expect(prompt).not.toContain('DOCUMENTOS DE DISCOVERY')
  })

  it('includes feature specs when provided', () => {
    const prompt = buildPhase02Prompt('database_design', basePhase02Context)
    expect(prompt).toContain('SPECS DE FEATURES (Phase 01')
    expect(prompt).toContain('Feature Auth')
  })

  it('omits feature specs section when empty', () => {
    const ctx: Phase02Context = { ...basePhase02Context, featureSpecs: '' }
    const prompt = buildPhase02Prompt('database_design', ctx)
    expect(prompt).not.toContain('SPECS DE FEATURES')
  })

  it('includes the [SECTION_READY] instruction', () => {
    const prompt = buildPhase02Prompt('system_architecture', basePhase02Context)
    expect(prompt).toContain('[SECTION_READY]')
  })

  it('contains Phase 02 header', () => {
    const prompt = buildPhase02Prompt('api_design', basePhase02Context)
    expect(prompt).toContain('FASE ACTIVA: Phase 02')
    expect(prompt).toContain('Architecture & Design')
  })

  it.each(PHASE02_SECTIONS as Phase02Section[])(
    'generates a valid prompt for section %s',
    (section) => {
      const prompt = buildPhase02Prompt(section, basePhase02Context)
      expect(prompt).toContain('CONTEXTO DEL PROYECTO:')
      expect(prompt).toContain('OBJETIVO:')
      expect(prompt).toContain('ESTRUCTURA DEL DOCUMENTO A GENERAR:')
      expect(prompt.length).toBeGreaterThan(200)
    }
  )

  it('system_architecture prompt includes architecture-specific content', () => {
    const prompt = buildPhase02Prompt('system_architecture', basePhase02Context)
    expect(prompt).toContain('System Architecture')
    expect(prompt).toContain('Tech Stack')
    expect(prompt).toContain('Security Model')
  })

  it('database_design prompt includes DB-specific content', () => {
    const prompt = buildPhase02Prompt('database_design', basePhase02Context)
    expect(prompt).toContain('Database Design')
    expect(prompt).toContain('RLS')
    expect(prompt).toContain('Migration Plan')
  })

  it('api_design prompt includes API-specific content', () => {
    const prompt = buildPhase02Prompt('api_design', basePhase02Context)
    expect(prompt).toContain('API Design')
    expect(prompt).toContain('Error Handling')
    expect(prompt).toContain('Rate Limiting')
  })

  it('architecture_decisions prompt includes ADR content', () => {
    const prompt = buildPhase02Prompt('architecture_decisions', basePhase02Context)
    expect(prompt).toContain('Architecture Decision')
    expect(prompt).toContain('ADR-001')
    expect(prompt).toContain('Opciones Consideradas')
  })

  it('includes design hub correlation when no artifacts yet', () => {
    const prompt = buildPhase02Prompt('system_architecture', basePhase02Context)
    expect(prompt).toMatch(/CORRELACION CON DISEÑO|DISEÑO & UX/i)
  })

  it('includes design artifact summary when provided', () => {
    const ctx: Phase02Context = {
      ...basePhase02Context,
      designArtifactsSummary:
        '- **Login** (wireframe, draft)\n  Resumen visual: form email password',
    }
    const prompt = buildPhase02Prompt('api_design', ctx)
    expect(prompt).toContain('ARTEFACTOS DE DISEÑO')
    expect(prompt).toContain('Login')
  })
})

// =============================================================================
// Phase 02 — buildDocumentGenerationPrompt
// =============================================================================

describe('buildDocumentGenerationPrompt (Phase 02)', () => {
  it('returns a non-empty string', () => {
    const prompt = buildDocumentGenerationPrompt('system_architecture', basePhase02Context)
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
  })

  it('includes CTO role reference', () => {
    const prompt = buildDocumentGenerationPrompt('database_design', basePhase02Context)
    expect(prompt).toContain('CTO Virtual de Tribux')
  })

  it('injects project name', () => {
    const prompt = buildDocumentGenerationPrompt('api_design', basePhase02Context)
    expect(prompt).toContain('Nombre: TestProject')
  })

  it('uses placeholders for null fields', () => {
    const ctx: Phase02Context = {
      ...basePhase02Context,
      description: null,
      industry: null,
    }
    const prompt = buildDocumentGenerationPrompt('system_architecture', ctx)
    expect(prompt).toContain('Descripcion: No proporcionada')
    expect(prompt).toContain('Industria: No especificada')
  })

  it('includes discovery docs context when provided', () => {
    const prompt = buildDocumentGenerationPrompt('system_architecture', basePhase02Context)
    expect(prompt).toContain('DOCUMENTOS DE DISCOVERY APROBADOS')
    expect(prompt).toContain('Brief aprobado del proyecto')
  })

  it('omits discovery docs when empty', () => {
    const ctx: Phase02Context = { ...basePhase02Context, discoveryDocs: '' }
    const prompt = buildDocumentGenerationPrompt('system_architecture', ctx)
    expect(prompt).not.toContain('DOCUMENTOS DE DISCOVERY APROBADOS')
  })

  it('includes feature specs when provided', () => {
    const prompt = buildDocumentGenerationPrompt('database_design', basePhase02Context)
    expect(prompt).toContain('SPECS DE FEATURES APROBADOS')
    expect(prompt).toContain('Feature Auth')
  })

  it('omits feature specs when empty', () => {
    const ctx: Phase02Context = { ...basePhase02Context, featureSpecs: '' }
    const prompt = buildDocumentGenerationPrompt('database_design', ctx)
    expect(prompt).not.toContain('SPECS DE FEATURES APROBADOS')
  })

  it('includes section title and output structure', () => {
    const prompt = buildDocumentGenerationPrompt('api_design', basePhase02Context)
    expect(prompt).toContain('SECCION: API Design')
    expect(prompt).toContain('ESTRUCTURA REQUERIDA:')
  })

  it.each(PHASE02_SECTIONS as Phase02Section[])(
    'generates valid document prompt for %s',
    (section) => {
      const prompt = buildDocumentGenerationPrompt(section, basePhase02Context)
      expect(prompt).toContain('CONTEXTO DEL PROYECTO:')
      expect(prompt).toContain('INSTRUCCIONES:')
      expect(prompt).toContain('Markdown')
      expect(prompt.length).toBeGreaterThan(100)
    }
  )
})

// =============================================================================
// Phase 02 — exports
// =============================================================================

describe('Phase 02 exports', () => {
  it('PHASE02_SECTIONS contains 4 sections', () => {
    expect(PHASE02_SECTIONS).toHaveLength(4)
    expect(PHASE02_SECTIONS).toContain('system_architecture')
    expect(PHASE02_SECTIONS).toContain('database_design')
    expect(PHASE02_SECTIONS).toContain('api_design')
    expect(PHASE02_SECTIONS).toContain('architecture_decisions')
  })

  it('SECTION_LABELS has a label for each section', () => {
    expect(PHASE02_LABELS.system_architecture).toBe('System Architecture')
    expect(PHASE02_LABELS.database_design).toBe('Database Design')
    expect(PHASE02_LABELS.api_design).toBe('API Design')
    expect(PHASE02_LABELS.architecture_decisions).toBe('Architecture Decisions')
  })

  it('SECTION_DOC_NAMES has a filename for each section', () => {
    expect(SECTION_DOC_NAMES.system_architecture).toBe('01-system-architecture.md')
    expect(SECTION_DOC_NAMES.database_design).toBe('02-database-design.md')
    expect(SECTION_DOC_NAMES.api_design).toBe('03-api-design.md')
    expect(SECTION_DOC_NAMES.architecture_decisions).toBe('04-architecture-decisions.md')
  })
})

// =============================================================================
// Phase 03 — exports and structure
// =============================================================================

describe('Phase 03 exports', () => {
  it('PHASE03_SECTIONS contains 6 sections', () => {
    expect(PHASE03_SECTIONS).toHaveLength(6)
    expect(PHASE03_SECTIONS).toContain('repository')
    expect(PHASE03_SECTIONS).toContain('database')
    expect(PHASE03_SECTIONS).toContain('authentication')
    expect(PHASE03_SECTIONS).toContain('hosting')
    expect(PHASE03_SECTIONS).toContain('environment')
    expect(PHASE03_SECTIONS).toContain('verification')
  })

  it('SECTION_LABELS has a label for each Phase03 section', () => {
    expect(PHASE03_LABELS.repository).toBe('Repository')
    expect(PHASE03_LABELS.database).toBe('Database')
    expect(PHASE03_LABELS.authentication).toBe('Authentication')
    expect(PHASE03_LABELS.hosting).toBe('Hosting')
    expect(PHASE03_LABELS.environment).toBe('Environment Variables')
    expect(PHASE03_LABELS.verification).toBe('Verification')
  })

  it('CATEGORY_CONFIGS has config for each Phase03 section', () => {
    for (const section of PHASE03_SECTIONS) {
      const config = PHASE03_CONFIGS[section]
      expect(config).toBeDefined()
      expect(config.title).toBeTruthy()
      expect(config.description).toBeTruthy()
      expect(config.icon).toBeTruthy()
      expect(Array.isArray(config.items)).toBe(true)
      expect(config.items.length).toBeGreaterThan(0)
    }
  })

  it.each(PHASE03_SECTIONS as Phase03Section[])(
    'Phase03 section "%s" has checklist items with label and description',
    (section) => {
      const config = PHASE03_CONFIGS[section]
      for (const item of config.items) {
        expect(item.label).toBeTruthy()
        expect(typeof item.label).toBe('string')
        expect(item.description).toBeTruthy()
        expect(typeof item.description).toBe('string')
      }
    }
  )

  it('repository section includes GitHub and commit items', () => {
    const items = PHASE03_CONFIGS.repository.items.map((i) => i.label)
    expect(items.some((l) => l.toLowerCase().includes('repositorio'))).toBe(true)
    expect(items.some((l) => l.toLowerCase().includes('commit'))).toBe(true)
  })

  it('database section includes migration and security items', () => {
    const items = PHASE03_CONFIGS.database.items.map((i) => i.label)
    expect(items.some((l) => l.toLowerCase().includes('migraciones'))).toBe(true)
    expect(items.some((l) => l.toLowerCase().includes('seguridad'))).toBe(true)
  })
})

// =============================================================================
// Phase 05 — exports and structure
// =============================================================================

describe('Phase 05 exports', () => {
  it('PHASE05_SECTIONS contains 5 sections', () => {
    expect(PHASE05_SECTIONS).toHaveLength(5)
    expect(PHASE05_SECTIONS).toContain('test_plan')
    expect(PHASE05_SECTIONS).toContain('unit_tests')
    expect(PHASE05_SECTIONS).toContain('integration_tests')
    expect(PHASE05_SECTIONS).toContain('e2e_tests')
    expect(PHASE05_SECTIONS).toContain('qa_report')
  })

  it('SECTION_LABELS has a label for each Phase05 section', () => {
    expect(PHASE05_LABELS.test_plan).toBe('Test Plan')
    expect(PHASE05_LABELS.unit_tests).toBe('Unit Tests')
    expect(PHASE05_LABELS.integration_tests).toBe('Integration Tests')
    expect(PHASE05_LABELS.e2e_tests).toBe('E2E Tests')
    expect(PHASE05_LABELS.qa_report).toBe('QA Report')
  })

  it('CATEGORY_CONFIGS has config for each Phase05 section', () => {
    for (const section of PHASE05_SECTIONS) {
      const config = PHASE05_CONFIGS[section]
      expect(config).toBeDefined()
      expect(config.title).toBeTruthy()
      expect(config.description).toBeTruthy()
      expect(config.icon).toBeTruthy()
      expect(Array.isArray(config.items)).toBe(true)
      expect(config.items.length).toBeGreaterThan(0)
    }
  })

  it.each(PHASE05_SECTIONS as Phase05Section[])(
    'Phase05 section "%s" has checklist items with label and description',
    (section) => {
      const config = PHASE05_CONFIGS[section]
      for (const item of config.items) {
        expect(item.label).toBeTruthy()
        expect(typeof item.label).toBe('string')
        expect(item.description).toBeTruthy()
        expect(typeof item.description).toBe('string')
      }
    }
  )

  it('test_plan section mentions coverage', () => {
    const items = PHASE05_CONFIGS.test_plan.items.map((i) => i.label.toLowerCase())
    expect(items.some((l) => l.includes('cobertura'))).toBe(true)
  })

  it('qa_report section mentions performance audit', () => {
    const items = PHASE05_CONFIGS.qa_report.items.map((i) => i.label.toLowerCase())
    expect(items.some((l) => l.includes('lighthouse') || l.includes('performance'))).toBe(true)
  })
})

// =============================================================================
// Phase 06 — exports and structure
// =============================================================================

describe('Phase 06 exports', () => {
  it('PHASE06_SECTIONS contains 4 sections', () => {
    expect(PHASE06_SECTIONS).toHaveLength(4)
    expect(PHASE06_SECTIONS).toContain('deploy_production')
    expect(PHASE06_SECTIONS).toContain('monitoring')
    expect(PHASE06_SECTIONS).toContain('documentation')
    expect(PHASE06_SECTIONS).toContain('launch_checklist')
  })

  it('SECTION_LABELS has a label for each Phase06 section', () => {
    expect(PHASE06_LABELS.deploy_production).toBe('Deploy a Produccion')
    expect(PHASE06_LABELS.monitoring).toBe('Monitoring & Alertas')
    expect(PHASE06_LABELS.documentation).toBe('Documentacion Operacional')
    expect(PHASE06_LABELS.launch_checklist).toBe('Launch Checklist')
  })

  it('CATEGORY_CONFIGS has config for each Phase06 section', () => {
    for (const section of PHASE06_SECTIONS) {
      const config = PHASE06_CONFIGS[section]
      expect(config).toBeDefined()
      expect(config.title).toBeTruthy()
      expect(config.description).toBeTruthy()
      expect(config.icon).toBeTruthy()
      expect(Array.isArray(config.items)).toBe(true)
      expect(config.items.length).toBeGreaterThan(0)
    }
  })

  it.each(PHASE06_SECTIONS as Phase06Section[])(
    'Phase06 section "%s" has checklist items with label and description',
    (section) => {
      const config = PHASE06_CONFIGS[section]
      for (const item of config.items) {
        expect(item.label).toBeTruthy()
        expect(typeof item.label).toBe('string')
        expect(item.description).toBeTruthy()
        expect(typeof item.description).toBe('string')
      }
    }
  )

  it('deploy_production section includes SSL and migration items', () => {
    const items = PHASE06_CONFIGS.deploy_production.items.map((i) => i.label.toLowerCase())
    expect(items.some((l) => l.includes('ssl'))).toBe(true)
    expect(items.some((l) => l.includes('migraciones'))).toBe(true)
  })

  it('monitoring section includes Sentry', () => {
    const labels = PHASE06_CONFIGS.monitoring.items.map((i) => i.label.toLowerCase())
    expect(labels.some((l) => l.includes('sentry'))).toBe(true)
  })

  it('launch_checklist includes Lighthouse score check', () => {
    const items = PHASE06_CONFIGS.launch_checklist.items.map((i) => i.label.toLowerCase())
    expect(items.some((l) => l.includes('lighthouse'))).toBe(true)
  })
})

// =============================================================================
// Phase 07 — exports and structure
// =============================================================================

describe('Phase 07 exports', () => {
  it('PHASE07_SECTIONS contains 4 sections', () => {
    expect(PHASE07_SECTIONS).toHaveLength(4)
    expect(PHASE07_SECTIONS).toContain('feedback')
    expect(PHASE07_SECTIONS).toContain('metrics')
    expect(PHASE07_SECTIONS).toContain('backlog')
    expect(PHASE07_SECTIONS).toContain('retrospective')
  })

  it('SECTION_LABELS has a label for each Phase07 section', () => {
    expect(PHASE07_LABELS.feedback).toBe('Feedback de Usuarios')
    expect(PHASE07_LABELS.metrics).toBe('Metricas de Producto')
    expect(PHASE07_LABELS.backlog).toBe('Backlog Priorizado')
    expect(PHASE07_LABELS.retrospective).toBe('Retrospectiva')
  })

  it('CATEGORY_CONFIGS has config for each Phase07 section', () => {
    for (const section of PHASE07_SECTIONS) {
      const config = PHASE07_CONFIGS[section]
      expect(config).toBeDefined()
      expect(config.title).toBeTruthy()
      expect(config.description).toBeTruthy()
      expect(config.icon).toBeTruthy()
      expect(Array.isArray(config.items)).toBe(true)
      expect(config.items.length).toBeGreaterThan(0)
    }
  })

  it.each(PHASE07_SECTIONS as Phase07Section[])(
    'Phase07 section "%s" has checklist items with label and description',
    (section) => {
      const config = PHASE07_CONFIGS[section]
      for (const item of config.items) {
        expect(item.label).toBeTruthy()
        expect(typeof item.label).toBe('string')
        expect(item.description).toBeTruthy()
        expect(typeof item.description).toBe('string')
      }
    }
  )

  it('feedback section mentions user feedback collection', () => {
    const items = PHASE07_CONFIGS.feedback.items.map((i) => i.label.toLowerCase())
    expect(items.some((l) => l.includes('feedback'))).toBe(true)
  })

  it('metrics section references DAU or MAU or retention', () => {
    const labels = PHASE07_CONFIGS.metrics.items.map((i) => i.label.toLowerCase())
    expect(
      labels.some((l) => l.includes('dau') || l.includes('mau') || l.includes('retention'))
    ).toBe(true)
  })

  it('backlog section mentions prioritization framework', () => {
    const items = PHASE07_CONFIGS.backlog.items.map((i) => i.label.toLowerCase())
    expect(items.some((l) => l.includes('ice') || l.includes('rice') || l.includes('priorizar'))).toBe(true)
  })

  it('retrospective section mentions CLAUDE.md update', () => {
    const items = PHASE07_CONFIGS.retrospective.items.map((i) => i.label)
    expect(items.some((l) => l.includes('CLAUDE.md'))).toBe(true)
  })
})
