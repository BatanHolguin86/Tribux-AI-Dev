# ADR-004: Almacenamiento de Documentos en Supabase Storage

**Status:** Accepted
**Fecha:** 2026-03-08
**Contexto:** Estrategia de almacenamiento para documentos del proyecto (discovery, specs, artifacts, designs)

---

## Decision

Almacenar los archivos markdown y imagenes de diseño en **Supabase Storage** (buckets privados), con un **cache del contenido en la columna `content` de la tabla correspondiente** para lecturas rapidas.

## Contexto

El producto genera multiples documentos por proyecto:
- Discovery docs (5 markdowns, ~5-20KB cada uno)
- KIRO specs (3 markdowns por feature, ~5-30KB cada uno)
- Artifacts (markdowns de respuestas guardadas, tamaño variable)
- Design artifacts (PNG/SVG wireframes/mockups, ~100KB-2MB)

Se necesita:
- Almacenamiento persistente y escalable
- Acceso controlado por usuario (RLS)
- Lecturas rapidas para mostrar documentos en la UI
- Versionado basico

## Opciones Evaluadas

| Criterio | Storage + DB cache | Solo DB (columna text) | S3 externo |
|----------|:---:|:---:|:---:|
| Archivos grandes | ✓ | Limitado (< 1MB) | ✓ |
| RLS integrado | ✓ (via signed URLs) | ✓ (directo) | ✗ (IAM separado) |
| Lectura rapida | ✓ (cache en DB) | ✓ | ✗ (latencia extra) |
| Costo adicional | $0 (incluido Supabase) | $0 | ~$5/mo S3 |
| Complejidad | Media | Baja | Alta |
| Imagenes | ✓ | ✗ | ✓ |

## Justificacion

- **Markdowns en Storage**: Evita inflar la DB con contenido largo. Storage es optimizado para archivos.
- **Cache en DB (`content` column)**: Para markdowns < 50KB, se mantiene una copia en la tabla `project_documents` o `feature_documents`. Esto permite lecturas en una sola query sin llamar a Storage.
- **Signed URLs**: Los archivos en Storage son privados. El servidor genera URLs firmadas de corta duracion (1 hora) para que el cliente acceda.
- **Dos buckets**: `project-documents` para markdowns, `project-designs` para imagenes. Separacion por tipo de contenido.

## Estructura

```
project-documents/ (private bucket)
└── projects/{project_id}/
    ├── discovery/{doc}.md
    ├── specs/{feature}/{doc}.md
    └── artifacts/{name}.md

project-designs/ (private bucket)
└── {project_id}/{artifact_id}.{ext}
```

## Consecuencias

**Positivas:**
- Un solo servicio (Supabase) para DB + Storage + Auth
- Cache en DB elimina latencia de Storage para markdowns
- Signed URLs dan seguridad sin RLS complejo en Storage

**Negativas/Riesgos:**
- Duplicacion de contenido (Storage + DB cache) para markdowns — aceptable dado el tamaño pequeno
- Sincronizar cache en DB con archivo en Storage requiere disciplina (actualizar ambos en la misma operacion)
