# ADR-009: One-Click Infrastructure Setup

**Status:** Accepted  
**Date:** 2026-04-02

## Context

Phase 03 requires users to manually create GitHub repos, Supabase projects, and Vercel projects, then paste URLs and tokens. This blocks non-technical users (personas Camila and Santiago) from progressing beyond Phase 02.

## Decision

Implement platform-level automated setup:

1. **Platform-level tokens** — Tribux AI holds its own GitHub org, Supabase org, and Vercel team. Users don't configure anything.
2. **One Supabase project per Tribux AI project** — isolated databases, not shared schemas.
3. **SSE-based progress streaming** — the setup takes 1-3 minutes (Supabase provisioning), so progress is streamed to the client in real-time.
4. **Partial failure recovery** — each step saves to DB immediately. Re-running skips already-configured services (idempotent).

### Platform tokens required:
- `PLATFORM_GITHUB_TOKEN` — PAT with repo + admin:org scopes
- `PLATFORM_GITHUB_ORG` — GitHub organization for created repos
- `PLATFORM_SUPABASE_TOKEN` — Supabase Management API token
- `PLATFORM_SUPABASE_ORG_ID` — Supabase organization ID
- `PLATFORM_VERCEL_TOKEN` — Vercel API token
- `PLATFORM_VERCEL_TEAM_ID` — Vercel team ID

## Consequences

**Positive:**
- Non-technical users can set up infrastructure with one click
- Consistent setup across all user projects
- Platform controls infrastructure quality and security

**Negative:**
- Platform bears infrastructure costs (Supabase free tier per project)
- Requires maintaining platform accounts (GitHub org, Supabase org, Vercel team)
- Manual checklists remain as fallback when platform tokens aren't configured
