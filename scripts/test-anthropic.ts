/**
 * Prueba rápida de conexión a Anthropic (API key y créditos).
 * Uso: pnpm exec tsx scripts/test-anthropic.ts
 * Requiere: ANTHROPIC_API_KEY en .env.local
 */
import * as path from 'path'
import { config } from 'dotenv'

config({ path: path.resolve(process.cwd(), '.env.local') })
config({ path: path.resolve(process.cwd(), '.env') })
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

async function main() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || key === 'sk-ant-...') {
    console.error('❌ ANTHROPIC_API_KEY no configurada. Añádela a .env.local')
    process.exit(1)
  }

  console.log('🔑 API key encontrada. Llamando a Claude...')
  const start = Date.now()

  try {
    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      maxTokens: 100,
      prompt: 'Responde en una sola frase: ¿Cuánto es 2+2?',
    })
    const elapsed = Date.now() - start
    console.log('✅ Anthropic respondió en', elapsed, 'ms')
    console.log('   Respuesta:', text.trim().slice(0, 120))
  } catch (err) {
    console.error('❌ Error al llamar a Anthropic:', (err as Error).message)
    if ((err as Error).message?.includes('credit') || (err as Error).message?.includes('insufficient')) {
      console.error('   Parece un problema de créditos. Revisa console.anthropic.com')
    }
    process.exit(1)
  }
}

main()
