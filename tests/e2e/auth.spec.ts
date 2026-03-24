import { test, expect } from '@playwright/test'

test.describe('Auth pages', () => {
  test('home shows marketing landing when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/$|\/\?/)
    await expect(page.getByRole('link', { name: /iniciar sesion/i })).toBeVisible()
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Comenzar gratis' })).toBeVisible()
  })

  test('login page loads and shows form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /inicia sesion|iniciar|login/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/contrasena|password/i)).toBeVisible()
  })

  test('register page loads and shows form', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /crea tu cuenta|crear cuenta|registro/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/contrasena|password/i)).toBeVisible()
  })

  test('forgot-password page loads', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { name: /recuperar contrasena/i })).toBeVisible()
  })
})
