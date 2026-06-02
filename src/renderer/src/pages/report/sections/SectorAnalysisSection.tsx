/**
 * 업종 리서치 에이전트 결과 뷰
 * 업종 전망, 글로벌 트렌드, 경쟁사 비교, 정책/규제 변화를 표시한다.
 */
import { FiUsers } from 'react-icons/fi'
import LinkText from '../components/LinkText'

export type SectorData = {
  company: string
  ticker: string
  asOfDate: string
  sectorOverview: string
  globalTrends: string[]
  competitors: { name: string; url?: string; marketCap?: string; revenue?: string; operatingMargin?: string; per?: string; recentPerformance: string; comment: string }[]
  policyChanges: string[]
  outlook: { verdict: string; rationale: string }
}

export function tryParseSectorJson(text: string): SectorData | null {
  if (!text.trim()) return null
  // 마크다운 코드 블록(```json ... ```)으로 감싸진 경우 제거
  const stripped = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  try {
    const parsed = JSON.parse(stripped)
    if (parsed && parsed.outlook && parsed.competitors) return parsed as SectorData
    return null
  } catch {
    return null
  }
}

function getOutlookStyle(verdict: string): { emoji: string; color: string; bg: string; border: string } {
  if (verdict.includes('긍정')) return { emoji: '🟢', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
  if (verdict.includes('부정')) return { emoji: '🔴', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
  return { emoji: '🟠', color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
}

export default function SectorAnalysisSection({ data }: { data: SectorData }): React.JSX.Element {
  const style = getOutlookStyle(data.outlook.verdict)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 전망 배지 + 업종 개요 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        <div
          style={{
            flex: '0 0 auto',
            padding: '16px 24px',
            background: style.bg,
            border: `1px solid ${style.border}`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>업종 전망</div>
          <div style={{ fontSize: 'var(--text-2xl)' }}>{style.emoji}</div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: style.color }}>{data.outlook.verdict}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>업종 개요</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.65 }}><LinkText>{data.sectorOverview}</LinkText></div>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, padding: '0 4px' }}>
            <LinkText>{data.outlook.rationale}</LinkText>
          </div>
        </div>
      </div>

      {/* 글로벌 시장 흐름 */}
      <BulletCard title="글로벌 시장 흐름" items={data.globalTrends} color="#2563eb" />

      {/* 경쟁사 실적 */}
      {data.competitors?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', padding: '0 2px' }}>
            <FiUsers size={15} />
            주요 경쟁사
          </div>
          {data.competitors.map((c, i) => {
            const metrics = [
              { label: '시가총액', value: c.marketCap },
              { label: '매출', value: c.revenue },
              { label: '영업이익률', value: c.operatingMargin },
              { label: 'PER', value: c.per },
            ].filter((m) => m.value)
            return (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                {/* 기업명 헤더 */}
                <div style={{ padding: '10px 14px', borderBottom: metrics.length > 0 ? '1px solid var(--border)' : 'none', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {c.url ? (
                    <a href="#" onClick={(e) => { e.preventDefault(); window.api.openExternalUrl(c.url!) }} style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>{c.name}</a>
                  ) : c.name}
                </div>
                {/* 지표 그리드 */}
                {metrics.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${metrics.length}, 1fr)`, borderBottom: '1px solid var(--border)' }}>
                    {metrics.map((m, j) => (
                      <div
                        key={m.label}
                        style={{
                          padding: '10px 14px',
                          borderRight: j < metrics.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 3 }}>{m.label}</div>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {/* 최근 실적 + 코멘트 */}
                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    <LinkText>{c.recentPerformance}</LinkText>
                  </div>
                  {c.comment && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                      <LinkText>{c.comment}</LinkText>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 정책 및 규제 변화 */}
      <BulletCard title="정책 및 규제 변화" items={data.policyChanges} color="#d97706" />
    </div>
  )
}

function BulletCard({ title, items, color }: { title: string; items: string[]; color: string }): React.JSX.Element | null {
  if (!items?.length) return null
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
        {title}
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, background: '#fff' }}>
        {items.map((item, i) => (
          <div key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 14, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, top: '0.45em', width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <LinkText>{item}</LinkText>
          </div>
        ))}
      </div>
    </div>
  )
}
