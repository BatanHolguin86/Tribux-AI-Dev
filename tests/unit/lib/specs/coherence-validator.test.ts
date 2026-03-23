import { describe, it, expect } from 'vitest'
import {
  validateDesignCoherence,
  validateSpecCoherence,
  validateRequirementsCoherence,
} from '@/lib/specs/coherence-validator'

describe('coherence-validator', () => {
  describe('validateDesignCoherence', () => {
    it('no reporta issues cuando no hay tablas', () => {
      const issues = validateDesignCoherence('# Design\nSin SQL.', '')
      expect(issues).toHaveLength(0)
    })

    it('detecta violacion de snake_case', () => {
      const content = '```sql\nCREATE TABLE UserProfiles (\n  id uuid\n);\n```'
      const issues = validateDesignCoherence(content, '')
      expect(issues.some((i) => i.type === 'naming_convention' && i.message.includes('snake_case'))).toBe(true)
    })

    it('acepta tablas en snake_case', () => {
      const content = '```sql\ncreate table user_profiles (\n  id uuid primary key\n);\n```'
      const issues = validateDesignCoherence(content, '')
      expect(issues).toHaveLength(0)
    })

    it('no reporta falso positivo en tablas con nombres similares pero distintos', () => {
      const current = 'create table users (id uuid)'
      const previous = 'create table user_profiles (id uuid)'
      const issues = validateDesignCoherence(current, previous)
      expect(issues.some((i) => i.type === 'duplicate_table')).toBe(false)
    })

    it('detecta tabla duplicada exacta entre current y previous', () => {
      const current = 'create table users (id uuid)'
      const previous = 'create table users (id uuid, name text)'
      const issues = validateDesignCoherence(current, previous)
      expect(issues.some((i) => i.type === 'duplicate_table')).toBe(true)
    })

    it('detecta tabla duplicada case-insensitive', () => {
      const current = 'CREATE TABLE Users (id uuid)'
      const previous = 'create table users (id uuid)'
      // Users violates snake_case AND is a duplicate
      const issues = validateDesignCoherence(current, previous)
      expect(issues.some((i) => i.type === 'duplicate_table')).toBe(true)
    })

    it('no trata nombres en backticks como tablas (columnas, referencias)', () => {
      const current = 'Usa `patient_profiles` y columna `updated_at` como dependencia.'
      const previous = 'create table patient_profiles (id uuid, updated_at timestamptz)'
      const issues = validateDesignCoherence(current, previous)
      expect(issues).toHaveLength(0)
    })

    it('no reporta duplicado cuando tabla referenciada en texto pero no creada', () => {
      const current = '## Dependencies\n- `patient_profiles` — tabla base\n\ncreate table glucose_readings (id uuid)'
      const previous = 'create table patient_profiles (id uuid)'
      const issues = validateDesignCoherence(current, previous)
      expect(issues.some((i) => i.type === 'duplicate_table')).toBe(false)
    })
  })

  describe('validateSpecCoherence', () => {
    it('solo valida design y requirements', () => {
      expect(validateSpecCoherence('tasks', 'content', 'prev')).toHaveLength(0)
      expect(validateSpecCoherence('design', 'create table x (id int)', '')).toBeDefined()
      expect(validateSpecCoherence('requirements', 'x', '')).toHaveLength(0)
    })
  })

  describe('validateRequirementsCoherence', () => {
    it('retorna array vacio (v1)', () => {
      expect(validateRequirementsCoherence('a', 'b')).toHaveLength(0)
    })
  })
})
