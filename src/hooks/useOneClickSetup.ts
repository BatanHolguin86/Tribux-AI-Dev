'use client'

import { useState, useCallback } from 'react'

type StepStatus = 'pending' | 'running' | 'polling' | 'done' | 'error'

type StepState = {
  status: StepStatus
  message: string
  data?: Record<string, unknown>
}

type SetupState = {
  isRunning: boolean
  steps: {
    github: StepState
    supabase: StepState
    vercel: StepState
  }
  isComplete: boolean
  error: string | null
}

const INITIAL_STEP: StepState = { status: 'pending', message: '' }

export function useOneClickSetup(projectId: string) {
  const [state, setState] = useState<SetupState>({
    isRunning: false,
    steps: { github: INITIAL_STEP, supabase: INITIAL_STEP, vercel: INITIAL_STEP },
    isComplete: false,
    error: null,
  })

  const execute = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isRunning: true,
      isComplete: false,
      error: null,
      steps: { github: INITIAL_STEP, supabase: INITIAL_STEP, vercel: INITIAL_STEP },
    }))

    try {
      const res = await fetch(`/api/projects/${projectId}/phases/3/actions/one-click-setup`, {
        method: 'POST',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: `Error ${res.status}` }))
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: body.message ?? body.error ?? `Error ${res.status}`,
        }))
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setState((prev) => ({ ...prev, isRunning: false, error: 'No response stream' }))
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const dataMatch = line.match(/^data: (.+)/)
          if (!dataMatch) continue

          try {
            const event = JSON.parse(dataMatch[1]) as {
              step: 'github' | 'supabase' | 'vercel' | 'complete'
              status: StepStatus
              message: string
              data?: Record<string, unknown>
            }

            if (event.step === 'complete') {
              setState((prev) => ({
                ...prev,
                isRunning: false,
                isComplete: event.status === 'done',
                error: event.status === 'error' ? event.message : null,
              }))
            } else {
              setState((prev) => ({
                ...prev,
                steps: {
                  ...prev.steps,
                  [event.step]: {
                    status: event.status,
                    message: event.message,
                    data: event.data,
                  },
                },
              }))
            }
          } catch { /* skip malformed events */ }
        }
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isRunning: false,
        error: err instanceof Error ? err.message : 'Error de conexion',
      }))
    }
  }, [projectId])

  return { ...state, execute }
}
