# Requirements: Orquestador + Agentes Especializados

**Feature:** 05 — Orquestador + Agentes
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-08
**Status:** Pendiente aprobacion CEO/CPO

---

## Contexto

El Orquestador y los Agentes Especializados son el corazon inteligente de AI Squad. Mientras Phase 00 y Phase 01 usan el orquestador en modo guiado (conversacion estructurada con output definido), este modulo expone el chat libre con el CTO Virtual y 7 agentes especializados que el usuario puede consultar en cualquier momento del proyecto. Cada agente tiene un system prompt diferente, conocimiento especializado y acceso al contexto completo del proyecto.

La experiencia debe sentirse como tener un equipo de expertos disponible 24/7 que conoce tu proyecto en profundidad — no como un chatbot generico al que hay que dar contexto cada vez.

---

## User Stories

### Acceso al Chat de Agentes
- Como usuario, quiero acceder al chat de agentes desde cualquier fase del proyecto, para consultar dudas o pedir ayuda sin interrumpir mi flujo de trabajo.
- Como usuario, quiero ver la lista de agentes disponibles con su nombre, especialidad y una descripcion corta, para elegir el agente correcto para mi pregunta.
- Como usuario, quiero que al abrir un chat con un agente este ya tenga el contexto completo de mi proyecto (discovery, specs, fase actual), para no tener que explicar todo desde cero.

### CTO Virtual (Orquestador General)
- Como usuario, quiero poder chatear con el CTO Virtual para preguntas generales sobre mi proyecto, para tener un punto de consulta unico cuando no se cual agente necesito.
- Como usuario, quiero que el CTO Virtual me recomiende a que agente especializado consultar si mi pregunta es muy especifica, para un routing inteligente.
- Como usuario, quiero que el CTO Virtual tenga vision holistica del proyecto — discovery, specs, fase actual, decisiones previas — para respuestas informadas.

### Agentes Especializados
- Como usuario, quiero chatear con el **Product Architect** para decisiones de producto, priorizacion de features y scope, para tener guia estrategica.
- Como usuario, quiero chatear con el **System Architect** para decisiones de arquitectura, seleccion de tecnologias y patrones de diseno, para tener guia tecnica de alto nivel.
- Como usuario, quiero chatear con el **UI/UX Designer** para wireframes, mockups y refinamiento de diseños a partir de los specs del proyecto, para tener referencias visuales antes de desarrollar.
- Como usuario, quiero chatear con el **Lead Developer** para preguntas de implementacion, codigo, debugging y best practices, para resolver dudas de desarrollo.
- Como usuario, quiero chatear con el **DB Admin** para diseno de esquemas, queries, migraciones, RLS y optimizacion de base de datos, para tener guia de datos.
- Como usuario, quiero chatear con el **QA Engineer** para estrategia de testing, generacion de test cases y analisis de calidad, para asegurar la calidad del producto.
- Como usuario, quiero chatear con el **DevOps Engineer** para deployment, CI/CD, monitoring, infraestructura y configuracion de servicios, para tener guia operacional.

### Conversacion y Contexto
- Como usuario, quiero que las respuestas se muestren en streaming (palabra por palabra), para feedback inmediato.
- Como usuario, quiero ver el historial completo de mis conversaciones con cada agente por proyecto, para no perder contexto entre sesiones.
- Como usuario, quiero poder iniciar multiples conversaciones con el mismo agente (hilos separados), para organizar temas diferentes.
- Como usuario, quiero que las respuestas incluyan formato markdown enriquecido (codigo, tablas, listas, headers), para respuestas utiles y bien formateadas.
- Como usuario, quiero poder detener la generacion de una respuesta si el agente se fue por un camino incorrecto, para no desperdiciar tiempo.

### Artifacts y Exportacion
- Como usuario, quiero poder guardar una respuesta del agente como artifact (documento) dentro de mi proyecto, para preservar decisiones y recomendaciones importantes.
- Como usuario, quiero que los artifacts guardados sean accesibles desde el sidebar de documentos del proyecto, para consultarlos junto con los demas docs.
- Como usuario, quiero poder copiar respuestas individuales al portapapeles, para usarlas fuera de la plataforma.

---

## Acceptance Criteria

### Acceso y Navegacion
- [ ] El chat de agentes es accesible desde `/projects/:id/agents` y desde un boton flotante visible en todas las fases del proyecto
- [ ] La pagina muestra una lista de 8 agentes (CTO Virtual + 7 especializados) con: nombre, icono, especialidad (1 linea), descripcion (2-3 lineas)
- [ ] Al seleccionar un agente, se abre la interfaz de chat con el historial existente cargado
- [ ] El usuario puede navegar entre agentes sin perder el contexto de conversaciones abiertas

### CTO Virtual
- [ ] El CTO Virtual tiene acceso a todo el contexto del proyecto: discovery docs, KIRO specs, fase actual, historial de decisiones
- [ ] Si el usuario hace una pregunta muy especifica de un area, el CTO sugiere el agente especializado con un boton de "Hablar con [Agente]"
- [ ] El system prompt del CTO Virtual incluye: vision holistica, capacidad de delegacion, conocimiento de la metodologia IA DLC

### Agentes Especializados
- [ ] Cada agente tiene un system prompt unico que define su: rol, expertise, tono, tipo de preguntas que maneja, formato de respuesta preferido
- [ ] Cada agente recibe automaticamente el contexto completo del proyecto al iniciar la conversacion
- [ ] Los agentes responden dentro de su area de expertise; si la pregunta esta fuera de su ambito, redirigen al CTO Virtual o al agente apropiado
- [ ] Los 7 agentes especializados son: Product Architect, System Architect, UI/UX Designer, Lead Developer, DB Admin, QA Engineer, DevOps Engineer

### Chat y Streaming
- [ ] Las respuestas se streaman token por token; primer token en < 2s
- [ ] Las respuestas se renderizan con markdown completo: headers, listas, code blocks con syntax highlighting (por lenguaje), tablas
- [ ] El usuario puede detener la generacion en cualquier momento con un boton "Stop"
- [ ] El input acepta texto multilinea (Shift+Enter para nueva linea, Enter para enviar)
- [ ] El historial de conversacion persiste en `agent_conversations` y se carga al re-abrir el chat

### Hilos de Conversacion
- [ ] El usuario puede crear un nuevo hilo con el mismo agente (boton "Nueva conversacion")
- [ ] La lista de hilos se muestra en un sidebar colapsable dentro del chat, con titulo auto-generado del primer mensaje
- [ ] Los hilos se ordenan por ultima actividad (mas reciente primero)
- [ ] El usuario puede eliminar hilos individuales

### Artifacts
- [ ] Cada mensaje del agente tiene un boton "Guardar como artifact" (icono de documento)
- [ ] Al guardar, se pide: nombre del artifact y fase a la que pertenece (selector)
- [ ] El artifact se almacena en Supabase Storage en `projects/{id}/artifacts/{nombre}.md` y se registra en `project_documents`
- [ ] Los artifacts aparecen en el sidebar de documentos del proyecto bajo una seccion "Artifacts"
- [ ] Cada mensaje tiene boton "Copiar" que copia el contenido al portapapeles

### Restricciones de Plan
- [ ] Plan Starter: acceso solo al CTO Virtual
- [ ] Plan Builder, Agency y Enterprise: acceso a todos los 7 agentes (Enterprise con limites y alcance segun contrato)
- [ ] Si el usuario intenta acceder a un agente no incluido en su plan, se muestra paywall contextualizado

### Manejo de Errores
- [ ] Si la API de Anthropic falla, se muestra mensaje amigable con boton "Reintentar"
- [ ] Si la respuesta se corta por max_tokens, se muestra indicador "Respuesta truncada" con boton "Continuar generando"
- [ ] El historial de conversacion nunca se pierde por errores del LLM

---

## Non-Functional Requirements

- **Streaming:** Primer token en < 2s; respuesta completa promedio en < 20s
- **Persistencia:** Toda la conversacion se guarda en tiempo real; si el browser se cierra, al reabrir el historial esta completo
- **Contexto IA:** Cada agente recibe el contexto completo del proyecto (discovery + specs + artifacts). Si excede 100K tokens, se aplica truncamiento inteligente con resumen
- **Concurrencia:** El usuario puede tener chats abiertos con multiples agentes simultaneamente (tabs del browser)
- **Accesibilidad:** Chat navegable por teclado; mensajes anunciados por screen readers (aria-live); contraste AA en burbujas de chat
- **Mobile:** Chat completamente funcional en mobile; lista de agentes se muestra como selector; sidebar de hilos se muestra como drawer

---

## Out of Scope

- Agentes que ejecutan codigo (corren scripts, hacen commits) — v2.0
- Agentes con memoria persistente entre proyectos — v2.0
- Conversaciones multi-agente (dos agentes discuten entre si) — v2.0
- Adjuntar archivos o imagenes al chat — v1.1
- Audio/voz para input del usuario — v2.0
- Sugerencias proactivas de los agentes (sin que el usuario pregunte) — v1.1
- Personalizacion de system prompts por el usuario — v2.0
