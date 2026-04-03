/**
 * Maps technical error messages to user-friendly Spanish messages.
 * Used across the app to ensure non-technical users never see
 * raw error codes, env var names, or stack traces.
 */

const PATTERNS: Array<{ match: RegExp; message: string }> = [
  // API keys & tokens
  { match: /ANTHROPIC_API_KEY/i, message: 'El servicio de inteligencia artificial no esta disponible. Contacta al administrador.' },
  { match: /GITHUB_TOKEN/i, message: 'No se pudo conectar con el repositorio de codigo. Contacta al administrador.' },
  { match: /SUPABASE.*not configured|SUPABASE.*missing/i, message: 'No pudimos conectar con la base de datos. Verifica la configuracion en Infraestructura.' },
  { match: /VERCEL.*TOKEN|VERCEL.*not configured/i, message: 'El servicio de hosting no esta configurado. Contacta al administrador.' },
  { match: /PLATFORM.*TOKEN|PLATFORM.*not configured/i, message: 'La plataforma no esta configurada. El administrador debe completar la configuracion en el panel de admin.' },
  { match: /RESEND.*KEY/i, message: 'El servicio de email no esta configurado.' },
  { match: /SENTRY/i, message: 'El monitoreo de errores no esta configurado (opcional).' },
  { match: /STRIPE/i, message: 'El sistema de pagos no esta configurado.' },
  { match: /ENCRYPTION_KEY/i, message: 'Error de seguridad interno. Contacta al administrador.' },

  // Auth & permissions
  { match: /unauthorized|no autenticado/i, message: 'Tu sesion expiro. Inicia sesion de nuevo.' },
  { match: /forbidden|acceso.*reservado/i, message: 'No tienes permisos para esta accion.' },
  { match: /not_found|no encontrado/i, message: 'No encontramos lo que buscas. Intenta de nuevo.' },

  // Rate limiting
  { match: /rate.?limit|limite.*acciones/i, message: 'Demasiadas acciones en poco tiempo. Espera unos minutos e intenta de nuevo.' },

  // Credits
  { match: /credit|creditos|insufficient/i, message: 'Creditos de IA insuficientes. Contacta al administrador para recargar.' },

  // GitHub
  { match: /repo.*not found|repo.*404/i, message: 'No se encontro el repositorio. Verifica que existe y que tienes acceso.' },
  { match: /create.*repo.*failed/i, message: 'No se pudo crear el repositorio. Intenta de nuevo.' },
  { match: /commit.*failed/i, message: 'No se pudieron guardar los cambios en el codigo. Intenta de nuevo.' },
  { match: /branch.*failed/i, message: 'No se pudo crear la rama de trabajo. Intenta de nuevo.' },
  { match: /merge.*failed/i, message: 'No se pudieron publicar los cambios. Intenta de nuevo.' },

  // Supabase
  { match: /supabase.*create.*failed/i, message: 'No se pudo crear la base de datos. Intenta de nuevo.' },
  { match: /supabase.*not.*ready/i, message: 'La base de datos aun se esta preparando. Espera un momento.' },
  { match: /execute.*sql.*failed|sql.*error/i, message: 'Hubo un error al actualizar la base de datos. Revisa los detalles.' },
  { match: /RLS|row.?level/i, message: 'Error de permisos en la base de datos.' },

  // Vercel
  { match: /vercel.*create.*failed/i, message: 'No se pudo configurar el hosting. Intenta de nuevo.' },
  { match: /deploy.*failed/i, message: 'La publicacion fallo. Revisa los logs para mas detalles.' },

  // AI
  { match: /overloaded|capacity/i, message: 'El servicio de IA esta saturado. Intenta en unos minutos.' },
  { match: /timeout|tardo demasiado/i, message: 'La operacion tardo demasiado. Intenta de nuevo.' },
  { match: /context.*length|too.*long/i, message: 'El proyecto tiene demasiada informacion para procesar de una vez. Intenta con menos contenido.' },

  // Network
  { match: /fetch.*failed|network|ECONNREFUSED/i, message: 'Error de conexion. Verifica tu internet e intenta de nuevo.' },
  { match: /ENOTFOUND/i, message: 'No se pudo conectar con el servidor. Verifica tu internet.' },

  // Generic
  { match: /internal.*error|500/i, message: 'Ocurrio un error inesperado. Intenta de nuevo o contacta soporte.' },
]

/**
 * Convert a technical error message to a user-friendly Spanish message.
 * If no pattern matches, returns a generic friendly message.
 */
export function toFriendlyMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : String(error)

  for (const { match, message } of PATTERNS) {
    if (match.test(raw)) return message
  }

  return 'Ocurrio un error. Intenta de nuevo.'
}

/**
 * Check if an error message is already user-friendly (Spanish, no technical jargon).
 */
export function isFriendlyMessage(message: string): boolean {
  // If it contains env var patterns, it's not friendly
  if (/[A-Z_]{3,}/.test(message) && message.includes('_')) return false
  // If it contains stack trace patterns, it's not friendly
  if (message.includes('at ') && message.includes('.ts')) return false
  return true
}
