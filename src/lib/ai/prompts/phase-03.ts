export type Phase03Section =
  | 'repository'
  | 'database'
  | 'authentication'
  | 'hosting'
  | 'environment'
  | 'verification'

type ChecklistItem = {
  label: string
  description: string
}

type CategoryConfig = {
  title: string
  description: string
  icon: string
  items: ChecklistItem[]
}

export const PHASE03_SECTIONS: Phase03Section[] = [
  'repository',
  'database',
  'authentication',
  'hosting',
  'environment',
  'verification',
]

export const SECTION_LABELS: Record<Phase03Section, string> = {
  repository: 'Repository',
  database: 'Database',
  authentication: 'Authentication',
  hosting: 'Hosting',
  environment: 'Environment Variables',
  verification: 'Verification',
}

export const CATEGORY_CONFIGS: Record<Phase03Section, CategoryConfig> = {
  repository: {
    title: 'Repository Setup',
    description: 'Crea y configura el repositorio del proyecto con el framework seleccionado en la arquitectura.',
    icon: '📦',
    items: [
      {
        label: 'Crear repositorio en GitHub',
        description: 'Repositorio publico o privado con el nombre del proyecto.',
      },
      {
        label: 'Inicializar proyecto con el framework elegido',
        description: 'Ejecutar el CLI del framework (ej: npx create-next-app) con las opciones definidas en la arquitectura.',
      },
      {
        label: 'Configurar .gitignore',
        description: 'Asegurar que .env, node_modules, .next y archivos de build estan excluidos.',
      },
      {
        label: 'Primer commit y push',
        description: 'Commit inicial con la estructura base del proyecto.',
      },
    ],
  },
  database: {
    title: 'Database Setup',
    description: 'Configura la base de datos segun el schema definido en Phase 02.',
    icon: '🗄️',
    items: [
      {
        label: 'Crear proyecto en el proveedor de base de datos',
        description: 'Crear proyecto en Supabase, PlanetScale, Neon, o el proveedor elegido.',
      },
      {
        label: 'Ejecutar migraciones iniciales',
        description: 'Crear las tablas definidas en el documento de Database Design.',
      },
      {
        label: 'Configurar politicas de seguridad',
        description: 'Habilitar RLS u otras politicas de acceso en las tablas.',
      },
      {
        label: 'Insertar datos semilla (opcional)',
        description: 'Datos iniciales necesarios para desarrollo (roles, categorias, etc.).',
      },
    ],
  },
  authentication: {
    title: 'Authentication Setup',
    description: 'Configura el sistema de autenticacion del proyecto.',
    icon: '🔐',
    items: [
      {
        label: 'Configurar proveedor de auth',
        description: 'Configurar el proveedor elegido (Supabase Auth, NextAuth, Clerk, etc.).',
      },
      {
        label: 'Configurar proveedores OAuth (si aplica)',
        description: 'Registrar app en Google, GitHub u otro proveedor OAuth y obtener credenciales.',
      },
      {
        label: 'Configurar callbacks y redirects',
        description: 'URLs de callback para OAuth y redirects post-login/logout.',
      },
      {
        label: 'Probar flujo de registro y login',
        description: 'Verificar que un usuario puede registrarse, hacer login y acceder a rutas protegidas.',
      },
    ],
  },
  hosting: {
    title: 'Hosting Setup',
    description: 'Configura la plataforma de hosting y deployment.',
    icon: '🚀',
    items: [
      {
        label: 'Crear proyecto en la plataforma de hosting',
        description: 'Crear proyecto en Vercel, Railway, Fly.io o el proveedor elegido.',
      },
      {
        label: 'Conectar repositorio de GitHub',
        description: 'Vincular el repo para deployments automaticos en cada push.',
      },
      {
        label: 'Configurar dominio (opcional)',
        description: 'Agregar dominio custom o usar el subdominio por defecto.',
      },
      {
        label: 'Verificar primer deploy',
        description: 'Hacer push y confirmar que el deploy automatico funciona correctamente.',
      },
    ],
  },
  environment: {
    title: 'Environment Variables',
    description: 'Configura todas las variables de entorno necesarias en local y en la plataforma de hosting.',
    icon: '⚙️',
    items: [
      {
        label: 'Crear archivo .env.local',
        description: 'Copiar .env.example y completar con valores reales para desarrollo local.',
      },
      {
        label: 'Configurar variables en la plataforma de hosting',
        description: 'Agregar las mismas variables en Vercel/Railway para el entorno de produccion.',
      },
      {
        label: 'Verificar que los secrets no estan expuestos',
        description: 'Confirmar que .env esta en .gitignore y que las API keys no estan en el codigo.',
      },
    ],
  },
  verification: {
    title: 'Verification & Testing',
    description: 'Verifica que todo el entorno esta configurado y funcionando correctamente.',
    icon: '✅',
    items: [
      {
        label: 'Proyecto corre localmente sin errores',
        description: 'npm run dev / pnpm dev funciona y la app carga en localhost.',
      },
      {
        label: 'Conexion a base de datos funciona',
        description: 'La app puede leer/escribir datos en la base de datos.',
      },
      {
        label: 'Autenticacion funciona end-to-end',
        description: 'Registro, login, logout y acceso a rutas protegidas funcionan.',
      },
      {
        label: 'Deploy a staging/preview funciona',
        description: 'El proyecto se despliega automaticamente y es accesible via URL.',
      },
    ],
  },
}
