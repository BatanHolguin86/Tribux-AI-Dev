export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand / value prop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-violet-950 px-12 text-white">
        <h1 className="text-4xl font-bold leading-tight">
          Tu idea, tu decision.
          <br />
          Nuestro equipo, nuestro proceso.
          <br />
          <span className="text-violet-300">Tu producto.</span>
        </h1>
        <p className="mt-6 text-lg text-violet-200 max-w-md">
          AI Squad Command Center te da un equipo de agentes IA especializados para construir
          cualquier producto tecnologico — desde una web simple hasta un SaaS con integraciones.
        </p>
        <div className="mt-10 flex gap-4 text-sm text-violet-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-400" />8 fases estructuradas
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-400" />8 agentes IA
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-400" />Tu controlas
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
