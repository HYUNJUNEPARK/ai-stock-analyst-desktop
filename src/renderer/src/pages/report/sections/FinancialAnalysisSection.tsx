/**
 * 재무 분석 에이전트 결과 뷰
 * 매출/이익률/PER/PBR/EPS/ROE/부채비율 등 재무 지표를 구조화하여 표시한다.
 */
import { FiAlertTriangle, FiTrendingUp } from 'react-icons/fi'
import LinkText from '../components/LinkText'
import { tryParseJson, TableCard, MetricCard, RiskSection } from './shared'

export type FinancialData = {
  company: string
  ticker: string
  asOfDate: string
  currentPrice: { price: string; interpretation: string }
  revenue: { data: { year: string; amount: string; yoyGrowth: string }[]; interpretation: string }
  operatingProfit: { data: { year: string; amount: string; margin: string }[]; industryAvg: string; interpretation: string }
  netMargin: { data: { year: string; margin: string }[]; interpretation: string }
  per: { current: string; industryAvg: string; interpretation: string }
  eps: { data: { year: string; eps: string; yoyChange: string }[]; interpretation: string }
  pbr: { current: string; industryAvg: string; interpretation: string }
  roe: { data: { year: string; roe: string }[]; interpretation: string }
  debtRatio: { current: string; interpretation: string }
  currentRatio: { current: string; interpretation: string }
  risks: string[]
  grade: { rating: string; criteria: Record<string, string>; rationale: string }
}

function isFinancialData(v: unknown): v is FinancialData {
  return v != null && typeof v === 'object' && 'currentPrice' in v && 'grade' in v
}

export function tryParseFinancialJson(text: string): FinancialData | null {
  return tryParseJson(text, isFinancialData)
}

const GRADE_COLORS: Record<string, string> = {
  A: '#16a34a',
  B: '#2563eb',
  C: '#f59e0b',
  D: '#ef4444',
}

export default function FinancialAnalysisSection({ data }: { data: FinancialData }): React.JSX.Element {
  const gradeColor = GRADE_COLORS[data.grade.rating] ?? '#6b7280'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 등급 배지 + 현재 주가 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        {/* 등급 */}
        <div
          style={{
            flex: '0 0 auto',
            padding: '16px 24px',
            background: `${gradeColor}0d`,
            border: `1px solid ${gradeColor}40`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>재무 등급</div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: gradeColor }}>{data.grade.rating}</div>
        </div>
        {/* 현재 주가 + 등급 근거 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              padding: '12px 16px',
              background: '#fff',
              borderRadius: 10,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>현재 주가</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>{data.currentPrice.price}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}><LinkText>{data.currentPrice.interpretation}</LinkText></div>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, padding: '0 4px' }}>
            <LinkText>{data.grade.rationale}</LinkText>
          </div>
        </div>
      </div>

      {/* 매출 추이 */}
      <TableCard
        title="매출 추이"
        icon={<FiTrendingUp size={15} />}
        columns={['연도', '매출액', 'YoY']}
        rows={data.revenue.data.map((d) => [d.year, d.amount, d.yoyGrowth])}
        interpretation={data.revenue.interpretation}
      />

      {/* 수익성 지표 (영업이익률 + 순이익률) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <TableCard
          title="영업이익"
          columns={['연도', '금액', '이익률']}
          rows={data.operatingProfit.data.map((d) => [d.year, d.amount, d.margin])}
          badge={data.operatingProfit.industryAvg ? `업종 ${data.operatingProfit.industryAvg}` : undefined}
          interpretation={data.operatingProfit.interpretation}
        />
        <TableCard
          title="순이익률"
          columns={['연도', '이익률']}
          rows={data.netMargin.data.map((d) => [d.year, d.margin])}
          interpretation={data.netMargin.interpretation}
        />
      </div>

      {/* 밸류에이션 지표 (PER + PBR) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <MetricCard
          title="PER"
          value={data.per.current}
          sub={data.per.industryAvg ? `업종 ${data.per.industryAvg}` : undefined}
          interpretation={data.per.interpretation}
        />
        <MetricCard
          title="PBR"
          value={data.pbr.current}
          sub={data.pbr.industryAvg ? `업종 ${data.pbr.industryAvg}` : undefined}
          interpretation={data.pbr.interpretation}
        />
      </div>

      {/* EPS 추이 */}
      <TableCard
        title="EPS (주당순이익)"
        columns={['연도', 'EPS', 'YoY']}
        rows={data.eps.data.map((d) => [d.year, d.eps, d.yoyChange])}
        interpretation={data.eps.interpretation}
      />

      {/* ROE 추이 */}
      <TableCard
        title="ROE (자기자본이익률)"
        columns={['연도', 'ROE']}
        rows={data.roe.data.map((d) => [d.year, d.roe])}
        interpretation={data.roe.interpretation}
      />

      {/* 안정성 지표 (부채비율 + 유동비율) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <MetricCard
          title="부채비율"
          value={data.debtRatio.current}
          interpretation={data.debtRatio.interpretation}
        />
        <MetricCard
          title="유동비율"
          value={data.currentRatio.current}
          interpretation={data.currentRatio.interpretation}
        />
      </div>

      {/* 리스크 요인 */}
      <RiskSection title="리스크 요인" risks={data.risks} icon={<FiAlertTriangle size={15} />} />

      {/* 등급 기준표 */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '8px 14px', background: '#fff', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)' }}>
          등급 기준
        </div>
        {Object.entries(data.grade.criteria).map(([grade, desc]) => (
          <div
            key={grade}
            style={{
              padding: '6px 14px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: grade === data.grade.rating ? `${GRADE_COLORS[grade] ?? '#6b7280'}08` : '#fff',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 800,
                color: GRADE_COLORS[grade] ?? '#6b7280',
                width: 20,
                textAlign: 'center',
              }}
            >
              {grade}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{desc}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
        본 분석은 공개된 재무 데이터를 기반으로 하며 투자 권유가 아닙니다.
      </div>
    </div>
  )
}
