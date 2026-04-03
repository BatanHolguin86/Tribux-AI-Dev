import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accede a tu cuenta',
  description:
    'Inicia sesion o crea tu cuenta en AI Squad Command Center para construir productos tecnologicos con agentes IA.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand / value prop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-[#0A1F33] px-12 text-white">
        <h1 className="text-4xl font-bold leading-tight">
          Tu idea, tu decision.
          <br />
          Nuestro equipo, nuestro proceso.
          <br />
          <span className="text-[#0EA5A3]">Tu producto.</span>
        </h1>
        <p className="mt-6 text-lg text-[#0EA5A3]/30 max-w-md">
          AI Squad Command Center te da un equipo de agentes IA especializados para construir
          cualquier producto tecnologico — desde una web simple hasta un SaaS con integraciones.
        </p>
        <div className="mt-10 flex gap-4 text-sm text-[#0EA5A3]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0EA5A3]" />8 fases estructuradas
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0EA5A3]" />8 agentes IA
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0EA5A3]" />Tu controlas
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
