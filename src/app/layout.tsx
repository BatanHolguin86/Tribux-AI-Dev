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

export const metadata: Metadata = {
  title: 'AI Squad Command Center',
  description:
    'Tu equipo de agentes IA especializados para construir productos tecnologicos end-to-end.',
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
