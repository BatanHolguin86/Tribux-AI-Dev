import { describe, it, expect } from 'vitest'
import { parseDesignGenerateCommand } from '@/lib/design/parse-design-generate-command'

describe('parseDesignGenerateCommand', () => {
  it('parses wireframe with comma-separated screens', () => {
    const r = parseDesignGenerateCommand('[GENERAR wireframe] Login, Dashboard, Settings')
    expect(r).toEqual({
      type: 'wireframe',
      screens: ['Login', 'Dashboard', 'Settings'],
    })
  })

  it('parses mockup types case-insensitively', () => {
    const r = parseDesignGenerateCommand('[GENERAR MOCKUP_LOWFI] Checkout')
    expect(r).toEqual({ type: 'mockup_lowfi', screens: ['Checkout'] })
  })

  it('splits on " y " and semicolons', () => {
    const r = parseDesignGenerateCommand('[GENERAR mockup_highfi] Perfil y Ajustes; Admin')
    expect(r).toEqual({
      type: 'mockup_highfi',
      screens: ['Perfil', 'Ajustes', 'Admin'],
    })
  })

  it('returns null for normal chat', () => {
    expect(parseDesignGenerateCommand('Hola, mejora el contraste del CTA')).toBeNull()
  })

  it('returns null when no screens', () => {
    expect(parseDesignGenerateCommand('[GENERAR wireframe]')).toBeNull()
    expect(parseDesignGenerateCommand('[GENERAR wireframe]   ')).toBeNull()
  })
})
