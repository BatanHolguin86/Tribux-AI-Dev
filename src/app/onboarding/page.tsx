'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Persona } from '@/types/user'
import { WelcomeStep } from '@/components/onboarding/WelcomeStep'
import { PersonaStep } from '@/components/onboarding/PersonaStep'
import { ProjectStep } from '@/components/onboarding/ProjectStep'
import { PhasesOverviewStep } from '@/components/onboarding/PhasesOverviewStep'
import { IntegrationsStep } from '@/components/onboarding/IntegrationsStep'

const STEP_LABELS = ['Bienvenida', 'Tu rol', 'Proyecto', 'Integraciones', 'Fases']

type ProjectData = {
  name: string
  description?: string
  industry?: string
}

type IntegrationData = {
  repo_url?: string
  supabase_project_ref?: string
  supabase_access_token?: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [persona, setPersona] = useState<Persona | null>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [integrationData, setIntegrationData] = useState<IntegrationData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if onboarding is already completed
  useEffect(() => {
    async function checkOnboarding() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed, onboarding_step')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed) {
        router.push('/dashboard')
        return
      }

      if (profile?.onboarding_step && profile.onboarding_step > 0) {
        setStep(profile.onboarding_step)
      }

      setIsLoading(false)
    }

    checkOnboarding()
  }, [router])

  async function persistStep(newStep: number) {
    setStep(newStep)
    await fetch('/api/onboarding/step', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: newStep }),
    })
  }

  async function handleFinish() {
    if (!persona || !projectData) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          project: {
            ...projectData,
            repo_url: integrationData?.repo_url || undefined,
            supabase_project_ref: integrationData?.supabase_project_ref || undefined,
            supabase_access_token: integrationData?.supabase_access_token || undefined,
          },
        }),
      })

      if (!res.ok) {
        setIsSubmitting(false)
        return
      }

      const { redirect_to } = await res.json()
      router.push(redirect_to)
    } catch {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0F2B46] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      {/* Progress bar */}
      <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`h-1.5 w-full rounded-full transition-colors ${
                  i <= step ? 'bg-[#0F2B46]' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
              <span
                className={`text-xs ${
                  i <= step ? 'font-medium text-[#0F2B46]' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        {step === 0 && <WelcomeStep onNext={() => persistStep(1)} />}
        {step === 1 && (
          <PersonaStep
            selected={persona}
            onSelect={setPersona}
            onNext={() => persistStep(2)}
            onBack={() => persistStep(0)}
          />
        )}
        {step === 2 && (
          <ProjectStep
            defaultValues={projectData ?? undefined}
            onSubmit={(data) => {
              setProjectData(data)
              persistStep(3)
            }}
            onBack={() => persistStep(1)}
          />
        )}
        {step === 3 && (
          <IntegrationsStep
            defaultValues={integrationData ?? undefined}
            onSubmit={(data) => {
              setIntegrationData(data)
              persistStep(4)
            }}
            onBack={() => persistStep(2)}
            onSkip={() => persistStep(4)}
          />
        )}
        {step === 4 && (
          <PhasesOverviewStep
            isSubmitting={isSubmitting}
            onFinish={handleFinish}
            onBack={() => persistStep(3)}
          />
        )}
      </div>
    </div>
  )
}
