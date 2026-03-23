import { describe, it, expect, vi, afterEach } from 'vitest'
import { cn, formatRelativeDate, slugify } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('px-4', 'py-2')
    expect(result).toBe('px-4 py-2')
  })

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', 'visible')
    expect(result).toBe('base visible')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    const result = cn('px-4', 'px-8')
    expect(result).toBe('px-8')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })

  it('handles undefined and null inputs', () => {
    const result = cn('base', undefined, null, 'end')
    expect(result).toBe('base end')
  })

  it('handles array inputs via clsx', () => {
    const result = cn(['foo', 'bar'])
    expect(result).toBe('foo bar')
  })
})

describe('formatRelativeDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Ahora" for dates less than 1 minute ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-22T12:00:30Z'))

    const result = formatRelativeDate(new Date('2026-03-22T12:00:00Z'))
    expect(result).toBe('Ahora')
  })

  it('returns minutes format for dates less than 1 hour ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-22T12:05:00Z'))

    const result = formatRelativeDate(new Date('2026-03-22T12:00:00Z'))
    expect(result).toBe('Hace 5 min')
  })

  it('returns hours format for dates less than 24 hours ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-22T15:00:00Z'))

    const result = formatRelativeDate(new Date('2026-03-22T12:00:00Z'))
    expect(result).toBe('Hace 3h')
  })

  it('returns days format for dates less than 7 days ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-25T12:00:00Z'))

    const result = formatRelativeDate(new Date('2026-03-22T12:00:00Z'))
    expect(result).toBe('Hace 3d')
  })

  it('returns formatted date for dates 7+ days ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01T12:00:00Z'))

    const result = formatRelativeDate(new Date('2026-03-15T12:00:00Z'))
    // Should be a localized date string (e.g., "15 mar" or similar depending on locale)
    expect(typeof result).toBe('string')
    expect(result).not.toMatch(/^Hace/)
    expect(result).not.toBe('Ahora')
  })

  it('accepts string dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-22T12:10:00Z'))

    const result = formatRelativeDate('2026-03-22T12:00:00Z')
    expect(result).toBe('Hace 10 min')
  })

  it('accepts Date objects', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-22T14:00:00Z'))

    const result = formatRelativeDate(new Date('2026-03-22T12:00:00Z'))
    expect(result).toBe('Hace 2h')
  })
})

describe('slugify', () => {
  it('converts text to lowercase', () => {
    expect(slugify('HELLO')).toBe('hello')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world')
  })

  it('removes accents/diacritics', () => {
    expect(slugify('cafe con leche')).toBe('cafe-con-leche')
    expect(slugify('diseno')).toBe('diseno')
    expect(slugify('nino')).toBe('nino')
  })

  it('removes accented characters properly', () => {
    expect(slugify('telefono movil')).toBe('telefono-movil')
    expect(slugify('Diseno Grafico')).toBe('diseno-grafico')
  })

  it('replaces special characters with hyphens', () => {
    expect(slugify('hello@world!')).toBe('hello-world')
  })

  it('removes leading and trailing hyphens', () => {
    expect(slugify('-hello-')).toBe('hello')
    expect(slugify('!hello!')).toBe('hello')
  })

  it('collapses multiple non-alphanumeric chars to single hyphen', () => {
    expect(slugify('hello   world')).toBe('hello-world')
    expect(slugify('hello---world')).toBe('hello-world')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('handles numeric input', () => {
    expect(slugify('version 2.0')).toBe('version-2-0')
  })
})
