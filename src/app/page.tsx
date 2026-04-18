import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TribuxLogo } from '@/components/ui/TribuxLogo'

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
  { name: 'CTO Virtual', desc: 'Lidera tu proyecto. Coordina al equipo y toma decisiones tecnicas.', icon: '🧠' },
  { name: 'Product Architect', desc: 'Define que construir, prioriza features y valida tu idea de negocio.', icon: '📐' },
  { name: 'System Architect', desc: 'Diseña la arquitectura, elige tecnologias y crea los planos tecnicos.', icon: '🏛️' },
  { name: 'UI/UX Designer', desc: 'Diseña la experiencia: wireframes, mockups y el look & feel de tu producto.', icon: '🎨' },
  { name: 'Lead Developer', desc: 'Escribe el codigo, resuelve problemas y aplica las mejores practicas.', icon: '💻' },
  { name: 'DB Admin', desc: 'Diseña tu base de datos, optimiza consultas y protege tu informacion.', icon: '🗄️' },
  { name: 'QA Engineer', desc: 'Prueba todo: genera tests automaticos y asegura la calidad.', icon: '🧪' },
  { name: 'DevOps & Operations', desc: 'Configura deploy, CI/CD, monitoring e infraestructura completa.', icon: '🚀' },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mes',
    features: ['1 proyecto', 'Valida y diseña tu producto', '3 agentes especializados', 'Ideal para explorar tu idea'],
    cta: 'Comenzar',
    popular: false,
  },
  {
    name: 'Builder',
    price: '$149',
    period: '/mes',
    features: ['1 proyecto', 'De la idea al deploy', '8 agentes IA', 'Construccion automatica de codigo'],
    cta: 'Comenzar',
    popular: true,
  },
  {
    name: 'Pro',
    price: '$299',
    period: '/mes',
    features: ['3 proyectos', 'Todas las fases completas', '8 agentes IA', 'Construccion ilimitada'],
    cta: 'Comenzar',
    popular: false,
  },
  {
    name: 'Agency',
    price: '$699',
    period: '/mes',
    features: ['10 proyectos', 'Gestiona multiples clientes', '8 agentes IA', 'Soporte prioritario'],
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
            <TribuxLogo size={32} />
            <span className="text-lg font-display font-bold text-gray-900 dark:text-white">Tribux AI</span>
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
              className="rounded-lg bg-gradient-to-r from-[#0F2B46] to-[#0EA5A3] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
            >
              Comenzar ahora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F4F8] via-white to-[#E8F4F8] dark:from-[#0A1F33]/20 dark:via-gray-950 dark:to-[#0A1F33]/20" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0EA5A3]/30 dark:border-[#0F2B46] bg-[#E8F4F8] dark:bg-[#0F2B46]/20 px-4 py-1.5 text-sm font-medium text-[#0F2B46] dark:text-[#0EA5A3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0EA5A3] animate-pulse" />
              Desde $49/mes — cancela cuando quieras
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              Construye tu producto con{' '}
              <span className="bg-gradient-to-r from-[#0F2B46] to-[#0EA5A3] bg-clip-text text-transparent">
                un equipo de agentes IA
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 sm:text-xl">
              De la idea al lanzamiento en semanas. Sin saber programar. Sin contratar equipo.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="w-full rounded-xl bg-gradient-to-r from-[#0F2B46] to-[#0EA5A3] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#0EA5A3]/25 transition-all hover:shadow-xl hover:shadow-[#0EA5A3]/30 hover:brightness-110 sm:w-auto"
              >
                Comenzar ahora
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
                Tu lideras, la IA ejecuta
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                De idea a producto en semanas
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Sin programar
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona — 8 fases */}
      <section id="como-funciona" className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0F2B46] dark:text-[#0EA5A3]">Metodologia IA DLC</p>
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
                className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 transition-all hover:shadow-md hover:border-[#0EA5A3] dark:hover:border-[#0A1F33]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{phase.icon}</span>
                  <span className="rounded-full bg-[#E8F4F8] dark:bg-[#0F2B46]/30 px-2 py-0.5 text-[10px] font-bold text-[#0F2B46] dark:text-[#0EA5A3]">
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
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0F2B46] dark:text-[#0EA5A3]">Tu equipo</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Tu equipo de 8 agentes IA
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Cada agente es especialista en su area. Tu lideras, ellos ejecutan.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AGENTS.map((agent) => (
              <div
                key={agent.name}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 transition-all hover:shadow-md hover:border-[#0EA5A3] dark:hover:border-[#0A1F33]"
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
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0F2B46] dark:text-[#0EA5A3]">Planes</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Elige tu plan
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Desde $49/mes. Cancela cuando quieras.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 bg-white dark:bg-gray-900 p-8 transition-shadow hover:shadow-lg ${
                  plan.popular
                    ? 'border-[#0F2B46] shadow-md'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#0F2B46] to-[#0EA5A3] px-4 py-1 text-xs font-semibold text-white">
                    Mas popular
                  </div>
                )}
                <h3 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="h-4 w-4 shrink-0 text-[#0F2B46] dark:text-[#0EA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                      ? 'bg-gradient-to-r from-[#0F2B46] to-[#0EA5A3] text-white shadow-sm hover:shadow-md hover:brightness-110'
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
            <span className="font-medium text-[#0F2B46] dark:text-[#0EA5A3]">Enterprise</span>{' '}
            — proyectos ilimitados, agentes dedicados, soporte 24/7.{' '}
            <Link href="/register" className="underline hover:text-[#0F2B46] dark:hover:text-[#0EA5A3]">
              Contactar
            </Link>
          </p>
        </div>
      </section>

      {/* Comparativa vs competencia */}
      <section className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary dark:text-brand-teal">Comparativa</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Por que Tribux AI y no otra herramienta?
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Tribux AI — highlighted */}
            <div className="relative rounded-2xl border-2 border-brand-teal bg-white p-6 shadow-lg shadow-brand-teal/10 dark:bg-gray-900">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-teal px-3 py-0.5 text-[10px] font-bold text-white">
                RECOMENDADO
              </div>
              <h3 className="font-display text-lg font-bold text-brand-primary dark:text-white">Tribux AI</h3>
              <p className="mt-1 text-xs text-brand-teal font-semibold">$49 - $699/mes</p>
              <div className="mt-4 space-y-2.5">
                {['Metodologia 8 fases', '8 agentes IA', 'Control por fases', 'Codigo real (Next.js)', 'Deploy automatico', 'Specs antes de codear'].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-gray-700 dark:text-gray-300">{f}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] font-medium text-brand-primary dark:text-brand-teal">MVP en semanas</p>
            </div>

            {/* Bolt / Lovable */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="font-display text-lg font-bold text-gray-700 dark:text-gray-300">Bolt / Lovable</h3>
              <p className="mt-1 text-xs text-gray-400">$20 - $50/mes</p>
              <div className="mt-4 space-y-2.5">
                {[
                  { f: 'Sin metodologia', ok: false },
                  { f: 'Sin agentes', ok: false },
                  { f: 'Sin control por fases', ok: false },
                  { f: 'Prototipo (no prod)', ok: false },
                  { f: 'Deploy incluido', ok: true },
                  { f: 'Sin specs previos', ok: false },
                ].map(({ f, ok }) => (
                  <div key={f} className="flex items-center gap-2">
                    {ok ? (
                      <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{f}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-gray-400">Prototipo en horas</p>
            </div>

            {/* Freelancers */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="font-display text-lg font-bold text-gray-700 dark:text-gray-300">Freelancers</h3>
              <p className="mt-1 text-xs text-gray-400">$2K - $10K/mes</p>
              <div className="mt-4 space-y-2.5">
                {[
                  { f: 'Sin metodologia', ok: false },
                  { f: 'Sin agentes', ok: false },
                  { f: 'Control directo', ok: true },
                  { f: 'Codigo real', ok: true },
                  { f: 'Sin deploy auto', ok: false },
                  { f: 'Specs inconsistentes', ok: false },
                ].map(({ f, ok }) => (
                  <div key={f} className="flex items-center gap-2">
                    {ok ? (
                      <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{f}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-gray-400">MVP en meses</p>
            </div>

            {/* Agencia */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="font-display text-lg font-bold text-gray-700 dark:text-gray-300">Agencia</h3>
              <p className="mt-1 text-xs text-gray-400">$15K - $50K/mes</p>
              <div className="mt-4 space-y-2.5">
                {[
                  { f: 'Metodologia variable', ok: false },
                  { f: 'Equipo humano', ok: true },
                  { f: 'Control limitado', ok: false },
                  { f: 'Codigo real', ok: true },
                  { f: 'Deploy manual', ok: false },
                  { f: 'Specs parciales', ok: false },
                ].map(({ f, ok }) => (
                  <div key={f} className="flex items-center gap-2">
                    {ok ? (
                      <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{f}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-gray-400">MVP en meses</p>
            </div>
          </div>
        </div>
      </section>

      {/* Para quien es */}
      <section className="border-t border-gray-100 dark:border-gray-800 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-primary dark:text-brand-teal">Para quien</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Tribux AI es para ti si...
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '💡', name: 'Emprendedora', desc: 'Tienes una idea clara pero no sabes como construirla. Quieres validar rapido sin gastar una fortuna.', plan: 'Starter $49' },
              { icon: '🚀', name: 'Founder', desc: 'Necesitas un MVP en semanas, no meses. Tienes capital semilla pero no tienes CTO.', plan: 'Builder $149' },
              { icon: '📋', name: 'Product Manager', desc: 'Tu equipo de ingenieria esta saturado. Necesitas validar ideas sin bloquear al equipo.', plan: 'Builder $149' },
              { icon: '💼', name: 'Consultor', desc: 'Tus clientes piden software. Quieres ofrecer desarrollo end-to-end con margenes altos.', plan: 'Agency $699' },
            ].map((persona) => (
              <div key={persona.name} className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <span className="text-3xl">{persona.icon}</span>
                <h3 className="mt-3 font-display text-lg font-bold text-gray-900 dark:text-white">{persona.name}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{persona.desc}</p>
                <p className="mt-3 text-xs font-semibold text-brand-teal">{persona.plan}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numeros */}
      <section className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
            {[
              { num: '8', label: 'Agentes IA' },
              { num: '8', label: 'Fases de desarrollo' },
              { num: '28', label: 'Acciones automatizadas' },
              { num: '134', label: 'API endpoints' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-bold text-brand-primary dark:text-brand-teal">{stat.num}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-gray-100 dark:border-gray-800 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Tu idea merece existir
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Tu equipo de agentes IA te espera. De la idea al producto en semanas, no meses.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl bg-gradient-to-r from-[#0F2B46] to-[#0EA5A3] px-10 py-4 text-base font-semibold text-white shadow-lg shadow-[#0EA5A3]/25 transition-all hover:shadow-xl hover:shadow-[#0EA5A3]/30 hover:brightness-110"
          >
            Comenzar ahora — desde $49/mes
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-center gap-2.5">
                <TribuxLogo size={28} />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Tribux AI</span>
              </div>
              <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                <a href="mailto:hola@tribux.dev" className="transition-colors hover:text-gray-700 dark:hover:text-gray-300">Contacto</a>
                <Link href="/login" className="transition-colors hover:text-gray-700 dark:hover:text-gray-300">Iniciar sesion</Link>
                <Link href="/register" className="transition-colors hover:text-gray-700 dark:hover:text-gray-300">Crear cuenta</Link>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 pt-6 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                &copy; {new Date().getFullYear()} Tribux AI. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
