import { useSearchParams } from 'react-router-dom'
import NavBar from '../../../components/NavBar'
import data from '../../../data/valuation-terms.json'

export default function ValuationTermsPage(): React.JSX.Element {
  const [searchParams] = useSearchParams()
  const isWindow = searchParams.get('mode') === 'window'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <NavBar
        onBack={() => window.close()}
        backLabel={isWindow ? '닫기' : '뒤로'}
        title="투자 지표 용어 사전"
      />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 48px' }}>

          {/* 설명 */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {data.description}
            </p>
          </div>

          {/* 지표 카드 */}
          <section style={{ marginBottom: 32 }}>
            <SectionTitle>지표 설명</SectionTitle>
            <div style={{ display: 'grid', gap: 16 }}>
              {data.metrics.map((metric) => (
                <div
                  key={metric.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '20px',
                  }}
                >
                  {/* 헤더 */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{metric.name}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{metric.fullName}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{metric.oneLiner}</div>
                  </div>

                  {/* 설명 */}
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>
                    {metric.description}
                  </p>

                  {/* 공식 */}
                  <div style={{ marginBottom: 14 }}>
                    <Label>공식</Label>
                    <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                      {metric.formulas.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: 12,
                            color: 'var(--text-primary)',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            padding: '6px 10px',
                            fontFamily: "'SF Mono', 'Menlo', monospace",
                          }}
                        >
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 수치 범위 */}
                  <div style={{ marginBottom: 14 }}>
                    <Label>수치 해석</Label>
                    <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                      {metric.ranges.map((r, i) => {
                        const hl = 'highlight' in r && r.highlight
                        return (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              gap: 10,
                              fontSize: 12,
                              padding: '6px 10px',
                              background: hl ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-primary)',
                              border: hl ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' : '1px solid var(--border)',
                              borderRadius: 6,
                            }}
                          >
                            <span style={{
                              flexShrink: 0,
                              color: hl ? 'var(--accent)' : 'var(--text-primary)',
                              fontWeight: 600,
                              fontFamily: "'SF Mono', 'Menlo', monospace",
                              minWidth: 80,
                            }}>
                              {r.range}
                            </span>
                            <span style={{ color: hl ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.5 }}>{r.interpretation}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 예시 */}
                  <div style={{ marginBottom: 14 }}>
                    <Label>예시</Label>
                    <p style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      margin: '6px 0 0',
                      lineHeight: 1.6,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '8px 10px',
                    }}>
                      {metric.example}
                    </p>
                  </div>

                  {/* 주의사항 */}
                  {'pitfalls' in metric && Array.isArray(metric.pitfalls) && metric.pitfalls.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <Label>주의사항</Label>
                      <ul style={{ margin: '6px 0 0', paddingLeft: 16, display: 'grid', gap: 3 }}>
                        {(metric.pitfalls as string[]).map((p, i) => (
                          <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 업종 참고 */}
                  {'industryNote' in metric && typeof metric.industryNote === 'string' && (
                    <div style={{
                      fontSize: 12,
                      color: 'var(--text-tertiary)',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      lineHeight: 1.55,
                    }}>
                      <span style={{ fontWeight: 600 }}>업종 참고 · </span>
                      {metric.industryNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 지표 조합 */}
          <section>
            <SectionTitle>지표 조합으로 보기</SectionTitle>
            <div style={{ display: 'grid', gap: 12 }}>

              <ComboCard
                label={data.combinations.goodCompany.label}
                conditions={data.combinations.goodCompany.conditions}
                conclusion={data.combinations.goodCompany.conclusion}
              />
              <ComboCard
                label={data.combinations.cheapStock.label}
                conditions={data.combinations.cheapStock.conditions}
                conclusion={data.combinations.cheapStock.conclusion}
              />

              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '16px 18px',
              }}>
                <Label>주의 신호</Label>
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  {data.combinations.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize: 12 }}>
                      <span style={{
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 5,
                        padding: '2px 8px',
                        fontFamily: "'SF Mono', 'Menlo', monospace",
                        marginRight: 8,
                      }}>
                        {w.condition}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{w.interpretation}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

function ComboCard({ label, conditions, conclusion }: {
  label: string
  conditions: string[]
  conclusion: string
}): React.JSX.Element {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 18px',
    }}>
      <Label>{label}</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0 10px' }}>
        {conditions.map((c) => (
          <span
            key={c}
            style={{
              fontSize: 12,
              color: 'var(--text-primary)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 5,
              padding: '2px 8px',
              fontWeight: 500,
            }}
          >
            {c}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>{conclusion}</p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--text-tertiary)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 2 }}>
      {children}
    </div>
  )
}
