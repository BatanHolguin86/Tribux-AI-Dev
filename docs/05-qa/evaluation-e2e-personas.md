# Evaluación E2E del producto — Perspectiva de personas

**Fecha:** 2026-03-11  
**Evaluadores (rol):** Santiago Reyes (Founder no-técnico) y Camila Torres (Emprendedora digital)  
**Alcance:** Flujo punta a punta, procesos, UX/UI, diseño, capacidades de agentes  

---

## Resumen ejecutivo

Evaluamos el producto como si fuéramos **Santiago** (CEO con idea clara, sin CTO, necesita MVP en 60–90 días) y **Camila** (emprendedora con idea en la cabeza, miedo a gastar mal, quiere dar el primer paso sin perderse). La plataforma cumple bien el rol de “guía con metodología” y el CTO Virtual da confianza; hay oportunidades claras en onboarding, lenguaje y visibilidad del progreso para no-tecnicos.

---

# Parte 1 — Santiago Reyes (Founder no-técnico)

## Flujo general

**Onboarding → Dashboard → Phase 00 → Phase 01 → Agentes**

- **Onboarding:** Rápido: nombre, industria, persona, nombre del proyecto. Me queda claro que estoy creando “mi primer proyecto” y que después hay fases. Falta un “qué va a pasar después” en una frase (ej.: “En los próximos pasos vas a definir el problema que resuelves y para quién, con ayuda del asistente”).
- **Dashboard:** Entro y veo mis proyectos, filtro activos/archivados y búsqueda. El CTA “Continuar” o ir a Phase 00 está bien. Echo en falta un indicador muy visible de “siguiente paso recomendado” (ej. “Tu proyecto X está en Discovery: completa 2 de 5 secciones”).
- **Phase 00 (Discovery):** Las 5 secciones (Problem Statement, User Personas, Value Proposition, Success Metrics, Brief) con chat + documento generado + aprobar me encajan. El asistente pregunta en español y sin tecnicismos. El progreso “X de 5 secciones completadas” y la barra me dan sensación de avance. Las secciones bloqueadas con candado evitan que me disperse.
- **Phase 01 (KIRO):** Aquí ya se nota que es “más técnico”: “features”, “requirements”, “design”, “tasks”. Para mí (CEO) tiene sentido: primero defino *qué* quiero (features), luego el sistema me ayuda a especificarlo. El resumen de Phase 00 (Discovery) en colapsable está bien para no perder el hilo. Lo que me costó un poco fue entender que debo *crear* features (nombre/descripción) y luego, por cada uno, pasar por requirements → design → tasks en ese orden. Un tooltip o una línea de ayuda tipo “Primero agrega los features de tu producto; después el asistente te guiará para cada uno” reduciría fricción.
- **Agentes:** El CTO Virtual en la barra lateral y el botón flotante son un acierto. Poder preguntar “¿cómo vamos?” o “¿qué me recomiendas para el roadmap?” sin salir del proyecto da sensación de control. Los agentes “especializados” (Product Architect, Lead Developer, etc.) aparecen bloqueados para plan Starter; está claro que es un upgrade, pero no sé qué ganaría exactamente (ej. “Desbloquea 7 agentes para arquitectura, código y QA” con un ejemplo corto).

## UX/UI y diseño

- **Consistencia:** Misma barra de progreso (violeta), mismos patrones de “chat a la izquierda, documento a la derecha” en Phase 00 y en Phase 01. Eso me ayuda a no re-aprender en cada fase.
- **Navegación:** Breadcrumb “Proyectos / [Nombre] / Phase 00: Discovery” y el stepper de fases en la sidebar me orientan. En móvil, los tabs (Chat / Documento, o Lista / Chat / Documento) funcionan, aunque a veces echo de menos ver lista de features y chat a la vez sin cambiar de tab.
- **Lenguaje:** Casi todo en español. Algunos términos (“features”, “specs KIRO”, “approve”) son aceptables si se explican una vez; un glosario corto o tooltips en la primera visita ayudarían a alguien 100 % no-técnico.
- **Errores y vacíos:** Cuando no hay documento generado, el mensaje “Conversa con el orquestador para generar este documento” está bien. Los avisos de “Error de conexión” o “mensaje no puede estar vacío” que vimos antes ya se han corregido; que el producto explique *qué* hacer (ej. “Vuelve a enviar el mensaje” o “Crea una nueva conversación”) sigue siendo importante.

## Capacidades de los agentes

- **CTO Virtual:** Responde en contexto del proyecto (fase actual, discovery, etc.). Para mí es el “traductor” y el que da confianza: puedo preguntar en lenguaje de negocio y recibir respuestas accionables. Me gustaría que a veces propusiera el siguiente paso concreto (“Te recomiendo cerrar el Problem Statement y generar el documento antes de pasar a Personas”).
- **Especializados (bloqueados):** La descripción de cada uno (Product Architect, System Architect, etc.) está clara. No puedo evaluar la calidad de las respuestas hasta tener acceso; la restricción por plan está bien comunicada (candado, disabled).

## Feedback Santiago (resumen)

| Aspecto            | Valoración | Comentario breve                                                                 |
|--------------------|-----------|-----------------------------------------------------------------------------------|
| Claridad del flujo | 8/10      | Fases y secuencia se entienden; Phase 01 podría explicar mejor “features → specs”. |
| Sensación de control| 8/10      | Progreso visible, aprobar antes de avanzar, CTO Virtual a mano.                    |
| Lenguaje no-técnico| 7/10      | Mayoría en español y claro; 2–3 términos (KIRO, features) piden una sola explicación. |
| Onboarding         | 7/10      | Rápido; falta “qué viene después” y siguiente paso en dashboard.                  |
| Agentes            | 8/10      | CTO Virtual muy útil; sugerencias proactivas (“continúa Discovery”, “habla con CTO”) suman. |
| Diseño visual      | 8/10      | Limpio, coherente; no distrae.                                                    |

**Cita:**  
> “Me gusta que no me piden que entienda código ni arquitectura. El CTO Virtual y las fases me dan la sensación de que hay un proceso y que yo decido. Lo que mejoraría es que al entrar a Phase 01 me digan en una línea qué tengo que hacer primero (agregar features) y qué viene después (conversar y aprobar cada doc).”

---

# Parte 2 — Camila Torres (Emprendedora digital)

## Flujo general

- **Onboarding:** “Tu primer proyecto” y el placeholder “Ej: Mi App de Delivery” me ayudan a bajar la idea a algo concreto. El paso de “persona” (CEO, PM, etc.) me hizo pensar si yo encajo; un ejemplo tipo “Soy emprendedora con una idea clara” podría hacer el onboarding más cercano.
- **Dashboard:** Ver un solo proyecto con “Continuar” está bien. Si tuviera varios, el resumen “X de 5 secciones” o “Phase 01: 2 features completados” en la card me ayudaría a elegir por dónde seguir.
- **Phase 00:** Las preguntas del asistente en Phase 00 (Problem Statement, Personas, etc.) son las que yo necesito: “Descríbemelo como si se lo contaras a un amigo — sin tecnicismos”. Eso quita miedo. Poder aprobar sección por sección y ver el documento generado me da la sensación de que “ya tengo algo escrito” y no solo una charla.
- **Phase 01:** Aquí me perdí un poco la primera vez. “Features” suena a producto de software; para mí sería más natural “Partes o funcionalidades de tu producto” o “Qué debe hacer tu producto (por bloques)”. Agregar un feature con nombre y descripción está bien; lo que no tenía claro era que *cada* feature tiene su propia conversación (requirements, design, tasks). Un mensaje tipo “Cada feature es un bloque de tu producto; para cada uno vas a definir requisitos, diseño y tareas con el asistente” me habría orientado.
- **Agentes:** El CTO Virtual desde el botón flotante es perfecto para “preguntar algo rápido” sin tener que buscar. Que los otros agentes estén bloqueados no me molesta en plan Starter; lo que sí me gustaría es un mensaje tipo “En plan Builder desbloqueas agentes para arquitectura, código y QA” con un enlace a precios o a “Saber más”.

## UX/UI y diseño

- **Primera impresión:** Interfaz tranquila, sin ruido. Los colores violetas y grises no cansan. El ícono de “cerebro” del CTO Virtual y los emojis en fases (🔍, 📋, etc.) dan personalidad sin parecer juguetes.
- **Progreso:** Ver “0 de 5 secciones” o “1 de 3 features completados” y la barra me motiva. Me gustaría que al completar una sección o un feature hubiera un refuerzo breve (ej. “Listo: Problem Statement aprobado” o “Feature X completado”) antes de pasar al siguiente.
- **Móvil:** Los tabs en Phase 00 y 01 funcionan; a veces quiero ver el documento mientras escribo en el chat y en móvil tengo que cambiar de pestaña. Es manejable pero mejorable si en el futuro se pudiera tener chat y documento más juntos en pantallas pequeñas.

## Capacidades de los agentes

- **CTO Virtual:** Para mí es como un “mentor técnico que no me abruma”. Preguntas como “¿por dónde empiezo?” o “¿esto que estoy escribiendo sirve para algo?” encajan. Que conteste en contexto del proyecto (nombre, fase, discovery) hace que no sienta que estoy hablando con un chatbot genérico.
- **Sugerencias proactivas:** En la sidebar aparecen cosas como “Continúa el brief de Discovery” o “Consulta al CTO Virtual”. Eso me guía cuando no sé qué hacer. Un “Ya casi terminas Phase 00: te falta Success Metrics” sería aún más concreto.

## Feedback Camila (resumen)

| Aspecto            | Valoración | Comentario breve                                                                 |
|--------------------|-----------|-----------------------------------------------------------------------------------|
| Claridad del flujo | 7/10      | Phase 00 muy clara; Phase 01 pide una explicación corta de “features” y del orden.  |
| Sensación de avance| 8/10      | Barras y contadores ayudan; refuerzo al completar sección/feature sumaría.         |
| Lenguaje no-técnico| 7/10      | Casi todo accesible; “features” y “specs KIRO” se pueden suavizar con copy.       |
| Onboarding         | 7/10      | Rápido; añadir “qué sigue” y opción “soy emprendedora con una idea” ayudaría.     |
| Agentes            | 8/10      | CTO Virtual y sugerencias muy útiles; explicar qué da el plan Builder.           |
| Diseño visual      | 8/10      | Profesional y calmado; bien para usar seguido.                                    |

**Cita:**  
> “Llevo meses con la idea en la cabeza y aquí por fin siento que hay pasos concretos. El asistente en Phase 00 no me habla en términos raros. Lo que me hubiera ayudado es que al pasar a Phase 01 me dijeran: ‘Ahora vamos a dividir tu producto en partes (features); para cada parte vas a definir qué debe hacer, cómo se diseña y qué tareas hay’. Así no me quedo mirando la pantalla sin saber si debo escribir o hacer clic en algo.”

---

# Conclusiones y recomendaciones prioritarias

## Qué está funcionando bien

1. **Metodología visible:** Las 8 fases y el orden (Discovery → Requirements → …) dan estructura y confianza a ambos perfiles.
2. **CTO Virtual y sugerencias:** Punto de contacto único, contexto del proyecto y sugerencias en sidebar alineadas con “siguiente paso”.
3. **Patrón chat + documento + aprobar:** Consistente en Phase 00 y 01; refuerza “piensa → genera → apruebas”.
4. **Diseño:** Coherente, accesible, sin ruido visual.

## Mejoras sugeridas (por impacto)

| Prioridad | Mejora | Persona que más lo nota |
|-----------|--------|--------------------------|
| Alta      | En Phase 01: una línea de ayuda o tooltip al entrar: “Agrega los features (partes) de tu producto; luego, para cada uno, el asistente te guiará por requisitos → diseño → tareas”. | Camila, Santiago |
| Alta      | Dashboard: siguiente paso visible en la card del proyecto (ej. “Phase 00: 2/5 secciones” o “Phase 01: completa el feature Login”). | Ambos |
| Media     | Onboarding: paso final o resumen con “Qué viene después” (ir a Discovery, responder preguntas con el asistente, etc.). | Camila |
| Media     | Refuerzo breve al aprobar sección o feature (“Listo: Problem Statement aprobado” / “Feature X completado”). | Camila |
| Media     | Glosario o tooltips en primera visita: “Feature”, “Specs KIRO”, “Aprobar”. | Santiago, Camila |
| Baja      | Plan Builder: en la UI de agentes bloqueados, una línea tipo “Desbloquea 7 agentes (arquitectura, código, QA)” + link. | Santiago |
| Baja      | Onboarding: opción de “persona” más cercana a “Emprendedora con idea clara”. | Camila |

---

**Documento generado como evaluación de producto desde las personas Santiago Reyes y Camila Torres (docs/00-discovery/02-personas.md).**  
Para profundizar en métricas o en otras personas (Valentina, Rodrigo), se puede repetir el mismo formato de evaluación.
