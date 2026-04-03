import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-white dark:bg-gray-950">
      <p className="text-6xl font-bold text-[#0F2B46]">404</p>
      <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Pagina no encontrada</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        La pagina que buscas no existe o fue movida.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-[#0F2B46] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0A1F33]"
      >
        Ir al dashboard
      </Link>
    </div>
  )
}
