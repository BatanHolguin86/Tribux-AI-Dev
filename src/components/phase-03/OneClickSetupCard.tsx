'use client'

import { useOneClickSetup } from '@/hooks/useOneClickSetup'
import { useRouter } from 'next/navigation'

type StepStatus = 'pending' | 'running' | 'polling' | 'done' | 'error'

const STEP_META = [
  { key: 'github' as const, label: 'GitHub', icon: '📦', doneLabel: 'Repositorio creado' },
  { key: 'supabase' as const, label: 'Supabase', icon: '🗄️', doneLabel: 'Base de datos lista' },
  { key: 'vercel' as const, label: 'Vercel', icon: '🚀', doneLabel: 'Hosting configurado' },
]

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'running' || status === 'polling') {
    return (
      <svg className="h-5 w-5 animate-spin text-[#0EA5A3]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )
  }
  if (status === 'done') {
    return (
      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (status === 'error') {
    return (
      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }
  return <span className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
}

type OneClickSetupCardProps = {
  projectId: string
  platformReady: boolean
  existingSetup: {
    hasRepo: boolean
    hasSupabase: boolean
    hasVercel: boolean
  }
}

export function OneClickSetupCard({ projectId, platformReady, existingSetup }: OneClickSetupCardProps) {
  const router = useRouter()
  const { isRunning, steps, isComplete, error, execute } = useOneClickSetup(projectId)

  if (!platformReady) {
    return (
      <div className="mb-6 space-y-3">
        <div className="rounded-xl border-2 border-[#F59E0B]/30 bg-[#F59E0B]/5 p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h3 className="font-display text-sm font-bold text-[#0F2B46] dark:text-white">
                La configuracion automatica no esta disponible aun
              </h3>
              <p className="mt-1 text-xs text-[#64748B] dark:text-gray-400">
                Elige una de estas opciones para preparar tu app:
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Option 1: Contact admin */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 dark:border-[#1E3A55] dark:bg-[#0F2B46]">
            <div className="mb-3 text-2xl">📩</div>
            <h4 className="font-display text-sm font-semibold text-[#0F2B46] dark:text-white">
              Pedir al administrador
            </h4>
            <p className="mt-1 text-xs text-[#94A3B8]">
              El admin puede activar la configuracion automatica en minutos. Solo necesita conectar GitHub, Supabase y Vercel una vez.
            </p>
            <a
              href="mailto:admin@aisquad.dev?subject=Activar%20configuracion%20automatica&body=Hola%2C%20necesito%20que%20actives%20la%20configuracion%20automatica%20(One-Click%20Setup)%20en%20%2Fadmin%2Fplatform-setup.%20Gracias!"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#0EA5A3] px-3 py-2 text-xs font-medium text-[#0EA5A3] transition-colors hover:bg-[#0EA5A3]/5"
            >
              Contactar administrador
            </a>
          </div>

          {/* Option 2: Do it yourself with CTO */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 dark:border-[#1E3A55] dark:bg-[#0F2B46]">
            <div className="mb-3 text-2xl">🤖</div>
            <h4 className="font-display text-sm font-semibold text-[#0F2B46] dark:text-white">
              Configurar con ayuda del CTO
            </h4>
            <p className="mt-1 text-xs text-[#94A3B8]">
              El CTO Virtual te guia paso a paso para crear tu repositorio, base de datos y hosting manualmente.
            </p>
            <button
              onClick={() => {
                // Navigate to Herramientas tab where CTO agent can guide
                const tabBtn = document.querySelector('[data-tab="herramientas"]') as HTMLButtonElement
                if (tabBtn) tabBtn.click()
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0F2B46] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0A1F33]"
            >
              Abrir chat con CTO
            </button>
          </div>
        </div>
      </div>
    )
  }

  const allConfigured = existingSetup.hasRepo && existingSetup.hasSupabase && existingSetup.hasVercel

  if (allConfigured && !isRunning && !isComplete) {
    return (
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-900/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h3 className="text-sm font-semibold font-display text-green-800 dark:text-green-300">
              Infraestructura configurada
            </h3>
            <p className="text-xs text-green-600 dark:text-green-400">
              Repositorio, base de datos y hosting listos. Continua con los pasos del checklist.
            </p>
          </div>
        </div>
      </div>
    )
  }

  async function handleClick() {
    await execute()
    router.refresh()
  }

  return (
    <div className="mb-6 rounded-xl border-2 border-[#0EA5A3]/30 bg-gradient-to-b from-[#E8F4F8]/60 to-white p-6 dark:border-[#0F2B46] dark:from-[#0F2B46]/30 dark:to-gray-900">
      <div className="flex items-start gap-4">
        <span className="text-3xl">⚡</span>
        <div className="flex-1">
          <h3 className="text-base font-bold font-display text-gray-900 dark:text-gray-100">
            Configuracion Automatica
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Crea repositorio, base de datos y hosting con un solo clic. No necesitas configurar nada manualmente.
          </p>

          {/* Progress steps */}
          {(isRunning || isComplete || error) && (
            <div className="mt-4 space-y-3">
              {STEP_META.map((meta) => {
                const step = steps[meta.key]
                return (
                  <div key={meta.key} className="flex items-center gap-3">
                    <StepIcon status={step.status} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {meta.label}
                      </span>
                      {step.message && (
                        <p className={`text-xs ${step.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {step.message}
                        </p>
                      )}
                    </div>
                    {step.status === 'done' && typeof step.data?.repoUrl === 'string' && (
                      <a
                        href={step.data.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#0F2B46] underline dark:text-[#0EA5A3]"
                      >
                        Ver →
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {isComplete && (
            <div className="mt-3 rounded-lg border-l-4 border-green-500 bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-400">
              Infraestructura lista. Los items del checklist se actualizaron automaticamente.
            </div>
          )}

          {!isRunning && !isComplete && (
            <button
              onClick={handleClick}
              disabled={isRunning}
              className="mt-4 rounded-lg bg-[#0F2B46] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0A1F33] disabled:opacity-50"
            >
              Configurar todo automaticamente
            </button>
          )}

          {(error && !isRunning) && (
            <button
              onClick={handleClick}
              className="mt-2 text-xs font-medium text-[#0F2B46] underline hover:text-[#0F2B46] dark:text-[#0EA5A3]"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
