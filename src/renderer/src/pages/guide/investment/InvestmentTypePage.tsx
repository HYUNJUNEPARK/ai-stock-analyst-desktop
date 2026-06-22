import { useSearchParams } from 'react-router-dom'
import NavBar from '../../../components/NavBar'
import { SectionTitle } from '../technical-analysis/components/SectionTitle'
import { Label } from '../technical-analysis/components/Label'
import data from '../../../data/invest-type-criteria.json'

const RISK_COLOR: Record<string, string> = {
  '낮음': '#22c55e',
  '보통': '#f59e0b',
  '높음': '#ef4444',
  '매우 높음': '#b91c1c',
}

const HORIZON_COLOR: Record<string, string> = {
  '단기': '#8b5cf6',
  '중기': '#3b82f6',
  '장기': '#10b981',
}

const HORIZON_DESC: Record<string, string> = {
  '단기': '수일~수개월 내 이벤트나 모멘텀을 활용하는 투자 기간',
  '중기': '수개월~1~2년 내 실적 개선·재평가 가능성을 보는 투자 기간',
  '장기': '2년 이상 꾸준한 성장과 복리 효과를 기대하는 투자 기간',
}

export default function InvestmentTypePage(): React.JSX.Element {
  const [searchParams] = useSearchParams()
  const isWindow = searchParams.get('mode') === 'window'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <NavBar
        onBack={() => window.close()}
        backLabel={isWindow ? '닫기' : '뒤로'}
        title="투자 유형 분류 기준"
      />
      <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 48px' }}>

        {/* 설명 */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            {data.description}
          </p>
        </div>

        {/* 투자 유형 카드 */}
        <section style={{ marginBottom: 28 }}>
          <SectionTitle>투자 유형</SectionTitle>
          <div style={{ display: 'grid', gap: 14 }}>
            {data.types.map((type) => (
              <div
                key={type.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '18px 20px',
                }}
              >
                {/* 유형 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {type.name}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    {type.nameEn}
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge color={RISK_COLOR[type.riskLevel] ?? '#6b7280'}>
                      위험 {type.riskLevel}
                    </Badge>
                  </div>
                </div>

                {/* 설명 */}
                {'description' in type && typeof type.description === 'string' && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>
                    {type.description}
                  </p>
                )}

                {/* 분류 기준 */}
                <div style={{ marginBottom: 12 }}>
                  <Label>분류 기준</Label>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18, display: 'grid', gap: 4 }}>
                    {type.criteria.map((c, i) => (
                      <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 핵심 지표 */}
                <div style={{ marginBottom: 12 }}>
                  <Label>핵심 지표</Label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {type.keyMetrics.map((m) => (
                      <span
                        key={m}
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontFamily: "'SF Mono', 'Menlo', monospace",
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 적합 투자 기간 */}
                <div>
                  <Label>적합 투자 기간</Label>
                  <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                    {type.suitableHorizon.map((h) => (
                      <div
                        key={h}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Badge color={HORIZON_COLOR[h] ?? '#6b7280'}>{h}</Badge>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {HORIZON_DESC[h] ?? ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 복합 유형 */}
        <section style={{ marginBottom: 28 }}>
          <SectionTitle>복합 유형</SectionTitle>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '16px 20px',
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.55 }}>
              {data.compositeRules.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {data.compositeRules.examples.map((ex) => (
                <span
                  key={ex}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '3px 10px',
                  }}
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>
        </section>

      </div>
      </div>
    </div>
  )
}

function Badge({ children, color }: { children: React.ReactNode; color: string }): React.JSX.Element {
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      color: '#fff',
      background: color,
      borderRadius: 5,
      padding: '2px 7px',
    }}>
      {children}
    </span>
  )
}
