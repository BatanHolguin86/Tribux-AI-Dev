# Phase 00 — Discovery Brief

## AI Squad Command Center

**Fecha:** 2026-03-05
**Fase:** 00 — Discovery & Ideation
**Status:** Completado — pendiente aprobacion CEO/CPO

---

## Resumen Ejecutivo

AI Squad Command Center es una plataforma SaaS B2B que permite a estrategas de negocio sin experiencia tecnica desarrollar **cualquier producto o solucion tecnologica** end-to-end — desde interfaces simples hasta productos complejos con integraciones, soluciones basadas en IA y agentes autonomos — actuando como CEO/CPO de un equipo de agentes IA especializados que sigue la metodologia IA DLC de 8 fases.

**El insight central:** El mercado tiene herramientas para tecnicos o herramientas simplificadas que no escalan. Nadie ha construido la capa de metodologia y proceso que haga la IA generativa accesible y confiable para founders, PMs y consultores no-tecnicos.

---

## Problem Statement

### El Problema

El desarrollo de productos tecnologicos esta fragmentado entre dos mundos que no se comunican bien: los estrategas de negocio que tienen la vision, y los equipos tecnicos que tienen la capacidad de ejecutar. Esta brecha genera:

- **Alto costo de entrada:** Un equipo tecnico minimo cuesta $15k–$25k/mes, inaccesible para la mayoria de founders y PMs no-tecnicos
- **Ciclos lentos:** La traduccion de vision a requerimientos tecnicos toma semanas y genera ambiguedad
- **Perdida de control:** El CEO/CPO pierde visibilidad del desarrollo y depende de intermediarios
- **Calidad impredecible:** Sin metodologia, los proyectos acumulan deuda tecnica y llegan al mercado con baja calidad
- **Barrera de conocimiento:** Los estrategas no pueden participar en decisiones tecnicas criticas

### La Hipotesis Central

Si un estratega de negocio puede actuar como CEO/CPO de un equipo de agentes IA especializados — que traduce su vision en productos tecnologicos reales siguiendo una metodologia estructurada con validacion humana en cada fase — entonces podra desarrollar productos end-to-end sin conocimiento tecnico profundo, reduciendo tiempo y costo de go-to-market en un 70%.

---

## Usuarios Objetivo

Cuatro personas identificadas — ver detalle en `personas.md`:


| Persona         | Perfil                                        | Urgencia | ARPU Estimado   |
| --------------- | --------------------------------------------- | -------- | --------------- |
| Santiago Reyes  | Founder no-tecnico, early-stage               | Alta     | $200–$400/mes   |
| Valentina Mora  | Senior PM en empresa mediana                  | Media    | $500–$800/mes   |
| Rodrigo Fuentes | Consultor / Agency owner                      | Alta     | $800–$1,500/mes |
| Camila Torres   | Emprendedora digital, idea clara, sin equipo  | Muy alta | $99–$199/mes    |

Los cuatro perfiles comparten tres atributos clave: mentalidad experimentadora, claridad sobre la idea de negocio, y la misma brecha — no saben por donde empezar a construir tecnicamente.

**Usuario primario para MVP:** Santiago Reyes (Founder no-tecnico) — caso de uso mas claro, urgencia maxima, menor precio de resistencia.

---

## Value Proposition

**Para** emprendedores digitales, founders no-tecnicos, product managers y consultores
**Que** tienen clara su idea de negocio pero no saben por donde empezar a construirla tecnicamente
**AI Squad es** una plataforma de desarrollo dirigido por IA con metodologia estructurada
**A diferencia de** no-code tools (que no escalan), generadores de codigo (sin proceso) y agencias (caras y lentas)
**Nuestra solucion** convierte la idea clara que ya tienen en cualquier producto o solucion tecnologica real — desde interfaces hasta productos complejos con integraciones y agentes IA — con velocidad, calidad y control estrategico, a una fraccion del costo de un equipo tecnico tradicional

**Diferenciadores clave:**

1. Metodologia IA DLC — proceso, no solo herramienta
2. El humano decide — la IA ejecuta bajo supervision del CEO/CPO
3. Spec-driven (KIRO) — piensa antes de construir
4. Stack opinado — sin decision fatigue, calidad garantizada
5. Conocimiento persistente — el proyecto vive en documentos, no en personas

---

## Modelo de Negocio

**Tipo:** SaaS B2B
**Modelo de pricing (hipotesis inicial):**


| Plan    | Precio   | Para quien                  | Incluye                                         |
| ------- | -------- | --------------------------- | ----------------------------------------------- |
| Starter | $149/mes | Founders early-stage        | 1 proyecto activo, fases 00–04                  |
| Builder | $299/mes | PMs y founders con traccion | 2 proyectos activos, fases 00–06                |
| Agency  | $699/mes | Consultores y agencias      | 5 proyectos, multi-cliente, white-label parcial |


**Target MRR Mes 12:** $100k (≈500 clientes en mix de planes)

---

## Competitive Gap

El mercado esta fragmentado. Nadie combina:

- Metodologia estructurada por fases con validacion humana
- Equipo de agentes IA especializados (no un solo modelo generico)
- Accesible para no-tecnicos con output de calidad profesional

Ver analisis completo en `competitive-analysis.md`.

---

## Riesgos Identificados


| Riesgo                                                             | Probabilidad | Impacto | Mitigacion                                                                  |
| ------------------------------------------------------------------ | ------------ | ------- | --------------------------------------------------------------------------- |
| Los LLMs cometen errores tecnicos que el usuario no puede detectar | Media        | Alto    | Gates de validacion por fase + stack opinado que reduce superficie de error |
| El usuario abandona el proceso a mitad (complejidad percibida)     | Alta         | Alto    | UX que gamifica el progreso + checkpoints de motivacion                     |
| Competidores (Bolt, Lovable) agregan metodologia                   | Media        | Alto    | Velocidad de ejecucion + comunidad + brand de metodologia                   |
| Precio demasiado bajo para ser sostenible                          | Baja         | Medio   | Monitorear LTV/CAC desde el primer mes                                      |
| Dependencia de un solo proveedor de LLM                            | Media        | Alto    | Arquitectura multi-modelo desde el inicio                                   |


---

## Metricas de Exito — North Star

**North Star:** Proyectos completados hasta Phase 06 (produccion) por mes

**Targets clave:**

- Mes 3: $5k MRR, 30% tasa de completion Phase 06, NPS >30
- Mes 6: $25k MRR, 45% tasa de completion, NPS >45
- Mes 12: $100k MRR, 60% tasa de completion, NPS >60

Ver detalle completo en `metrics.md`.

---

## Entregables de Phase 00

- `brief.md` — Problem statement, hipotesis, modelo de negocio
- `personas.md` — 4 user personas con jobs, pains y gains
- `value-proposition.md` — Value Proposition Canvas completo
- `metrics.md` — North Star, KPIs por dimension, targets trimestrales
- `competitive-analysis.md` — 4 categorias, matriz comparativa, gap identificado

---

## Decision Gate — Phase 00

**Recomendacion del Orquestador:** GO

**Justificacion:**

- El problema es real y verificable (no hipotetico)
- El gap competitivo existe y es sustancial
- Los cuatro perfiles tienen willingness to pay estimado
- La tecnologia necesaria existe hoy (LLMs capaces + stack probado)
- El modelo de negocio es directo y con unit economics favorables

**Siguiente paso si el CEO/CPO aprueba:**
Iniciar **Phase 01 — Requirements & Spec (KIRO)** con el primer feature core: el flujo de onboarding y Phase 00 interactivo dentro de la plataforma.

---

**CEO/CPO — tu decision:** Aprobar para avanzar a Phase 01 o solicitar revision de algun entregable.