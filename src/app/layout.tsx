import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ToastProvider } from '@/components/shared/ToastProvider'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aisquad.dev'

export const metadata: Metadata = {
  title: {
    default: 'AI Squad Command Center',
    template: '%s | AI Squad',
  },
  description:
    'Tu equipo de agentes IA especializados para construir productos tecnologicos end-to-end. Discovery, specs, arquitectura, desarrollo y deploy — todo guiado por IA.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'AI Squad Command Center',
    description:
      'Construye productos tecnologicos con un equipo de agentes IA: CTO Virtual, Architect, Frontend Dev, Backend Dev, QA y mas.',
    url: APP_URL,
    siteName: 'AI Squad',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Squad Command Center',
    description:
      'Tu equipo de agentes IA especializados para construir productos tecnologicos end-to-end.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <ToastProvider />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
