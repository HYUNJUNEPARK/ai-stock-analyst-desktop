/**
 * 추세 분석 전용 컴포넌트
 * TrendSection, ComparisonPair, VisualCard, ComparisonDetail
 */
import { InfoBox } from './InfoBox'
import { TermCard } from './TermCard'
import type { Term, Category } from './types'
import { termImages } from './types'

export function TrendSection({
  category
}: {
  category: Category
}): React.JSX.Element {
  const termById = (id: string): Term | undefined => category.terms.find((t) => t.id === id)

  const movingAverage = termById('movingAverage')!
  const regular = termById('regularAlignment')!
  const reverse = termById('reverseAlignment')!
  const convergence = termById('maConvergence')!
  const golden = termById('goldenCross')!
  const dead = termById('deadCross')!

  return (
    <>
      <TermCard term={movingAverage} expanded onToggle={() => {}} hideArrow />

      <SubGroupLabel>이동평균선의 배열</SubGroupLabel>
      <ComparisonPair
        left={{ term: regular, color: '#34c759', label: '상승 추세' }}
        right={{ term: reverse, color: '#ff3b30', label: '하락 추세' }}
      />

      <SubGroupLabel>이동평균선의 수렴</SubGroupLabel>
      <VisualCard term={convergence} color="#ff9500" label="방향 전환 대기" />

      <SubGroupLabel>이동평균선의 교차 신호</SubGroupLabel>
      <ComparisonPair
        left={{ term: golden, color: '#34c759', label: '매수 신호' }}
        right={{ term: dead, color: '#ff3b30', label: '매도 신호' }}
      />
    </>
  )
}

function SubGroupLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', marginTop: 20, marginBottom: 8, paddingLeft: 2 }}>
      {children}
    </div>
  )
}

function ComparisonPair({
  left,
  right
}: {
  left: { term: Term; color: string; label: string }
  right: { term: Term; color: string; label: string }
}): React.JSX.Element {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {[left, right].map(({ term, color, label }) => {
        const img = termImages[term.id]
        return (
          <div key={term.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', userSelect: 'text', WebkitUserSelect: 'text', display: 'flex', flexDirection: 'column' }}>
            {img && (
              <div style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
                <img src={img} alt={`${term.name} 차트`} style={{ width: '100%', display: 'block' }} />
              </div>
            )}
            <div style={{ padding: '12px 14px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: color, borderRadius: 4, padding: '2px 7px', lineHeight: '16px' }}>{label}</span>
                {'alias' in term && Array.isArray(term.alias) && term.alias.slice(0, 1).map((a) => (
                  <span key={a} style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: "'SF Mono', 'Menlo', monospace" }}>{a}</span>
                ))}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{term.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 10 }}>{term.oneLiner}</div>
            </div>
            {'simpleRule' in term && term.simpleRule && typeof term.simpleRule === 'object' && 'meaning' in term.simpleRule && (
              <div style={{ margin: '0 14px 12px', padding: '8px 10px', fontSize: 11, lineHeight: 1.55, color, fontWeight: 600, background: `color-mix(in srgb, ${color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`, borderRadius: 6 }}>
                {(term.simpleRule as { meaning: string }).meaning}
              </div>
            )}
            <ComparisonDetail term={term} />
          </div>
        )
      })}
    </div>
  )
}

function ComparisonDetail({ term }: { term: Term }): React.JSX.Element {
  return (
    <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '12px 0 10px', lineHeight: 1.6 }}>{term.description}</p>
      {'analogy' in term && typeof term.analogy === 'string' && <InfoBox label="쉽게 비유하면" content={term.analogy} />}
      {'example' in term && typeof term.example === 'string' && <InfoBox label="예시" content={term.example} />}
      {'simpleRule' in term && term.simpleRule && typeof term.simpleRule === 'object' && 'caution' in term.simpleRule && (
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', lineHeight: 1.55, marginBottom: 10 }}>
          {(term.simpleRule as { caution: string }).caution}
        </div>
      )}
      {'reportReading' in term && typeof term.reportReading === 'string' && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'color-mix(in srgb, var(--accent) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', borderRadius: 6, padding: '8px 10px', lineHeight: 1.55 }}>
          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>보고서 읽기 팁 · </span>
          {term.reportReading}
        </div>
      )}
    </div>
  )
}

function VisualCard({ term, color, label }: { term: Term; color: string; label: string }): React.JSX.Element {
  const img = termImages[term.id]
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', userSelect: 'text', WebkitUserSelect: 'text' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {img && (
          <div style={{ width: '40%', flexShrink: 0, background: '#fff', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
            <img src={img} alt={`${term.name} 차트`} style={{ width: '100%', display: 'block' }} />
          </div>
        )}
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: color, borderRadius: 4, padding: '2px 7px', lineHeight: '16px' }}>{label}</span>
            {'alias' in term && Array.isArray(term.alias) && term.alias.slice(0, 1).map((a) => (
              <span key={a} style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: "'SF Mono', 'Menlo', monospace" }}>{a}</span>
            ))}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{term.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 10 }}>{term.oneLiner}</div>
          {'simpleRule' in term && term.simpleRule && typeof term.simpleRule === 'object' && 'meaning' in term.simpleRule && (
            <div style={{ padding: '7px 10px', fontSize: 11, lineHeight: 1.55, color, fontWeight: 600, background: `color-mix(in srgb, ${color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`, borderRadius: 6 }}>
              {(term.simpleRule as { meaning: string }).meaning}
            </div>
          )}
        </div>
      </div>
      <ComparisonDetail term={term} />
    </div>
  )
}
