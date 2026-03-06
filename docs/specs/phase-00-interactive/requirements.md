# Requirements: Phase 00 Interactivo — Discovery

**Feature:** 03 — Phase 00 Interactivo
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-06
**Status:** Pendiente aprobacion CEO/CPO

---

## Contexto

Phase 00 es el primer momento de valor real del producto. El usuario llega con una idea de negocio pero sin claridad tecnica — y esta fase lo transforma en un estratega con un discovery documentado y aprobado. Es la fase que diferencia a AI Squad de un simple generador de codigo: el orquestador guia una conversacion estructurada que produce 5 documentos de calidad profesional antes de escribir una linea de codigo.

La experiencia debe sentirse como trabajar con un consultor experto que hace las preguntas correctas, no como llenar un formulario.

---

## User Stories

### Entrada a Phase 00
- Como usuario nuevo, quiero que Phase 00 se abra automaticamente con un mensaje de bienvenida del orquestador contextualizado con el nombre de mi proyecto, para sentir que el sistema entiende mi contexto desde el inicio.
- Como usuario que regresa, quiero ver el progreso que ya tenia en Phase 00 (secciones completadas y documentos generados), para retomar exactamente donde lo deje sin repetir trabajo.
- Como usuario, quiero ver claramente cuales de las 5 secciones del discovery ya complete y cuales me faltan, para tener orientacion en todo momento.

### Conversacion Guiada con el Orquestador
- Como usuario, quiero que el orquestador me haga preguntas especificas y contextualizadas para cada seccion del discovery, para no tener que saber que informacion es relevante — el sistema me guia.
- Como usuario, quiero poder responder en lenguaje natural y conversacional, para no tener que aprender un formato especial ni usar jerga tecnica.
- Como usuario, quiero que el orquestador valide mis respuestas y me pida mas detalle cuando sean insuficientes, para que el documento final tenga calidad real.
- Como usuario, quiero ver las respuestas del orquestador en streaming (aparecer palabra por palabra), para tener feedback inmediato de que el sistema esta trabajando.
- Como usuario, quiero poder editar mis mensajes anteriores si me equivoque, para corregir el rumbo sin reiniciar la conversacion.

### Generacion de Documentos
- Como usuario, quiero que al completar cada seccion de la conversacion el orquestador genere automaticamente el documento markdown correspondiente, para no tener que escribir yo el documento — el sistema lo hace a partir de nuestra conversacion.
- Como usuario, quiero ver el documento generado en un panel lateral junto a la conversacion, para revisar el output mientras sigo la conversacion.
- Como usuario, quiero poder editar el documento generado directamente en el panel lateral, para ajustar detalles sin tener que volver a conversar.
- Como usuario, quiero que los cambios que hago al documento manualmente sean reconocidos por el orquestador en mensajes futuros, para mantener consistencia entre la conversacion y los documentos.

### Secciones del Discovery
- Como usuario, quiero que el orquestador me guie por estas 5 secciones en orden: Problem Statement, User Personas, Value Proposition, Success Metrics, Competitive Analysis, para cubrir todos los aspectos criticos del discovery.
- Como usuario, quiero que cada seccion tenga su propio hilo de conversacion separado, para navegar entre secciones sin perder el contexto de cada una.
- Como usuario, quiero poder navegar entre secciones ya completadas para revisarlas, para mantener consistencia del discovery completo.

### Gates de Aprobacion
- Como usuario, quiero que al terminar cada seccion el orquestador me presente el documento generado y me pida aprobacion explicitamente, para mantener el control de lo que se documenta.
- Como usuario, quiero poder aprobar una seccion con un click o solicitar revision con un mensaje, para un flujo de aprobacion simple pero controlado.
- Como usuario, quiero que al aprobar las 5 secciones el orquestador me presente un resumen del discovery completo y me pida aprobacion final de Phase 00, para una confirmacion consciente antes de avanzar.
- Como usuario, quiero que al aprobar Phase 00 se desbloquee Phase 01 automaticamente y reciba una confirmacion clara de ese avance, para sentir progreso tangible.

### Documentos y Persistencia
- Como usuario, quiero que todos los documentos generados en Phase 00 esten accesibles desde el sidebar de documentos del proyecto, para consultarlos en cualquier momento.
- Como usuario, quiero que si el orquestador actualiza un documento (por revision), se guarde la version anterior, para no perder ningun trabajo previo.

---

## Acceptance Criteria

### Entrada y Contexto
- [ ] Al entrar a `/projects/:id/phase/00`, el orquestador saluda con un mensaje que incluye el nombre del proyecto y el perfil del usuario (persona seleccionada en onboarding)
- [ ] Si el usuario ya tenia progreso, la UI muestra las secciones completadas con check y la seccion activa destacada; la conversacion carga desde el historial
- [ ] El panel de progreso lateral muestra las 5 secciones con estado: pendiente, en progreso, completada

### Conversacion
- [ ] El orquestador inicia cada seccion con una pregunta de apertura especifica (no generica) adaptada al perfil del usuario y al contexto del proyecto
- [ ] Las respuestas del orquestador se muestran en streaming; el primer token aparece en menos de 2 segundos
- [ ] El input del usuario acepta texto libre, multilinea, con submit por Enter (Shift+Enter para nueva linea) o boton
- [ ] El orquestador detecta respuestas insuficientes (menos de 20 palabras en preguntas criticas) y solicita elaboracion antes de generar el documento
- [ ] El historial de conversacion es persistente por seccion — al navegar fuera y volver, el historial esta intacto
- [ ] El usuario puede reenviar su ultimo mensaje si la respuesta del orquestador fallo

### Generacion de Documentos
- [ ] Al completar la conversacion de una seccion, el orquestador genera el documento markdown correspondiente en el panel lateral en menos de 15 segundos
- [ ] El documento se muestra en vista formateada (markdown renderizado) con boton para cambiar a modo edicion raw
- [ ] Los cambios manuales en el documento se auto-guardan en Supabase con debounce de 1 segundo
- [ ] El orquestador acusa recibo de ediciones manuales relevantes con un mensaje contextual en la siguiente interaccion

### Secciones y Documentos Generados
- [ ] **Seccion 1 — Problem Statement** genera: `docs/discovery/brief.md` (problem statement + hipotesis + criterios de exito)
- [ ] **Seccion 2 — User Personas** genera: `docs/discovery/personas.md` (minimo 3 personas con jobs, pains, gains)
- [ ] **Seccion 3 — Value Proposition** genera: `docs/discovery/value-proposition.md` (VPC completo + fit statement)
- [ ] **Seccion 4 — Success Metrics** genera: `docs/discovery/metrics.md` (north star + KPIs por dimension + targets)
- [ ] **Seccion 5 — Competitive Analysis** genera: `docs/discovery/competitive-analysis.md` (landscape + matriz + gap)

### Gates de Aprobacion
- [ ] Al terminar cada seccion, el orquestador presenta el documento y muestra dos opciones: "Aprobar seccion" (boton) y campo de texto para solicitar revision
- [ ] Si el usuario solicita revision, el orquestador retoma la conversacion de esa seccion con el feedback
- [ ] Al aprobar las 5 secciones, aparece el gate final de Phase 00 con resumen de los 5 documentos aprobados
- [ ] El gate final tiene boton "Aprobar Phase 00 y avanzar a Phase 01" con dialogo de confirmacion
- [ ] Al aprobar Phase 00: el status de `project_phases` donde `phase_number = 0` cambia a `completed`, el status de `phase_number = 1` cambia a `active`, y el usuario ve una celebracion visual (animacion)

### Restricciones de Plan
- [ ] Usuarios en plan Starter pueden completar Phase 00 sin restriccion
- [ ] Si el plan del usuario no incluye Phase 00 (plan futuro de prueba gratuita limitada), se muestra paywall antes de entrar

---

## Non-Functional Requirements

- **Streaming:** Primer token de respuesta del orquestador en < 2s; respuesta completa en < 30s para documentos largos
- **Persistencia:** Toda la conversacion y los documentos se guardan en tiempo real — 0 perdida de datos si el usuario cierra el browser
- **Concurrencia:** El sistema maneja correctamente si el usuario abre la misma fase en dos tabs (ultima escritura gana, con aviso)
- **Accesibilidad:** El chat es navegable por teclado; los mensajes del orquestador son leidos por screen readers al aparecer (aria-live)
- **Mobile:** La experiencia de chat es completamente funcional en mobile — el panel de documento se muestra debajo del chat o como tab alternativa

---

## Out of Scope

- Generacion de imagenes o diagramas visuales para el discovery — v2.0
- Importar brief existente desde un documento externo (PDF, Notion) — v1.1
- Colaboracion en tiempo real en el mismo Phase 00 con otro usuario — v2.0
- Voz a texto para input del usuario — v2.0
- Traduccion automatica al ingles de los documentos generados — v1.1
- Comparar dos versiones del mismo documento (diff view) — v1.1
