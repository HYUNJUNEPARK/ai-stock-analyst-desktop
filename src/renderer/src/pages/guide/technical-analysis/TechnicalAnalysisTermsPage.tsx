import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiChevronDown } from 'react-icons/fi'
import NavBar from '../../../components/NavBar'
import data from '../../../data/technical-analysis-terms.json'
import imgRegularAlignment from '../../../assets/technical_bullish_moving_average_alignment.png'
import imgReverseAlignment from '../../../assets/technical_bearish_moving_average_alignment.png'
import imgConvergence from '../../../assets/technical_moving_average_convergence.png'
import imgGoldenCross from '../../../assets/technical_golden_cross_signal.png'
import imgDeadCross from '../../../assets/technical_death_cross_signal.png'

type Term = (typeof data.categories)[number]['terms'][number]

const termImages: Record<string, string> = {
  regularAlignment: imgRegularAlignment,
  reverseAlignment: imgReverseAlignment,
  maConvergence: imgConvergence,
  goldenCross: imgGoldenCross,
  deadCross: imgDeadCross
}

export default function TechnicalAnalysisTermsPage(): React.JSX.Element {
  const [searchParams] = useSearchParams()
  const isWindow = searchParams.get('mode') === 'window'
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggle(id: string): void {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <NavBar
        onBack={() => window.close()}
        backLabel={isWindow ? '닫기' : '뒤로'}
        title="기술적 분석 용어 사전"
      />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 48px' }}>
          {/* 설명 */}
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.6
              }}
            >
              {data.description}
            </p>
          </div>

          {/* 카테고리별 용어 */}
          {data.categories.map((category) =>
            category.id === 'trend' ? (
              <TrendSection
                key={category.id}
                category={category}
                expandedIds={expandedIds}
                onToggle={toggle}
              />
            ) : (
              <section key={category.id} style={{ marginBottom: 32 }}>
                <SectionTitle>{category.name}</SectionTitle>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-tertiary)',
                    margin: '0 0 12px',
                    lineHeight: 1.5
                  }}
                >
                  {category.description}
                </p>
                <div style={{ display: 'grid', gap: 12 }}>
                  {category.terms.map((term) => (
                    <TermCard
                      key={term.id}
                      term={term}
                      expanded={expandedIds.has(term.id)}
                      onToggle={() => toggle(term.id)}
                    />
                  ))}
                </div>
              </section>
            )
          )}

          {/* 보고서 읽는 순서 */}
          <section style={{ marginBottom: 32 }}>
            <SectionTitle>{data.readingGuide.title}</SectionTitle>
            <div style={{ display: 'grid', gap: 6 }}>
              {data.readingGuide.steps.map((step) => (
                <div
                  key={step.step}
                  style={{
                    display: 'flex',
                    gap: 12,
                    fontSize: 12,
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--accent)',
                      color: '#fff',
                      borderRadius: '50%',
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    {step.step}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {step.action}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {step.purpose}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 면책조항 */}
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-tertiary)',
              lineHeight: 1.6,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '12px 14px'
            }}
          >
            {data.readingGuide.disclaimer}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 용어 카드 ── */

function TermCard({
  term,
  expanded,
  onToggle
}: {
  term: Term
  expanded: boolean
  onToggle: () => void
}): React.JSX.Element {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        userSelect: 'text',
        WebkitUserSelect: 'text'
      }}
    >
      {/* 헤더 — 클릭으로 토글 */}
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onToggle()
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '16px 20px',
          cursor: 'pointer'
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {term.name}
            </span>
            {'alias' in term &&
              Array.isArray(term.alias) &&
              term.alias.map((a) => (
                <span
                  key={a}
                  style={{
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    fontFamily: "'SF Mono', 'Menlo', monospace"
                  }}
                >
                  {a}
                </span>
              ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
            {term.oneLiner}
          </div>
        </div>
        <FiChevronDown
          style={{
            flexShrink: 0,
            fontSize: 18,
            color: 'var(--text-tertiary)',
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </div>

      {/* 상세 내용 */}
      {expanded && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* 차트 이미지 */}
          {termImages[term.id] && (
            <div
              style={{
                marginBottom: 14,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: '#fff'
              }}
            >
              <img
                src={termImages[term.id]}
                alt={`${term.name} 차트 예시`}
                style={{ width: '50%', display: 'block', margin: '0 auto' }}
              />
            </div>
          )}

          {/* 설명 */}
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              margin: '0 0 14px',
              lineHeight: 1.6
            }}
          >
            {term.description}
          </p>

          {/* 비유 */}
          {'analogy' in term && typeof term.analogy === 'string' && (
            <InfoBox label="쉽게 비유하면" content={term.analogy} />
          )}

          {/* 예시 */}
          {'example' in term && typeof term.example === 'string' && (
            <InfoBox label="예시" content={term.example} />
          )}

          {/* 공식 */}
          {'formula' in term && typeof term.formula === 'string' && (
            <div style={{ marginBottom: 14 }}>
              <Label>공식</Label>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontFamily: "'SF Mono', 'Menlo', monospace",
                  marginTop: 6
                }}
              >
                {term.formula}
              </div>
            </div>
          )}

          {/* 기간별 설명 (이동평균선) */}
          {'periods' in term && Array.isArray(term.periods) && (
            <div style={{ marginBottom: 14 }}>
              <Label>기간별 의미</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.periods as { period: string; meaning: string }[]).map((p) => (
                  <div
                    key={p.period}
                    style={{
                      display: 'flex',
                      gap: 10,
                      fontSize: 12,
                      padding: '6px 10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 6
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        minWidth: 90
                      }}
                    >
                      {p.period}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {p.meaning}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 수치 범위 (RSI, 거래량 비율 등) */}
          {'ranges' in term && Array.isArray(term.ranges) && (
            <div style={{ marginBottom: 14 }}>
              <Label>수치 해석</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(
                  term.ranges as {
                    range: string
                    interpretation: string
                    label?: string
                    highlight?: boolean
                  }[]
                ).map((r, i) => {
                  const hl = r.highlight
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 10,
                        fontSize: 12,
                        padding: '6px 10px',
                        background: hl
                          ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
                          : 'var(--bg-primary)',
                        border: hl
                          ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)'
                          : '1px solid var(--border)',
                        borderRadius: 6
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          color: hl ? 'var(--accent)' : 'var(--text-primary)',
                          fontWeight: 600,
                          fontFamily: "'SF Mono', 'Menlo', monospace",
                          minWidth: 80
                        }}
                      >
                        {r.range}
                      </span>
                      {r.label && (
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {r.label}
                        </span>
                      )}
                      <span
                        style={{
                          color: hl ? 'var(--text-primary)' : 'var(--text-secondary)',
                          lineHeight: 1.5
                        }}
                      >
                        {r.interpretation}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 구성 요소 (MACD, 볼린저밴드) */}
          {'components' in term && Array.isArray(term.components) && (
            <div style={{ marginBottom: 14 }}>
              <Label>구성 요소</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.components as { name: string; description: string }[]).map((c) => (
                  <div
                    key={c.name}
                    style={{
                      display: 'flex',
                      gap: 10,
                      fontSize: 12,
                      padding: '6px 10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 6
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        minWidth: 80
                      }}
                    >
                      {c.name}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {c.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 신호 해석 (MACD, 볼린저밴드, 거래량) */}
          {'signals' in term && Array.isArray(term.signals) && (
            <div style={{ marginBottom: 14 }}>
              <Label>신호 해석</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.signals as { signal: string; meaning: string; name?: string }[]).map(
                  (s, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 12,
                        padding: '8px 10px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        lineHeight: 1.5
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {s.signal}
                        {s.name && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 11,
                              color: 'var(--accent)',
                              fontWeight: 500
                            }}
                          >
                            {s.name}
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>{s.meaning}</div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* 판정 값 (추세, 변동성) */}
          {'verdicts' in term && Array.isArray(term.verdicts) && (
            <div style={{ marginBottom: 14 }}>
              <Label>판정 기준</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.verdicts as { value: string; meaning: string }[]).map((v) => (
                  <div
                    key={v.value}
                    style={{
                      display: 'flex',
                      gap: 10,
                      fontSize: 12,
                      padding: '6px 10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 6
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        fontWeight: 600,
                        color: 'var(--accent)',
                        minWidth: 50
                      }}
                    >
                      {v.value}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {v.meaning}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 다이버전스 유형 */}
          {'types' in term && Array.isArray(term.types) && (
            <div style={{ marginBottom: 14 }}>
              <Label>유형</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.types as { type: string; condition: string; meaning: string }[]).map((t) => (
                  <div
                    key={t.type}
                    style={{
                      fontSize: 12,
                      padding: '8px 10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      lineHeight: 1.5
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {t.type}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>
                      {t.condition}
                    </div>
                    <div style={{ color: 'var(--accent)', fontSize: 11 }}>{t.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 차트 패턴 목록 */}
          {'commonPatterns' in term && Array.isArray(term.commonPatterns) && (
            <div style={{ marginBottom: 14 }}>
              <Label>대표적인 차트 패턴</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.commonPatterns as { name: string; alias: string; description: string }[]).map(
                  (p) => (
                    <div
                      key={p.name}
                      style={{
                        fontSize: 12,
                        padding: '8px 10px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        lineHeight: 1.5
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 6,
                          marginBottom: 2
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {p.name}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          {p.alias}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>{p.description}</div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* 지지/저항 보고서 읽기 */}
          {'reportReadings' in term && Array.isArray(term.reportReadings) && (
            <div style={{ marginBottom: 14 }}>
              <Label>보고서에서 이렇게 나옵니다</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.reportReadings as { label: string; meaning: string }[]).map((r) => (
                  <div
                    key={r.label}
                    style={{
                      display: 'flex',
                      gap: 10,
                      fontSize: 12,
                      padding: '6px 10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 6
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        minWidth: 80
                      }}
                    >
                      {r.label}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {r.meaning}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 기술적 신호 유형 */}
          {'signalTypes' in term && Array.isArray(term.signalTypes) && (
            <div style={{ marginBottom: 14 }}>
              <Label>신호 유형</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(
                  term.signalTypes as {
                    name: string
                    possibleValues: string[]
                    description: string
                  }[]
                ).map((s) => (
                  <div
                    key={s.name}
                    style={{
                      fontSize: 12,
                      padding: '8px 10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      lineHeight: 1.5
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.name}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {s.possibleValues.map((v) => (
                          <span
                            key={v}
                            style={{
                              fontSize: 10,
                              color: 'var(--accent)',
                              background:
                                'color-mix(in srgb, var(--accent) 10%, transparent)',
                              border:
                                '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                              borderRadius: 4,
                              padding: '1px 6px',
                              fontWeight: 500
                            }}
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>{s.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 보고서 읽기 팁 */}
          {'reportReading' in term && typeof term.reportReading === 'string' && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                borderRadius: 6,
                padding: '8px 10px',
                lineHeight: 1.55
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>보고서 읽기 팁 · </span>
              {term.reportReading}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── 공통 컴포넌트 ── */

function InfoBox({ label, content }: { label: string; content: string }): React.JSX.Element {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          margin: '6px 0 0',
          lineHeight: 1.6,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '8px 10px'
        }}
      >
        {content}
      </p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 10
      }}
    >
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

/* ── 추세 분석 전용 섹션 ── */

type Category = (typeof data.categories)[number]

function TrendSection({
  category,
  expandedIds,
  onToggle
}: {
  category: Category
  expandedIds: Set<string>
  onToggle: (id: string) => void
}): React.JSX.Element {
  const termById = (id: string): Term | undefined => category.terms.find((t) => t.id === id)

  const movingAverage = termById('movingAverage')!
  const regular = termById('regularAlignment')!
  const reverse = termById('reverseAlignment')!
  const convergence = termById('maConvergence')!
  const golden = termById('goldenCross')!
  const dead = termById('deadCross')!

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionTitle>{category.name}</SectionTitle>
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-tertiary)',
          margin: '0 0 16px',
          lineHeight: 1.5
        }}
      >
        {category.description}
      </p>

      {/* 1. 이동평균선 — 기초 개념 */}
      <TermCard
        term={movingAverage}
        expanded={expandedIds.has(movingAverage.id)}
        onToggle={() => onToggle(movingAverage.id)}
      />

      {/* 2. 정배열 vs 역배열 */}
      <SubGroupLabel>이동평균선의 배열</SubGroupLabel>
      <ComparisonPair
        left={{ term: regular, color: '#34c759', label: '상승 추세' }}
        right={{ term: reverse, color: '#ff3b30', label: '하락 추세' }}
        expandedIds={expandedIds}
        onToggle={onToggle}
      />

      {/* 3. 수렴 */}
      <SubGroupLabel>이동평균선의 수렴</SubGroupLabel>
      <VisualCard
        term={convergence}
        color='#ff9500'
        label='방향 전환 대기'
        expanded={expandedIds.has(convergence.id)}
        onToggle={() => onToggle(convergence.id)}
      />

      {/* 4. 골든크로스 vs 데드크로스 */}
      <SubGroupLabel>이동평균선의 교차 신호</SubGroupLabel>
      <ComparisonPair
        left={{ term: golden, color: '#34c759', label: '매수 신호' }}
        right={{ term: dead, color: '#ff3b30', label: '매도 신호' }}
        expandedIds={expandedIds}
        onToggle={onToggle}
      />
    </section>
  )
}

function SubGroupLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-tertiary)',
        marginTop: 20,
        marginBottom: 8,
        paddingLeft: 2
      }}
    >
      {children}
    </div>
  )
}

/* ── 비교 쌍 카드 (정배열/역배열, 골든/데드) ── */

function ComparisonPair({
  left,
  right,
  expandedIds,
  onToggle
}: {
  left: { term: Term; color: string; label: string }
  right: { term: Term; color: string; label: string }
  expandedIds: Set<string>
  onToggle: (id: string) => void
}): React.JSX.Element {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {[left, right].map(({ term, color, label }) => {
        const expanded = expandedIds.has(term.id)
        const img = termImages[term.id]
        return (
          <div
            key={term.id}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* 이미지 */}
            {img && (
              <div style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
                <img
                  src={img}
                  alt={`${term.name} 차트`}
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            )}

            {/* 라벨 뱃지 + 이름 */}
            <div style={{ padding: '12px 14px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#fff',
                    background: color,
                    borderRadius: 4,
                    padding: '2px 7px',
                    lineHeight: '16px'
                  }}
                >
                  {label}
                </span>
                {'alias' in term &&
                  Array.isArray(term.alias) &&
                  term.alias.slice(0, 1).map((a) => (
                    <span
                      key={a}
                      style={{
                        fontSize: 10,
                        color: 'var(--text-tertiary)',
                        fontFamily: "'SF Mono', 'Menlo', monospace"
                      }}
                    >
                      {a}
                    </span>
                  ))}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 4
                }}
              >
                {term.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  marginBottom: 10
                }}
              >
                {term.oneLiner}
              </div>
            </div>

            {/* 핵심 한 줄 (simpleRule.meaning) */}
            {'simpleRule' in term &&
              term.simpleRule &&
              typeof term.simpleRule === 'object' &&
              'meaning' in term.simpleRule && (
                <div
                  style={{
                    margin: '0 14px',
                    padding: '8px 10px',
                    fontSize: 11,
                    lineHeight: 1.55,
                    color,
                    fontWeight: 600,
                    background: `color-mix(in srgb, ${color} 8%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                    borderRadius: 6
                  }}
                >
                  {(term.simpleRule as { meaning: string }).meaning}
                </div>
              )}

            {/* 더보기 토글 */}
            <div
              onClick={() => onToggle(term.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onToggle(term.id)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '10px 14px',
                marginTop: 'auto',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--text-tertiary)',
                borderTop: '1px solid var(--border)'
              }}
            >
              {expanded ? '접기' : '자세히 보기'}
              <FiChevronDown
                style={{
                  fontSize: 13,
                  transition: 'transform 0.2s',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </div>

            {/* 상세 내용 */}
            {expanded && (
              <div
                style={{
                  padding: '0 14px 14px',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    margin: '12px 0 10px',
                    lineHeight: 1.6
                  }}
                >
                  {term.description}
                </p>

                {'analogy' in term && typeof term.analogy === 'string' && (
                  <InfoBox label="쉽게 비유하면" content={term.analogy} />
                )}

                {'example' in term && typeof term.example === 'string' && (
                  <InfoBox label="예시" content={term.example} />
                )}

                {'simpleRule' in term &&
                  term.simpleRule &&
                  typeof term.simpleRule === 'object' &&
                  'caution' in term.simpleRule && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-tertiary)',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '8px 10px',
                        lineHeight: 1.55,
                        marginBottom: 10
                      }}
                    >
                      {(term.simpleRule as { caution: string }).caution}
                    </div>
                  )}

                {'reportReading' in term && typeof term.reportReading === 'string' && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      lineHeight: 1.55
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                      보고서 읽기 팁 ·{' '}
                    </span>
                    {term.reportReading}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── 수렴 비주얼 카드 ── */

function VisualCard({
  term,
  color,
  label,
  expanded,
  onToggle
}: {
  term: Term
  color: string
  label: string
  expanded: boolean
  onToggle: () => void
}): React.JSX.Element {
  const img = termImages[term.id]
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        userSelect: 'text',
        WebkitUserSelect: 'text'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* 왼쪽: 이미지 */}
        {img && (
          <div
            style={{
              width: '40%',
              flexShrink: 0,
              background: '#fff',
              borderRight: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <img
              src={img}
              alt={`${term.name} 차트`}
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        )}

        {/* 오른쪽: 텍스트 */}
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#fff',
                background: color,
                borderRadius: 4,
                padding: '2px 7px',
                lineHeight: '16px'
              }}
            >
              {label}
            </span>
            {'alias' in term &&
              Array.isArray(term.alias) &&
              term.alias.slice(0, 1).map((a) => (
                <span
                  key={a}
                  style={{
                    fontSize: 10,
                    color: 'var(--text-tertiary)',
                    fontFamily: "'SF Mono', 'Menlo', monospace"
                  }}
                >
                  {a}
                </span>
              ))}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 6
            }}
          >
            {term.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              marginBottom: 10
            }}
          >
            {term.oneLiner}
          </div>

          {'simpleRule' in term &&
            term.simpleRule &&
            typeof term.simpleRule === 'object' &&
            'meaning' in term.simpleRule && (
              <div
                style={{
                  padding: '7px 10px',
                  fontSize: 11,
                  lineHeight: 1.55,
                  color,
                  fontWeight: 600,
                  background: `color-mix(in srgb, ${color} 8%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                  borderRadius: 6
                }}
              >
                {(term.simpleRule as { meaning: string }).meaning}
              </div>
            )}
        </div>
      </div>

      {/* 더보기 토글 */}
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onToggle()
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          padding: '10px 14px',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--text-tertiary)',
          borderTop: '1px solid var(--border)'
        }}
      >
        {expanded ? '접기' : '자세히 보기'}
        <FiChevronDown
          style={{
            fontSize: 13,
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: '12px 0 10px',
              lineHeight: 1.6
            }}
          >
            {term.description}
          </p>

          {'analogy' in term && typeof term.analogy === 'string' && (
            <InfoBox label="쉽게 비유하면" content={term.analogy} />
          )}

          {'example' in term && typeof term.example === 'string' && (
            <InfoBox label="예시" content={term.example} />
          )}

          {'simpleRule' in term &&
            term.simpleRule &&
            typeof term.simpleRule === 'object' &&
            'caution' in term.simpleRule && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  lineHeight: 1.55,
                  marginBottom: 10
                }}
              >
                {(term.simpleRule as { caution: string }).caution}
              </div>
            )}

          {'reportReading' in term && typeof term.reportReading === 'string' && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                borderRadius: 6,
                padding: '8px 10px',
                lineHeight: 1.55
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>보고서 읽기 팁 · </span>
              {term.reportReading}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
