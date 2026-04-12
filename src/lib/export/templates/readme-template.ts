export function generateReadme(project: {
  name: string
  description: string | null
  repoUrl: string | null
  supabaseRef: string | null
  vercelUrl: string | null
}): string {
  return `# ${project.name}

${project.description ?? 'Proyecto generado con Tribux.'}

## Tech Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes + Supabase Edge Functions
- **Database:** PostgreSQL via Supabase (RLS habilitado)
- **Auth:** Supabase Auth (JWT)
- **Hosting:** Vercel

## Setup

### 1. Clonar repositorio

\`\`\`bash
git clone ${project.repoUrl ?? '<repo-url>'}
cd ${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
pnpm install
\`\`\`

### 2. Configurar variables de entorno

\`\`\`bash
cp .env.example .env.local
# Completar las variables en .env.local
\`\`\`

### 3. Ejecutar en desarrollo

\`\`\`bash
pnpm dev
\`\`\`

### 4. Deploy

\`\`\`bash
pnpm build
# Deploy a Vercel: conectar repo en vercel.com
\`\`\`

## Resources

${project.repoUrl ? `- **Repositorio:** ${project.repoUrl}` : ''}
${project.supabaseRef ? `- **Supabase:** https://supabase.com/dashboard/project/${project.supabaseRef}` : ''}
${project.vercelUrl ? `- **Vercel:** ${project.vercelUrl}` : ''}

---

_Generado por [Tribux](https://tribux.com)_
`
}
