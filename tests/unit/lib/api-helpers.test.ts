import { describe, it, expect } from 'vitest'
import { ApiError } from '@/lib/api/with-project-auth'
import { badRequest, unauthorized, notFound, rateLimited, internalError } from '@/lib/api/responses'

describe('ApiError', () => {
  it('creates error with statusCode, code, and message', () => {
    const err = new ApiError(404, 'not_found', 'Proyecto no encontrado.')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('not_found')
    expect(err.message).toBe('Proyecto no encontrado.')
    expect(err.name).toBe('ApiError')
  })

  it('toResponse returns correct JSON response', async () => {
    const err = new ApiError(401, 'unauthorized', 'No autenticado.')
    const res = err.toResponse()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('unauthorized')
    expect(body.message).toBe('No autenticado.')
  })

  it('is an instance of Error', () => {
    const err = new ApiError(500, 'internal', 'Server error')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ApiError)
  })
})

describe('API response helpers', () => {
  it('badRequest returns 400', async () => {
    const res = badRequest('Campo requerido.')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('bad_request')
    expect(body.message).toBe('Campo requerido.')
  })

  it('badRequest includes details when provided', async () => {
    const res = badRequest('Validacion fallida', { field: 'email' })
    const body = await res.json()
    expect(body.details).toEqual({ field: 'email' })
  })

  it('unauthorized returns 401', async () => {
    const res = unauthorized()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('unauthorized')
  })

  it('notFound returns 404', async () => {
    const res = notFound('Ticket no existe.')
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.message).toBe('Ticket no existe.')
  })

  it('rateLimited returns 429', async () => {
    const res = rateLimited()
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toBe('rate_limited')
  })

  it('internalError returns 500', async () => {
    const res = internalError()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('internal_error')
  })
})
