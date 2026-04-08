/**
 * Credit pack definitions — shared between client and server.
 * Keep this file free of server-only imports.
 */

export type CreditPack = {
  id: string
  label: string
  amountUsd: number
  priceUsd: number
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'small',  label: '+$25 de IA',  amountUsd: 25,  priceUsd: 25 },
  { id: 'medium', label: '+$50 de IA',  amountUsd: 50,  priceUsd: 50 },
  { id: 'large',  label: '+$100 de IA', amountUsd: 100, priceUsd: 100 },
]
