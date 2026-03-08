import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, current_phase, last_activity')
    .eq('user_id', user!.id)
    .order('last_activity', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Mis Proyectos</h1>
      <p className="mt-1 text-sm text-gray-600">
        Gestiona tus productos con tu equipo de agentes IA.
      </p>

      {projects && projects.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <a
              key={project.id}
              href={`/projects/${project.id}/phase/${String(project.current_phase).padStart(2, '0')}`}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              <p className="mt-1 text-sm text-gray-500">
                Phase {String(project.current_phase).padStart(2, '0')}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    project.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {project.status}
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-gray-500">No tienes proyectos aun.</p>
        </div>
      )}
    </div>
  )
}
