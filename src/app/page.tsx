import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const PHASES = [
  { num: '00', name: 'Discovery & Ideation', icon: '🔍', desc: 'Define el problema, usuarios y propuesta de valor.' },
  { num: '01', name: 'Requirements & Spec', icon: '📋', desc: 'Crea specs detallados en formato KIRO.' },
  { num: '02', name: 'Architecture & Design', icon: '🏗️', desc: 'Arquitectura, stack y wireframes.' },
  { num: '03', name: 'Environment Setup', icon: '⚙️', desc: 'Repo, CI/CD, base de datos, deploy.' },
  { num: '04', name: 'Core Development', icon: '💻', desc: 'Implementacion guiada por agentes.' },
  { num: '05', name: 'Testing & QA', icon: '🧪', desc: 'Tests unitarios, E2E y QA automatizado.' },
  { num: '06', name: 'Launch & Deployment', icon: '🚀', desc: 'Deploy a produccion con monitoring.' },
  { num: '07', name: 'Iteration & Growth', icon: '📈', desc: 'Feedback, metricas y mejora continua.' },
]

const AGENTS = [
  { name: 'CTO Virtual', desc: 'Tu punto de contacto principal. Guia cada decision.', icon: '🧠' },
  { name: 'Product Architect', desc: 'Define alcance, prioriza features y valida product-market fit.', icon: '📐' },
  { name: 'System Architect', desc: 'Elige tecnologias, define patrones y crea diagramas.', icon: '🏛️' },
  {
    name: 'UI/UX Designer',
    desc: 'Hub Diseño & UX: pantallas guardadas + kit (style guide, componentes, flujos, responsive) con contexto Discovery.',
    icon: '🎨',
  },
  { name: 'Lead Developer', desc: 'Escribe codigo, resuelve bugs y aplica best practices.', icon: '👨‍💻' },
  { name: 'DB Admin', desc: 'Esquemas, queries, RLS y migraciones.', icon: '🗄️' },
  { name: 'QA Engineer', desc: 'Test cases, estrategia de testing y checklists.', icon: '✅' },
  { name: 'DevOps Engineer', desc: 'CI/CD, deploy, monitoring e infraestructura.', icon: '⚡' },
  { name: 'Operator', desc: 'Repos, pipelines y planes de deploy listos para ejecutar.', icon: '🛠️' },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$149',
    period: '/mes',
    features: ['1 proyecto', 'Fases 00–04', 'CTO Virtual + 3 agentes', 'Soporte por email'],
    cta: 'Comenzar',
    popular: false,
  },
  {
    name: 'Builder',
    price: '$299',
    period: '/mes',
    features: ['3 proyectos', 'Todas las fases (00–07)', '8 agentes IA', 'Soporte prioritario'],
    cta: 'Comenzar',
    popular: true,
  },
  {
    name: 'Agency',
    price: '$699',
    period: '/mes',
    features: ['10 proyectos', 'Todas las fases (00–07)', '9 agentes + Operator', 'Soporte dedicado'],
    cta: 'Comenzar',
    popular: false,
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">AI Squad</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:text-gray-900 dark:hover:text-white"
            >
              Iniciar sesion
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-gray-950 dark:to-indigo-950/20" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-4 py-1.5 text-sm font-medium text-violet-700 dark:text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              7 dias gratis — sin tarjeta de credito
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              Tu idea, tu decision.{' '}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Tu producto.
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 sm:text-xl">
              Un equipo de 9 agentes IA especializados que te guian por 8 fases estructuradas
              para construir cualquier producto tecnologico — desde una web simple hasta un SaaS complejo.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:brightness-110 sm:w-auto"
              >
                Comenzar gratis
              </Link>
              <a
                href="#como-funciona"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-8 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 sm:w-auto"
              >
                Como funciona
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
            <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                8 fases estructuradas
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                9 agentes IA
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Tu controlas todo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona — 8 fases */}
      <section id="como-funciona" className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Metodologia IA DLC</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              8 fases, de la idea al lanzamiento
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Cada fase tiene un objetivo claro, entregables definidos y agentes asignados.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PHASES.map((phase) => (
              <div
                key={phase.num}
                className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 transition-all hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{phase.icon}</span>
                  <span className="rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-400">
                    {phase.num}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{phase.name}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agentes IA */}
      <section className="border-t border-gray-100 dark:border-gray-800 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Tu equipo</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              9 agentes IA especializados
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Cada agente domina su area. Tu decides, ellos ejecutan.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AGENTS.map((agent) => (
              <div
                key={agent.name}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 transition-all hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700"
              >
                <span className="text-3xl">{agent.icon}</span>
                <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{agent.name}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Planes</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Elige tu plan
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              7 dias gratis con acceso completo. Sin tarjeta de credito.
            </p>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 bg-white dark:bg-gray-900 p-8 transition-shadow hover:shadow-lg ${
                  plan.popular
                    ? 'border-violet-600 shadow-md'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                    Mas popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm hover:shadow-md hover:brightness-110'
                      : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Necesitas mas?{' '}
            <span className="font-medium text-violet-600 dark:text-violet-400">Enterprise</span>{' '}
            — proyectos ilimitados, agentes dedicados, soporte 24/7.{' '}
            <Link href="/register" className="underline hover:text-violet-700 dark:hover:text-violet-300">
              Contactar
            </Link>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-gray-100 dark:border-gray-800 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Empieza a construir hoy
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Tu equipo de agentes IA te espera. De la idea al producto en semanas, no meses.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:brightness-110"
          >
            Comenzar gratis — 7 dias sin costo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">AI Squad</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              &copy; {new Date().getFullYear()} AI Squad. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
