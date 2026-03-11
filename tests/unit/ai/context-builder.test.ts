import { describe, it, expect } from 'vitest'
import { truncateText } from '@/lib/ai/context-builder'

describe('truncateText', () => {
  it('retorna el texto completo cuando es menor o igual a maxChars', () => {
    const text = 'Hola mundo'
    expect(truncateText(text, 20)).toBe('Hola mundo')
    expect(truncateText(text, 10)).toBe('Hola mundo')
  })

  it('trunca y añade sufijo cuando excede maxChars', () => {
    const text = 'Este es un texto mas largo que el limite'
    const result = truncateText(text, 15)
    expect(result).toBe('Este es un text\n...[truncado]')
    expect(result.length).toBe(15 + '\n...[truncado]'.length)
  })

  it('respeta maxChars exactos', () => {
    const text = 'abcdefghij'
    expect(truncateText(text, 5)).toBe('abcde\n...[truncado]')
  })

  it('maneja texto vacio', () => {
    expect(truncateText('', 100)).toBe('')
  })

  it('maneja maxChars cero', () => {
    const text = 'Algo'
    expect(truncateText(text, 0)).toBe('\n...[truncado]')
  })

  it('formato de truncado incluye salto de linea y sufijo esperado', () => {
    const longText = 'A'.repeat(100)
    const result = truncateText(longText, 50)
    expect(result).toMatch(/\n\.\.\.\[truncado\]$/)
    expect(result.startsWith('A'.repeat(50))).toBe(true)
  })

  it('preserva Unicode y caracteres especiales en el corte', () => {
    const text = 'Hola ñoño café'
    const result = truncateText(text, 10)
    expect(result).toBe('Hola ñoño \n...[truncado]')
  })
})
