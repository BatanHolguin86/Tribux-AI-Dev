export function generateTransferGuide(project: {
  name: string
  repoUrl: string | null
  supabaseRef: string | null
  vercelUrl: string | null
}): string {
  const steps: string[] = []
  let stepNum = 1

  if (project.repoUrl) {
    steps.push(`### Paso ${stepNum}: Transferir repositorio GitHub

1. Ir a ${project.repoUrl}/settings
2. Scroll a "Danger Zone" → "Transfer ownership"
3. Ingresar el nombre del nuevo owner (usuario u organizacion del cliente)
4. Confirmar la transferencia
5. El cliente acepta la transferencia desde su email

> Alternativa: hacer fork si no quieres transferir el original.
`)
    stepNum++
  }

  if (project.supabaseRef) {
    steps.push(`### Paso ${stepNum}: Migrar base de datos Supabase

**Opcion A — Transferir proyecto (recomendado si el cliente tiene cuenta Supabase):**
1. Ir a https://supabase.com/dashboard/project/${project.supabaseRef}/settings/general
2. Click "Transfer project"
3. Seleccionar la organizacion del cliente
4. El cliente acepta desde su dashboard

**Opcion B — Exportar e importar schema:**
1. Usa el archivo \`database/schema.sql\` incluido en este bundle
2. El cliente crea un nuevo proyecto Supabase
3. Ejecuta el schema SQL en el SQL Editor de Supabase
4. Actualiza las variables de entorno con las nuevas credenciales

> Los datos (filas) NO se incluyen en la exportacion por seguridad. Si necesitas migrar datos, usa \`pg_dump\` directamente.
`)
    stepNum++
  }

  if (project.vercelUrl) {
    steps.push(`### Paso ${stepNum}: Re-configurar hosting Vercel

1. El cliente crea un nuevo proyecto en Vercel
2. Conecta el repositorio GitHub (ya transferido)
3. Configura las variables de entorno (ver \`.env.example\`)
4. Vercel deploya automaticamente al detectar el repo

> No es necesario transferir el proyecto Vercel original. Es mas simple crear uno nuevo.
`)
    stepNum++
  }

  steps.push(`### Paso ${stepNum}: Verificacion final

- [ ] El cliente puede clonar el repo
- [ ] Las variables de entorno estan configuradas
- [ ] La base de datos tiene el schema correcto
- [ ] El deploy funciona y la app carga
- [ ] El auth (login/registro) funciona
- [ ] Los datos se persisten correctamente
`)

  return `# Guia de Transferencia — ${project.name}

Esta guia describe como transferir este proyecto a un cliente o nueva organizacion.

---

${steps.join('\n---\n\n')}
---

_Generado por AI Squad Command Center_
`
}
