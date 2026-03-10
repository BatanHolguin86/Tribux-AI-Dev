# Success Metrics & KPIs — AI Squad Command Center

**Fecha:** 2026-03-05
**Fase:** Phase 00 — Discovery

---

## North Star Metric

**Proyectos completados hasta Phase 06 (Launch) por mes**

Esta metrica captura el valor real entregado: usuarios que no solo empezaron sino que llegaron a tener un producto en produccion. Indica que la metodologia funciona end-to-end.

---

## Metricas por Dimension

### 1. Adquisicion

| KPI | Descripcion | Target Mes 3 | Target Mes 6 | Target Mes 12 |
|-----|-------------|--------------|--------------|---------------|
| Nuevos signups/mes | Usuarios que crean cuenta | 50 | 200 | 1,000 |
| Tasa de activacion | Signups que inician Phase 00 | 60% | 70% | 75% |
| CAC (Cost of Acquisition) | Costo por cliente adquirido | <$150 | <$100 | <$80 |
| Fuente principal de trafico | Canal con mayor conversion | Referidos | Contenido | Mixto |

### 2. Activacion

| KPI | Descripcion | Target Mes 3 | Target Mes 6 | Target Mes 12 |
|-----|-------------|--------------|--------------|---------------|
| Time-to-first-spec | Tiempo hasta completar Phase 01 | <3 dias | <2 dias | <1 dia |
| Tasa Phase 00→01 | Usuarios que pasan de discovery a spec | 70% | 75% | 80% |
| Tasa Phase 01→02 | Usuarios que aprueban spec y avanzan | 60% | 68% | 75% |
| Calidad del brief | Score de completitud del brief (1-10) | 7.0 | 7.5 | 8.0 |

### 3. Retencion & Engagement

| KPI | Descripcion | Target Mes 3 | Target Mes 6 | Target Mes 12 |
|-----|-------------|--------------|--------------|---------------|
| MRR Retention | Suscriptores activos mes a mes | 70% | 80% | 85% |
| Proyectos por usuario/ano | Proyectos completados por cuenta | 1.2 | 1.8 | 2.5 |
| DAU/MAU | Frecuencia de uso activo | 20% | 30% | 40% |
| Tasa de completion (Phase 06) | Proyectos que llegan a produccion | 30% | 45% | 60% |

### 4. Revenue

| KPI | Descripcion | Target Mes 3 | Target Mes 6 | Target Mes 12 |
|-----|-------------|--------------|--------------|---------------|
| MRR | Monthly Recurring Revenue (Starter/Builder/Agency; Enterprise es adicional) | $5k | $25k | $100k |
| ARR | Annual Recurring Revenue | $60k | $300k | $1.2M |
| ARPU global | Revenue promedio por usuario | $150 | $200 | $250 |
| ARPU Emprendedor (Camila) | Revenue plan Starter | $99–$149 | $99–$149 | $149 |
| ARPU Founder/PM (Santiago/Valentina) | Revenue plan Builder | $299 | $299 | $299 |
| ARPU Consultor (Rodrigo) | Revenue plan Agency | $699 | $699 | $699 |
| LTV | Lifetime Value estimado | $900 | $1,400 | $2,000 |
| LTV/CAC | Ratio de eficiencia de adquisicion | >3x | >5x | >8x |
| Churn mensual | Cancelaciones sobre base activa | <8% | <5% | <3% |

### 5. Producto & Calidad

| KPI | Descripcion | Target Mes 3 | Target Mes 6 | Target Mes 12 |
|-----|-------------|--------------|--------------|---------------|
| NPS | Net Promoter Score | 30 | 45 | 60 |
| CSAT | Satisfaccion por fase completada | 4.0/5 | 4.3/5 | 4.5/5 |
| Tiempo promedio Phase 00→06 | Dias hasta produccion | 90 dias | 75 dias | 60 dias |
| Tasa de retrabajo | Fases que requieren revision mayor | <30% | <20% | <15% |
| Lighthouse score promedio | Calidad tecnica de MVPs entregados | >80 | >85 | >90 |

---

## Metricas de Validacion de Hipotesis (Phase 00)

Estas metricas son especificas para validar las hipotesis de discovery antes de construir:

### Hipotesis 1: El problema es real y urgente
- **Metrica:** % de usuarios entrevistados que identifican la brecha tecnica como su principal bloqueador
- **Target de validacion:** >70%
- **Como medir:** Entrevistas cualitativas con 10 usuarios objetivo

### Hipotesis 2: El usuario puede operar sin conocimiento tecnico
- **Metrica:** % de usuarios (sin background tecnico) que completan Phase 01 sin asistencia
- **Target de validacion:** >60%
- **Como medir:** Test de usabilidad con prototipo de Phase 01

### Hipotesis 3: El precio es acceptable por perfil
- **Metrica:** Willingness to pay declarado en rangos de precio por segmento
- **Target de validacion:** >50% de founders/PMs/consultores acepta pagar $200+/mes; >60% de emprendedores digitales acepta pagar $99+/mes
- **Como medir:** Encuesta de precio segmentada por persona + test de landing page con pricing por plan

### Hipotesis 4: La metodologia genera confianza
- **Metrica:** % de usuarios que confian en el output de la IA despues de ver un ejemplo completo
- **Target de validacion:** >65%
- **Como medir:** Demo + encuesta de confianza post-sesion

### Hipotesis 5: El emprendedor digital puede arrancar sin friccion
- **Metrica:** % de usuarios del perfil Camila (sin proyecto previo, sin equipo) que completan Phase 00 en su primera sesion
- **Target de validacion:** >55%
- **Como medir:** Test de usabilidad con 5 usuarios del perfil emprendedor digital sin experiencia tecnica previa

---

## Metricas de Salud del Negocio (Trimestral)

| Metrica | Q1 | Q2 | Q3 | Q4 |
|---------|----|----|----|----|
| MRR | $5k | $25k | $60k | $100k |
| Clientes activos | 35 | 125 | 300 | 500 |
| Proyectos en produccion | 10 | 55 | 140 | 300 |
| NPS | 30 | 45 | 55 | 60 |
| Team size | 2 | 3 | 5 | 7 |

---

## Definition of Done — Phase 00

Phase 00 se considera exitosa cuando:

- [ ] Problem statement redactado y validado con CEO/CPO
- [ ] 4 personas definidas con jobs, pains y gains especificos
- [ ] Value Proposition Canvas completo con fit statement
- [ ] KPIs definidos con targets para M3, M6 y M12
- [ ] Competitive analysis completado con gap identificado
- [ ] Decision de go/no-go documentada
- [ ] `docs/00-discovery/01-brief.md` actualizado con todos los hallazgos
