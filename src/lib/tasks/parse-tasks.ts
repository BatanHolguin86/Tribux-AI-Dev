type ParsedTask = {
  task_key: string
  title: string
  category: string
}

/**
 * Parse tasks from KIRO tasks.md markdown content.
 * Expected format:
 *   ### Category Name
 *   - [ ] **TASK-001:** Task description here
 *   - [ ] **TASK-002:** Another task
 */
export function parseTasksFromMarkdown(content: string): ParsedTask[] {
  const tasks: ParsedTask[] = []
  let currentCategory = 'General'

  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    // Match category headers: ### Category Name
    const categoryMatch = trimmed.match(/^###\s+(.+)/)
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim()
      continue
    }

    // Match task lines: - [ ] **TASK-XXX:** Description
    // Also handles: - [ ] TASK-XXX: Description (without bold)
    const taskMatch = trimmed.match(
      /^-\s+\[[ x]\]\s+\*{0,2}(TASK-\d+):?\*{0,2}\s*(.+)/i
    )
    if (taskMatch) {
      tasks.push({
        task_key: taskMatch[1].toUpperCase(),
        title: taskMatch[2].trim(),
        category: currentCategory,
      })
    }
  }

  return tasks
}
