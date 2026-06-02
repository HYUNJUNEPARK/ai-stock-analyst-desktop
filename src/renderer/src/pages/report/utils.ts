/**
 * 보고서 UI에서 공유하는 유틸리티 함수 및 상수
 */

export const VERDICT_COLORS: Record<string, string> = {
  '적극 매수': '#e53935',
  '분할 매수': '#f57c00',
  '관망': '#f9a825',
  '비중 축소': '#388e3c',
  '매도': '#1976d2'
}

export const INVEST_TYPE_COLORS: { keyword: string; color: string }[] = [
  { keyword: '실적 성장형', color: '#16a34a' },
  { keyword: '저평가 가치형', color: '#2563eb' },
  { keyword: '턴어라운드형', color: '#d97706' },
  { keyword: '모멘텀형', color: '#7c3aed' },
  { keyword: '고위험 테마형', color: '#dc2626' },
  { keyword: '배당·방어형', color: '#0891b2' },
]

export const HORIZON_LABELS: Record<string, { label: string; color: string }> = {
  '단기': { label: '단기', color: '#dc2626' },
  '중기': { label: '중기', color: '#d97706' },
  '장기': { label: '장기', color: '#16a34a' },
}

export function getInvestTypeColor(type: string): string {
  for (const { keyword, color } of INVEST_TYPE_COLORS) {
    if (type.includes(keyword)) return color
  }
  return '#6b7280'
}

export function getSignalColor(signal: string | undefined): string {
  if (!signal) return '#f59e0b'
  if (signal.includes('상승 추세')) return '#22c55e'
  if (signal.includes('하락 추세')) return '#ef4444'
  const hasBullish = signal.includes('강세') || signal.includes('긍정')
  const hasBearish = signal.includes('약세') || signal.includes('부정')
  if (hasBullish && hasBearish) return '#f97316'
  if (hasBullish) return '#22c55e'
  if (hasBearish) return '#ef4444'
  return '#f59e0b'
}

export function getValuationPositionColor(position: string): string {
  if (position.includes('저평가')) return '#22c55e'
  if (position.includes('과열')) return '#ef4444'
  if (position.includes('낙관')) return '#f97316'
  if (position.includes('기준 근처')) return '#f59e0b'
  return '#f59e0b'
}

export function getAgentVerdictColor(value: string): string {
  if (!value || value === '데이터 없음') return '#6b7280'
  const lower = value.toLowerCase()
  if (lower.includes('🟢') || lower.includes('긍정') || lower.includes('강세') || lower.includes('저평가') || lower.includes('매수')) return '#22c55e'
  if (lower.includes('🔴') || lower.includes('부정') || lower.includes('약세') || lower.includes('고평가') || lower.includes('매도') || lower.includes('과열')) return '#ef4444'
  if (lower.includes('🟠') || lower.includes('고위험')) return '#f97316'
  if (/^[ab]$/i.test(value.trim())) return '#22c55e'
  if (/^[cd]$/i.test(value.trim())) return '#ef4444'
  return '#f59e0b'
}

export function parsePriceToNumber(price: string): number | null {
  const cleaned = price.replace(/[$원,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export function calcPctFromCurrent(itemPrice: string, currentPrice: string): string | null {
  const current = parsePriceToNumber(currentPrice)
  const target = parsePriceToNumber(itemPrice)
  if (current == null || target == null || current === 0) return null
  const pct = ((target - current) / current) * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}
