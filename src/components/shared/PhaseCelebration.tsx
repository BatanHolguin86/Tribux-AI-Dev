'use client'

import { useEffect, useState } from 'react'

const PHASE_CELEBRATIONS: Record<number, { emoji: string; title: string; subtitle: string }> = {
  0: { emoji: '🎯', title: 'Tu idea esta definida!', subtitle: 'Ahora vamos a especificar que features tendra tu app.' },
  1: { emoji: '📋', title: 'Features especificados!', subtitle: 'Tu app tiene forma. Ahora diseñamos como se ve y funciona.' },
  2: { emoji: '🎨', title: 'Diseño listo!', subtitle: 'Hora de preparar la infraestructura para construir.' },
  3: { emoji: '⚡', title: 'Todo configurado!', subtitle: 'Tu infraestructura esta lista. Ahora los agentes construyen tu app.' },
  4: { emoji: '🏗️', title: 'App construida!', subtitle: 'El codigo esta listo. Vamos a verificar que todo funcione.' },
  5: { emoji: '✅', title: 'Calidad verificada!', subtitle: 'Tu app pasa todas las pruebas. Lista para publicar.' },
  6: { emoji: '🚀', title: 'App publicada!', subtitle: 'Tu app esta en internet! Ahora a iterar con feedback de usuarios.' },
  7: { emoji: '🎉', title: 'Ciclo completado!', subtitle: 'Has completado un ciclo completo. Puedes iniciar el siguiente.' },
}

export function PhaseCelebration({
  phaseNumber,
  onDismiss,
}: {
  phaseNumber: number
  onDismiss: () => void
}) {
  const [visible, setVisible] = useState(true)
  const celebration = PHASE_CELEBRATIONS[phaseNumber]

  useEffect(() => {
    // Fire confetti
    import('canvas-confetti').then((confettiModule) => {
      const confetti = confettiModule.default
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0F2B46', '#0EA5A3', '#10B981', '#F59E0B'],
      })
    }).catch(() => {})

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  if (!celebration || !visible) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="mx-4 max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-[#0F2B46]">
        <div className="mb-4 text-6xl">{celebration.emoji}</div>
        <h2 className="font-display text-2xl font-display font-bold text-[#0F2B46] dark:text-white">
          {celebration.title}
        </h2>
        <p className="mt-2 text-sm text-[#94A3B8]">
          {celebration.subtitle}
        </p>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
          className="mt-6 rounded-lg bg-[#0EA5A3] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0C8C8A]"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
