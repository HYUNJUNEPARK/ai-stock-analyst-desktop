import { FiUsers } from 'react-icons/fi'

export type SectorData = {
  company: string
  ticker: string
  asOfDate: string
  sectorOverview: string
  globalTrends: string[]
  competitors: { name: string; recentPerformance: string; comment: string }[]
  policyChanges: string[]
  outlook: { verdict: string; rationale: string }
}

export function tryParseSectorJson(text: string): SectorData | null {
  if (!text.trim()) return null
  try {
    const parsed = JSON.parse(text.trim())
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
          <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>업종 개요</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.65 }}>{data.sectorOverview}</div>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, padding: '0 4px' }}>
            {data.outlook.rationale}
          </div>
        </div>
      </div>

      {/* 글로벌 시장 흐름 */}
      <BulletCard title="글로벌 시장 흐름" items={data.globalTrends} color="#2563eb" />

      {/* 경쟁사 실적 */}
      {data.competitors?.length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            <FiUsers size={15} />
            주요 경쟁사
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['기업명', '최근 실적', '코멘트'].map((h) => (
                  <th key={h} style={{ padding: '8px 14px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.competitors.map((c, i) => (
                <tr key={i}>
                  <td style={{ padding: '7px 14px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', borderBottom: i < data.competitors.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-primary)' }}>{c.name}</td>
                  <td style={{ padding: '7px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', borderBottom: i < data.competitors.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-primary)' }}>{c.recentPerformance}</td>
                  <td style={{ padding: '7px 14px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', borderBottom: i < data.competitors.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-primary)' }}>{c.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
        {title}
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-primary)' }}>
        {items.map((item, i) => (
          <div key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 14, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, top: '0.45em', width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
