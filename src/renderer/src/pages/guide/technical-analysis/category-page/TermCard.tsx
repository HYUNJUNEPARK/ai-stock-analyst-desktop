/**
 * 용어 카드 컴포넌트
 * 기술적 분석 용어를 확장/축소 가능한 카드로 표시한다.
 */
import { FiChevronDown } from 'react-icons/fi'
import { Label } from '../components/Label'
import { InfoBox } from './InfoBox'
import type { Term } from './types'
import { termImages } from './types'

export function TermCard({
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

      {expanded && (
        <div style={{ padding: '0 20px 20px' }}>
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

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>
            {term.description}
          </p>

          {'analogy' in term && typeof term.analogy === 'string' && (
            <InfoBox label="쉽게 비유하면" content={term.analogy} />
          )}
          {'example' in term && typeof term.example === 'string' && (
            <InfoBox label="예시" content={term.example} />
          )}

          {'formula' in term && typeof term.formula === 'string' && (
            <div style={{ marginBottom: 14 }}>
              <Label>공식</Label>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontFamily: "'SF Mono', 'Menlo', monospace", marginTop: 6 }}>
                {term.formula}
              </div>
            </div>
          )}

          {'periods' in term && Array.isArray(term.periods) && (
            <div style={{ marginBottom: 14 }}>
              <Label>기간별 의미</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.periods as { period: string; meaning: string }[]).map((p) => (
                  <div key={p.period} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6 }}>
                    <span style={{ flexShrink: 0, fontWeight: 600, color: 'var(--text-primary)', minWidth: 90 }}>{p.period}</span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {'ranges' in term && Array.isArray(term.ranges) && (
            <div style={{ marginBottom: 14 }}>
              <Label>수치 해석</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.ranges as { range: string; interpretation: string; label?: string; highlight?: boolean }[]).map((r, i) => {
                  const hl = r.highlight
                  return (
                    <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '6px 10px', background: hl ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-primary)', border: hl ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' : '1px solid var(--border)', borderRadius: 6 }}>
                      <span style={{ flexShrink: 0, color: hl ? 'var(--accent)' : 'var(--text-primary)', fontWeight: 600, fontFamily: "'SF Mono', 'Menlo', monospace", minWidth: 80 }}>{r.range}</span>
                      {r.label && <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.label}</span>}
                      <span style={{ color: hl ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.5 }}>{r.interpretation}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {'components' in term && Array.isArray(term.components) && (
            <div style={{ marginBottom: 14 }}>
              <Label>구성 요소</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.components as { name: string; description: string }[]).map((c) => (
                  <div key={c.name} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6 }}>
                    <span style={{ flexShrink: 0, fontWeight: 600, color: 'var(--text-primary)', minWidth: 80 }}>{c.name}</span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {'signals' in term && Array.isArray(term.signals) && (
            <div style={{ marginBottom: 14 }}>
              <Label>신호 해석</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.signals as { signal: string; meaning: string; name?: string }[]).map((s, i) => (
                  <div key={i} style={{ fontSize: 12, padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {s.signal}
                      {s.name && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>{s.name}</span>}
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>{s.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {'verdicts' in term && Array.isArray(term.verdicts) && (
            <div style={{ marginBottom: 14 }}>
              <Label>판정 기준</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.verdicts as { value: string; meaning: string }[]).map((v) => (
                  <div key={v.value} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6 }}>
                    <span style={{ flexShrink: 0, fontWeight: 600, color: 'var(--accent)', minWidth: 50 }}>{v.value}</span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{v.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {'types' in term && Array.isArray(term.types) && (
            <div style={{ marginBottom: 14 }}>
              <Label>유형</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.types as { type: string; condition: string; meaning: string }[]).map((t) => (
                  <div key={t.type} style={{ fontSize: 12, padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{t.type}</div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>{t.condition}</div>
                    <div style={{ color: 'var(--accent)', fontSize: 11 }}>{t.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {'commonPatterns' in term && Array.isArray(term.commonPatterns) && (
            <div style={{ marginBottom: 14 }}>
              <Label>대표적인 차트 패턴</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.commonPatterns as { name: string; alias: string; description: string }[]).map((p) => (
                  <div key={p.name} style={{ fontSize: 12, padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.alias}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>{p.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {'reportReadings' in term && Array.isArray(term.reportReadings) && (
            <div style={{ marginBottom: 14 }}>
              <Label>보고서에서 이렇게 나옵니다</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.reportReadings as { label: string; meaning: string }[]).map((r) => (
                  <div key={r.label} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6 }}>
                    <span style={{ flexShrink: 0, fontWeight: 600, color: 'var(--text-primary)', minWidth: 80 }}>{r.label}</span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {'signalTypes' in term && Array.isArray(term.signalTypes) && (
            <div style={{ marginBottom: 14 }}>
              <Label>신호 유형</Label>
              <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                {(term.signalTypes as { name: string; possibleValues: string[]; description: string }[]).map((s) => (
                  <div key={s.name} style={{ fontSize: 12, padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {s.possibleValues.map((v) => (
                          <span key={v} style={{ fontSize: 10, color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', borderRadius: 4, padding: '1px 6px', fontWeight: 500 }}>{v}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>{s.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {'reportReading' in term && typeof term.reportReading === 'string' && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'color-mix(in srgb, var(--accent) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', borderRadius: 6, padding: '8px 10px', lineHeight: 1.55 }}>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>보고서 읽기 팁 · </span>
              {term.reportReading}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
