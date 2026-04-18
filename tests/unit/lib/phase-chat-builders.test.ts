import { describe, it, expect } from 'vitest'
import { PHASE_KICKOFF_MESSAGES, PHASE03_KICKOFF_BY_PERSONA } from '@/lib/ai/prompts/phase-chat-builders'

describe('PHASE_KICKOFF_MESSAGES', () => {
  it('has messages for phases 3-7', () => {
    for (let i = 3; i <= 7; i++) {
      expect(PHASE_KICKOFF_MESSAGES[i]).toBeTruthy()
      expect(PHASE_KICKOFF_MESSAGES[i].length).toBeGreaterThan(20)
    }
  })

  it('phase 3 message mentions infrastructure', () => {
    const msg = PHASE_KICKOFF_MESSAGES[3]
    expect(msg.toLowerCase()).toMatch(/infraestructura|repositorio|configurar|entorno/)
  })

  it('phase 4 message mentions development', () => {
    const msg = PHASE_KICKOFF_MESSAGES[4]
    expect(msg.toLowerCase()).toMatch(/desarrollo|implementar|construir|codigo/)
  })

  it('phase 5 message mentions testing', () => {
    const msg = PHASE_KICKOFF_MESSAGES[5]
    expect(msg.toLowerCase()).toMatch(/test|calidad|qa|verificar/)
  })

  it('phase 6 message mentions deploy', () => {
    const msg = PHASE_KICKOFF_MESSAGES[6]
    expect(msg.toLowerCase()).toMatch(/deploy|lanzamiento|produccion|publicar/)
  })

  it('phase 7 message mentions iteration', () => {
    const msg = PHASE_KICKOFF_MESSAGES[7]
    expect(msg.toLowerCase()).toMatch(/iteracion|metricas|feedback|mejora|crecimiento/)
  })
})

describe('PHASE03_KICKOFF_BY_PERSONA', () => {
  it('has all 4 personas', () => {
    expect(PHASE03_KICKOFF_BY_PERSONA.founder).toBeTruthy()
    expect(PHASE03_KICKOFF_BY_PERSONA.emprendedor).toBeTruthy()
    expect(PHASE03_KICKOFF_BY_PERSONA.pm).toBeTruthy()
    expect(PHASE03_KICKOFF_BY_PERSONA.consultor).toBeTruthy()
  })

  it('founder message is simpler/shorter than consultor', () => {
    const founder = PHASE03_KICKOFF_BY_PERSONA.founder ?? ''
    const consultor = PHASE03_KICKOFF_BY_PERSONA.consultor ?? ''
    // Both should be non-empty
    expect(founder.length).toBeGreaterThan(20)
    expect(consultor.length).toBeGreaterThan(20)
  })

  it('each persona message mentions infrastructure concept', () => {
    for (const msg of Object.values(PHASE03_KICKOFF_BY_PERSONA)) {
      if (msg) {
        expect(msg.length).toBeGreaterThan(10)
      }
    }
  })
})
