import { describe, it, expect } from 'vitest'
import { founderLabel } from '@/hooks/useFounderMode'

describe('founderLabel', () => {
  it('translates technical terms for founders', () => {
    expect(founderLabel('Requirements & Spec', true)).toBe('Features de tu app')
    expect(founderLabel('Architecture & Design', true)).toBe('Diseno de tu app')
    expect(founderLabel('Environment Setup', true)).toBe('Preparar tu app')
    expect(founderLabel('Core Development', true)).toBe('Construir tu app')
    expect(founderLabel('Testing & QA', true)).toBe('Verificar que funciona')
    expect(founderLabel('Launch & Deployment', true)).toBe('Publicar tu app')
    expect(founderLabel('Iteration & Growth', true)).toBe('Mejorar tu app')
  })

  it('returns original label for non-founders', () => {
    expect(founderLabel('Requirements & Spec', false)).toBe('Requirements & Spec')
    expect(founderLabel('Architecture & Design', false)).toBe('Architecture & Design')
  })

  it('returns original label when no translation exists', () => {
    expect(founderLabel('Some Unknown Label', true)).toBe('Some Unknown Label')
  })

  it('translates KIRO Specs', () => {
    expect(founderLabel('KIRO Specs', true)).toBe('Features de tu app')
  })

  it('translates infrastructure terms', () => {
    expect(founderLabel('System Architecture', true)).toBe('Estructura del sistema')
    expect(founderLabel('Database Design', true)).toBe('Base de datos')
    expect(founderLabel('API Design', true)).toBe('Conexiones')
  })

  it('translates testing terms', () => {
    expect(founderLabel('Unit Tests', true)).toBe('Verificaciones basicas')
    expect(founderLabel('Integration Tests', true)).toBe('Verificaciones de conexion')
    expect(founderLabel('E2E Tests', true)).toBe('Verificaciones completas')
  })

  it('translates deploy terms', () => {
    expect(founderLabel('CI (GitHub Actions)', true)).toBe('Verificacion automatica')
    expect(founderLabel('Deploy (Vercel)', true)).toBe('Publicacion')
  })
})
