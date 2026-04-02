# ADR-008: External Design Tool Integration (Figma, V0, Lovable)

**Status:** Accepted  
**Date:** 2026-04-02  
**Supersedes:** Partial — ADR-007 pushed this to v2; this ADR brings it forward.

## Context

The Design Hub (Phase 02) generates wireframes/mockups internally via Claude LLM (HTML+Tailwind). While functional, the output quality does not match dedicated design tools. Users need professional-grade mockups for stakeholder presentations and accurate developer handoff.

## Decision

Add **Pathway C ("Herramientas Externas")** to the Design Hub with three integration levels:

| Tool | Integration | Auth |
|------|-------------|------|
| **Figma** | Full API — fetch file frames, export as PNG, store as artifacts | Personal Access Token per project |
| **V0 by Vercel** | Manual paste — user copies generated React+Tailwind code | No token required |
| **Lovable** | Link/embed — store external URL as artifact reference | No token required |

### Key decisions:

1. **Token storage per project** (not per user) — consistent with `supabase_access_token` pattern in `projects` table
2. **Unified artifact table** — external artifacts use same `design_artifacts` table with `source` discriminator column
3. **Same approval workflow** — external artifacts go through draft → approved, same as internal
4. **Phase 04 compatibility** — all approved artifacts (internal or external) appear in developer resource bar

## Consequences

**Positive:**
- Professional mockups from Figma feed directly into the IA DLC pipeline
- V0 code paste provides production-quality React+Tailwind components
- Lovable links preserve full-app prototypes as reference
- Uniform approval flow regardless of source

**Negative:**
- Figma API has rate limits (~30 req/min) — frame picker may be slow for large files
- V0 has no stable public API — manual paste only
- Lovable may block iframe embedding — fallback to link card
- Token management adds complexity to project settings
