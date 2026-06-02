import { FiAlertTriangle, FiTrendingUp } from 'react-icons/fi'

export type FinancialData = {
  company: string
  ticker: string
  asOfDate: string
  currentPrice: { price: string; interpretation: string }
  revenue: { data: { year: string; amount: string; yoyGrowth: string }[]; interpretation: string }
  operatingMargin: { data: { year: string; margin: string }[]; industryAvg: string; interpretation: string }
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

export function tryParseFinancialJson(text: string): FinancialData | null {
  if (!text.trim()) return null
  try {
    const parsed = JSON.parse(text.trim())
    if (parsed && parsed.currentPrice && parsed.grade) return parsed as FinancialData
    return null
  } catch {
    return null
  }
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
              background: 'var(--bg-secondary)',
              borderRadius: 10,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>현재 주가</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>{data.currentPrice.price}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{data.currentPrice.interpretation}</div>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, padding: '0 4px' }}>
            {data.grade.rationale}
          </div>
        </div>
      </div>

      {/* 매출 추이 */}
      <FinancialTableCard
        title="매출 추이"
        icon={<FiTrendingUp size={15} />}
        columns={['연도', '매출액', 'YoY']}
        rows={data.revenue.data.map((d) => [d.year, d.amount, d.yoyGrowth])}
        interpretation={data.revenue.interpretation}
      />

      {/* 수익성 지표 (영업이익률 + 순이익률) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FinancialTableCard
          title="영업이익률"
          columns={['연도', '이익률']}
          rows={data.operatingMargin.data.map((d) => [d.year, d.margin])}
          badge={data.operatingMargin.industryAvg ? `업종 ${data.operatingMargin.industryAvg}` : undefined}
          interpretation={data.operatingMargin.interpretation}
        />
        <FinancialTableCard
          title="순이익률"
          columns={['연도', '이익률']}
          rows={data.netMargin.data.map((d) => [d.year, d.margin])}
          interpretation={data.netMargin.interpretation}
        />
      </div>

      {/* 밸류에이션 지표 (PER + PBR) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FinancialMetricCard
          title="PER"
          value={data.per.current}
          sub={data.per.industryAvg ? `업종 ${data.per.industryAvg}` : undefined}
          interpretation={data.per.interpretation}
        />
        <FinancialMetricCard
          title="PBR"
          value={data.pbr.current}
          sub={data.pbr.industryAvg ? `업종 ${data.pbr.industryAvg}` : undefined}
          interpretation={data.pbr.interpretation}
        />
      </div>

      {/* EPS 추이 */}
      <FinancialTableCard
        title="EPS (주당순이익)"
        columns={['연도', 'EPS', 'YoY']}
        rows={data.eps.data.map((d) => [d.year, d.eps, d.yoyChange])}
        interpretation={data.eps.interpretation}
      />

      {/* ROE 추이 */}
      <FinancialTableCard
        title="ROE (자기자본이익률)"
        columns={['연도', 'ROE']}
        rows={data.roe.data.map((d) => [d.year, d.roe])}
        interpretation={data.roe.interpretation}
      />

      {/* 안정성 지표 (부채비율 + 유동비율) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FinancialMetricCard
          title="부채비율"
          value={data.debtRatio.current}
          interpretation={data.debtRatio.interpretation}
        />
        <FinancialMetricCard
          title="유동비율"
          value={data.currentRatio.current}
          interpretation={data.currentRatio.interpretation}
        />
      </div>

      {/* 리스크 요인 */}
      {data.risks?.length > 0 && (
        <div
          style={{
            border: '1px solid #fecaca',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              background: '#fef2f2',
              borderBottom: '1px solid #fecaca',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: '#991b1b',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FiAlertTriangle size={15} />
            리스크 요인
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-primary)' }}>
            {data.risks.map((risk, i) => (
              <div
                key={i}
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  paddingLeft: 14,
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.45em',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#ef4444',
                    display: 'inline-block',
                  }}
                />
                {risk}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 등급 기준표 */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '8px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)' }}>
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
              background: grade === data.grade.rating ? `${GRADE_COLORS[grade] ?? '#6b7280'}08` : 'var(--bg-primary)',
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

function FinancialTableCard({
  title,
  icon,
  columns,
  rows,
  badge,
  interpretation,
}: {
  title: string
  icon?: React.ReactNode
  columns: string[]
  rows: string[][]
  badge?: string
  interpretation: string
}): React.JSX.Element {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
          {icon}
          {title}
        </div>
        {badge && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>
            {badge}
          </span>
        )}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  padding: '8px 14px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  textAlign: 'left',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: '7px 14px',
                    fontSize: 'var(--text-xs)',
                    color: j === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
                    fontWeight: j === 0 ? 400 : 600,
                    borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
                    background: 'var(--bg-primary)',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {interpretation && (
        <div
          style={{
            padding: '10px 14px',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            borderTop: '1px solid var(--border)',
            background: '#f8fafc',
          }}
        >
          {interpretation}
        </div>
      )}
    </div>
  )
}

function FinancialMetricCard({
  title,
  value,
  sub,
  interpretation,
}: {
  title: string
  value: string
  sub?: string
  interpretation: string
}): React.JSX.Element {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
        {title}
      </div>
      <div style={{ padding: '14px', background: 'var(--bg-primary)' }}>
        <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
        {sub && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</div>
        )}
      </div>
      {interpretation && (
        <div
          style={{
            padding: '10px 14px',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            borderTop: '1px solid var(--border)',
            background: '#f8fafc',
          }}
        >
          {interpretation}
        </div>
      )}
    </div>
  )
}
