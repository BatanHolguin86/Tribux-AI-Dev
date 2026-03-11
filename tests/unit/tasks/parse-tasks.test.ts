import { describe, it, expect } from 'vitest'
import { parseTasksFromMarkdown } from '@/lib/tasks/parse-tasks'

describe('parseTasksFromMarkdown', () => {
  it('parses basic KIRO task format with bold', () => {
    const md = `### Backend
- [ ] **TASK-001:** Create users table
- [ ] **TASK-002:** Add RLS policies`

    const result = parseTasksFromMarkdown(md)

    expect(result).toEqual([
      { task_key: 'TASK-001', title: 'Create users table', category: 'Backend' },
      { task_key: 'TASK-002', title: 'Add RLS policies', category: 'Backend' },
    ])
  })

  it('parses tasks without bold formatting', () => {
    const md = `### Setup
- [ ] TASK-001: Initialize project
- [ ] TASK-002: Configure ESLint`

    const result = parseTasksFromMarkdown(md)

    expect(result).toHaveLength(2)
    expect(result[0].task_key).toBe('TASK-001')
    expect(result[0].title).toBe('Initialize project')
    expect(result[0].category).toBe('Setup')
  })

  it('handles multiple categories', () => {
    const md = `### Backend
- [ ] **TASK-001:** API route
### Frontend
- [ ] **TASK-002:** Create component
### Tests
- [ ] **TASK-003:** Unit tests`

    const result = parseTasksFromMarkdown(md)

    expect(result).toHaveLength(3)
    expect(result[0].category).toBe('Backend')
    expect(result[1].category).toBe('Frontend')
    expect(result[2].category).toBe('Tests')
  })

  it('defaults category to General when no header', () => {
    const md = `- [ ] **TASK-001:** Some task without category`

    const result = parseTasksFromMarkdown(md)

    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('General')
  })

  it('handles checked tasks', () => {
    const md = `### Done
- [x] **TASK-001:** Already completed task`

    const result = parseTasksFromMarkdown(md)

    expect(result).toHaveLength(1)
    expect(result[0].task_key).toBe('TASK-001')
  })

  it('ignores non-task lines', () => {
    const md = `# Main Title
Some description text.

### Backend
- Regular bullet point
- [ ] **TASK-001:** Actual task
- Another bullet
  - Nested item`

    const result = parseTasksFromMarkdown(md)

    expect(result).toHaveLength(1)
    expect(result[0].task_key).toBe('TASK-001')
  })

  it('returns empty array for empty content', () => {
    expect(parseTasksFromMarkdown('')).toEqual([])
  })

  it('returns empty array for content with no tasks', () => {
    const md = `# Just a Title
Some paragraph text.
- Regular list item`

    expect(parseTasksFromMarkdown(md)).toEqual([])
  })

  it('uppercases task keys', () => {
    const md = `- [ ] **task-005:** lowercase key`

    const result = parseTasksFromMarkdown(md)

    expect(result[0].task_key).toBe('TASK-005')
  })

  it('trims whitespace from titles', () => {
    const md = `- [ ] **TASK-001:**   extra spaces   `

    const result = parseTasksFromMarkdown(md)

    expect(result[0].title).toBe('extra spaces')
  })

  it('handles large task numbers', () => {
    const md = `- [ ] **TASK-999:** Last task`

    const result = parseTasksFromMarkdown(md)

    expect(result[0].task_key).toBe('TASK-999')
  })
})
