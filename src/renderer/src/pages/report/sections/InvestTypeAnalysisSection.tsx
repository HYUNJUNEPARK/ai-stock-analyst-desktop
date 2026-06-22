/**
 * 투자 유형 분류 에이전트 결과 뷰
 * 종목의 투자 유형(성장형/가치형/턴어라운드 등), 적합 기간, 판단 근거를 표시한다.
 */
import { FiAlertTriangle } from 'react-icons/fi'
import LinkText from '../components/LinkText'
import { tryParseJson, BulletList, BulletCard, RiskSection } from './shared'

export type InvestTypeData = {
  company: string
  ticker: string
  asOfDate: string
  coreIdea: string
  investType: string
  rationale: {
    financial: string
    news: string
    sector: string
    price: string
    valuation: string
    conflict: string
  }
  suitableHorizon: string
  horizonReason: string
  keyIndicators: string[]
  risks: string[]
}

function isInvestTypeData(v: unknown): v is InvestTypeData {
  return v != null && typeof v === 'object' && 'investType' in v && 'rationale' in v
}

export function tryParseInvestTypeJson(text: string): InvestTypeData | null {
  return tryParseJson(text, isInvestTypeData)
}

const TYPE_COLORS: { keyword: string; color: string }[] = [
  { keyword: '실적 성장형', color: '#16a34a' },
  { keyword: '저평가 가치형', color: '#2563eb' },
  { keyword: '턴어라운드형', color: '#d97706' },
  { keyword: '모멘텀형', color: '#7c3aed' },
  { keyword: '고위험 테마형', color: '#dc2626' },
  { keyword: '배당·방어형', color: '#0891b2' },
]

const HORIZON_STYLES: Record<string, { color: string }> = {
  '단기': { color: '#dc2626' },
  '중기': { color: '#d97706' },
  '장기': { color: '#16a34a' },
}

function getTypeColor(type: string): string {
  for (const { keyword, color } of TYPE_COLORS) {
    if (type.includes(keyword)) return color
  }
  return '#6b7280'
}

export default function InvestTypeAnalysisSection({ data }: { data: InvestTypeData }): React.JSX.Element {
  const primaryColor = getTypeColor(data.investType)
  const horizonStyle = HORIZON_STYLES[data.suitableHorizon] ?? { color: '#6b7280' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 투자 유형 + 기간 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        <div style={{ flex: '0 0 auto', padding: '16px 20px', background: `${primaryColor}0d`, border: `1px solid ${primaryColor}40`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>투자 유형</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {data.investType.split('+').map((p) => p.trim()).filter(Boolean).map((part) => (
              <span key={part} style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: getTypeColor(part), background: `${getTypeColor(part)}15`, border: `1px solid ${getTypeColor(part)}50`, borderRadius: 6, padding: '2px 8px' }}>
                {part}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: horizonStyle.color, background: `${horizonStyle.color}15`, border: `1px solid ${horizonStyle.color}40`, borderRadius: 6, padding: '2px 8px' }}>
            {data.suitableHorizon}
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>핵심 투자 아이디어</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.65 }}><LinkText>{data.coreIdea}</LinkText></div>
          </div>
          {data.horizonReason && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, padding: '0 4px' }}>
              <LinkText>{data.horizonReason}</LinkText>
            </div>
          )}
        </div>
      </div>

      {/* 유형 판단 근거 */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
          유형 판단 근거
        </div>
        {([
          ['재무 분석', data.rationale.financial],
          ['뉴스 분석', data.rationale.news],
          ['업종 리서치', data.rationale.sector],
          ['기술적 분석', data.rationale.price],
          ['밸류에이션', data.rationale.valuation],
        ] as [string, string][]).map(([label, content]) => (
          <div key={label} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: '#fff', display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0, width: 80 }}>{label}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65 }}><LinkText>{content}</LinkText></span>
          </div>
        ))}
        {data.rationale.conflict && data.rationale.conflict !== '없음' && (
          <div style={{ padding: '10px 14px', background: '#fffbeb', display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#d97706', flexShrink: 0, width: 80 }}>충돌 사항</span>
            <span style={{ fontSize: 'var(--text-xs)', color: '#92400e', lineHeight: 1.65 }}><LinkText>{data.rationale.conflict}</LinkText></span>
          </div>
        )}
      </div>

      {/* 주요 확인 지표 */}
      <BulletCard title="주요 확인 지표" items={data.keyIndicators} color="#2563eb" />

      {/* 주요 리스크 */}
      <RiskSection title="주요 리스크" risks={data.risks} icon={<FiAlertTriangle size={15} />} />
    </div>
  )
}
