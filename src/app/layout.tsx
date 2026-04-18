import type { Metadata } from 'next'
import { Inter, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ToastProvider } from '@/components/shared/ToastProvider'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aisquad.dev'

export const metadata: Metadata = {
  title: {
    default: 'Tribux AI',
    template: '%s | Tribux AI',
  },
  description:
    'Tu equipo de agentes IA especializados para construir productos tecnologicos end-to-end. Discovery, specs, arquitectura, desarrollo y deploy — todo guiado por IA.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'Tribux AI',
    description:
      'Construye productos tecnologicos con un equipo de agentes IA: CTO Virtual, Architect, Frontend Dev, Backend Dev, QA y mas.',
    url: APP_URL,
    siteName: 'Tribux AI',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tribux AI',
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
      <body className={`${inter.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <ToastProvider />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
