export function generateEnvTemplate(project: {
  supabaseRef: string | null
  supabaseApiUrl: string | null
}): string {
  return `# ${project.supabaseRef ? 'Configured' : 'Template'} — Environment Variables
# Copy to .env.local and fill in the values

# Supabase
NEXT_PUBLIC_SUPABASE_URL=${project.supabaseApiUrl ?? 'https://your-project.supabase.co'}
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI (if applicable)
# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...

# Email (if applicable)
# RESEND_API_KEY=re_...

# Error tracking (optional)
# NEXT_PUBLIC_SENTRY_DSN=https://...
# SENTRY_AUTH_TOKEN=sntrys_...
`
}
