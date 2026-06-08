export type Market = 'auto' | 'kr' | 'us'

export const MARKET_OPTIONS: { value: Market; label: string }[] = [
  { value: 'auto', label: '자동' },
  { value: 'kr', label: '한국' },
  { value: 'us', label: '미국' }
]

export const MARKET_PREFIX: Record<Market, string> = {
  auto: '',
  kr: '[한국주식] ',
  us: '[미국주식] '
}

export const MARKET_STORAGE_KEY = 'prompt-market'

export function isValidMarket(v: string): v is Market {
  return v === 'auto' || v === 'kr' || v === 'us'
}
