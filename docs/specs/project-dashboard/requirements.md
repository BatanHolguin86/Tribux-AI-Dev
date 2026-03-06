# Requirements: Project Dashboard

**Feature:** 02 — Project Dashboard
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-06
**Status:** Pendiente aprobacion CEO/CPO

---

## Contexto

El Project Dashboard es el centro de comando del usuario dentro de la plataforma. Es la primera pantalla que ve despues del onboarding y cada vez que regresa. Desde aqui gestiona sus proyectos, visualiza el progreso por fase y navega al trabajo activo. Para el usuario no-tecnico, este dashboard es su "sala de control" — necesita comunicar progreso de forma clara, motivadora y sin jerga tecnica.

---

## User Stories

### Vista General de Proyectos
- Como usuario autenticado, quiero ver todos mis proyectos en el dashboard, para tener una vision rapida del estado de todo mi trabajo.
- Como usuario, quiero ver en cada proyecto tarjeta: nombre, fase actual, porcentaje de progreso y fecha de ultima actividad, para entender de un vistazo donde esta cada proyecto.
- Como usuario con multiples proyectos, quiero que el proyecto con actividad mas reciente aparezca primero, para retomar el trabajo sin buscar.
- Como usuario, quiero ver un estado visual diferenciado por fase (completada, activa, bloqueada), para entender que fases ya supere y cual es el siguiente paso.

### Creacion de Proyectos
- Como usuario, quiero crear un nuevo proyecto desde el dashboard con nombre, descripcion e industria, para iniciar un nuevo ciclo IA DLC sin pasar por el onboarding de nuevo.
- Como usuario, quiero que al crear un proyecto sea redirigido automaticamente a Phase 00 de ese proyecto, para empezar a trabajar de inmediato.
- Como usuario en plan Starter, quiero ver un mensaje claro si intento crear un proyecto superando mi limite de plan, para entender que necesito hacer para desbloquearlo (upgrade).

### Navegacion y Acceso Rapido
- Como usuario, quiero hacer click en cualquier proyecto para ir directamente a la fase activa, para retomar el trabajo sin pasos intermedios.
- Como usuario, quiero un boton de acceso rapido a "Continuar" en la tarjeta de cada proyecto, para reducir la friccion de retomar el trabajo.
- Como usuario, quiero poder ver el detalle de fases de un proyecto (timeline completo 00–07) sin tener que entrar al proyecto, para planificar sin interrumpir el flujo.

### Gestion de Proyectos
- Como usuario, quiero archivar proyectos que ya no estan activos, para mantener el dashboard limpio sin perder el trabajo.
- Como usuario, quiero restaurar proyectos archivados, para retomar proyectos pausados cuando sea necesario.
- Como usuario, quiero poder editar el nombre y descripcion de un proyecto desde el dashboard, para corregir errores o actualizar el enfoque sin entrar al proyecto.
- Como usuario, quiero una confirmacion antes de archivar un proyecto, para no hacer esta accion por accidente.

### Busqueda y Filtros
- Como usuario con multiples proyectos, quiero buscar proyectos por nombre, para encontrar rapidamente el que necesito.
- Como usuario, quiero filtrar proyectos por estado (activo, archivado), para no mezclar lo que esta en curso con lo pausado.

### Indicadores de Progreso
- Como usuario, quiero ver el porcentaje de completitud de cada proyecto (basado en fases completadas sobre total), para tener una metrica simple de avance.
- Como usuario, quiero ver un indicador de "siguiente accion" en cada proyecto (ej: "Completa Phase 00" o "Aprueba el spec de Auth"), para saber exactamente que hacer al abrir el proyecto.
- Como usuario, quiero un resumen global en el tope del dashboard (proyectos activos, fases completadas esta semana), para sentir progreso y momentum.

---

## Acceptance Criteria

### Vista General
- [ ] El dashboard muestra todas las tarjetas de proyectos activos del usuario autenticado
- [ ] Cada tarjeta muestra: nombre del proyecto, industria (tag), fase actual (nombre de la fase, no numero), porcentaje de progreso, fecha de ultima actividad en formato relativo ("hace 2 dias")
- [ ] Los proyectos se ordenan por fecha de ultima actividad (mas reciente primero)
- [ ] Si el usuario no tiene proyectos, se muestra un estado vacio con CTA claro "Crea tu primer proyecto"
- [ ] El dashboard carga en menos de 2 segundos con hasta 20 proyectos

### Creacion
- [ ] El modal de creacion de proyecto tiene: campo nombre (requerido, max 80 chars), descripcion (opcional, max 300 chars), selector de industria (lista predefinida de 15 opciones + "Otra")
- [ ] Al crear un proyecto, se redirige a `/projects/:id/phase/00` automaticamente
- [ ] Si el usuario supera el limite de proyectos de su plan, el boton "Nuevo proyecto" muestra un modal de upgrade en lugar del formulario
- [ ] La creacion de proyecto falla con error claro si el nombre esta vacio o supera el limite de caracteres

### Navegacion
- [ ] Click en la tarjeta del proyecto navega a la fase activa del proyecto
- [ ] El boton "Continuar" en la tarjeta lleva directamente a la vista de trabajo de la fase activa
- [ ] El icono de expand en la tarjeta muestra el timeline de fases sin navegar fuera del dashboard
- [ ] El timeline expandido muestra las 8 fases con estado: completada (check verde), activa (highlight), bloqueada (lock gris)

### Gestion
- [ ] El menu de opciones de cada tarjeta (tres puntos) tiene: Editar, Archivar
- [ ] Archivar muestra un dialogo de confirmacion antes de ejecutar
- [ ] Al archivar, la tarjeta desaparece del dashboard principal y aparece en la vista "Archivados"
- [ ] La vista "Archivados" tiene opcion "Restaurar" por proyecto
- [ ] Editar nombre/descripcion abre un modal inline sin navegar a otra pagina
- [ ] Los cambios de nombre/descripcion se guardan con debounce de 500ms (auto-save)

### Busqueda y Filtros
- [ ] El campo de busqueda filtra proyectos en tiempo real (sin submit) por nombre
- [ ] Los tabs "Activos" / "Archivados" filtran el listado correctamente
- [ ] Con busqueda activa y sin resultados, se muestra estado vacio con el termino buscado

### Indicadores
- [ ] El porcentaje de progreso se calcula como: (fases completadas / 8) * 100, redondeado al entero mas cercano
- [ ] La "siguiente accion" se determina por la fase activa y el ultimo estado guardado del proyecto
- [ ] El resumen global en el header muestra: numero de proyectos activos y fases completadas en los ultimos 7 dias

---

## Non-Functional Requirements

- **Performance:** Dashboard carga en < 2s con hasta 20 proyectos (SSR en el servidor, datos desde Supabase)
- **Responsivo:** Layout en grid de 3 columnas en desktop (1280px+), 2 en tablet (768px+), 1 en mobile (375px+)
- **Accesibilidad:** Tarjetas de proyecto navegables por teclado; estados de fase comunicados con texto, no solo color; WCAG 2.1 AA
- **Empty states:** Todos los estados vacios (sin proyectos, busqueda sin resultados, sin archivados) tienen ilustracion, mensaje y CTA

---

## Out of Scope

- Drag & drop para reordenar proyectos manualmente — v1.1
- Vista Kanban o lista de proyectos (alternativa al grid de tarjetas) — v1.1
- Estadisticas detalladas de tiempo invertido por proyecto — v2.0
- Compartir proyecto con otro usuario — v2.0
- Duplicar proyecto como template — v1.1
- Notificaciones push del dashboard — v1.1
