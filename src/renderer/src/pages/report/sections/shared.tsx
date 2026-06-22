/**
 * 리포트 섹션 공용 컴포넌트 및 유틸리티
 * BulletList, CardHeader, TableCard, MetricCard, tryParseJson, 감성 스타일 매핑
 */
import LinkText from '../components/LinkText'

/* ── 감성/전망 스타일 매핑 ── */

export type SentimentStyle = { emoji: string; color: string; bg: string; border: string }

const POSITIVE: SentimentStyle = { emoji: '🟢', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
const NEGATIVE: SentimentStyle = { emoji: '🔴', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
const NEUTRAL: SentimentStyle = { emoji: '🟠', color: '#d97706', bg: '#fffbeb', border: '#fde68a' }

export function getSentimentStyle(text: string): SentimentStyle {
  if (text.includes('긍정') || text.includes('저평가')) return POSITIVE
  if (text.includes('부정') || text.includes('고평가')) return NEGATIVE
  return NEUTRAL
}

/* ── JSON 파싱 유틸 ── */

export function tryParseJson<T>(text: string, validate: (parsed: unknown) => parsed is T): T | null {
  if (!text.trim()) return null
  const stripped = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  try {
    const parsed = JSON.parse(stripped)
    return validate(parsed) ? parsed : null
  } catch {
    return null
  }
}

/* ── BulletList ── */

export function BulletList({
  items,
  color,
}: {
  items: string[]
  color: string
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
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
              background: color,
              display: 'inline-block',
            }}
          />
          <LinkText>{item}</LinkText>
        </div>
      ))}
    </div>
  )
}

/* ── CardHeader (카드 제목 헤더) ── */

export function CardHeader({
  title,
  icon,
  badge,
}: {
  title: string
  icon?: React.ReactNode
  badge?: string
}): React.JSX.Element {
  return (
    <div
      style={{
        padding: '10px 14px',
        background: '#fff',
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
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', background: '#fff', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>
          {badge}
        </span>
      )}
    </div>
  )
}

/* ── TableCard (테이블 카드) ── */

export function TableCard({
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
  interpretation?: string
}): React.JSX.Element {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <CardHeader title={title} icon={icon} badge={badge} />
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
                  background: '#fff',
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
                    background: '#fff',
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
            background: '#fff',
          }}
        >
          <LinkText>{interpretation}</LinkText>
        </div>
      )}
    </div>
  )
}

/* ── MetricCard (지표 카드) ── */

export function MetricCard({
  title,
  value,
  sub,
  interpretation,
}: {
  title: string
  value: string
  sub?: string
  interpretation?: string
}): React.JSX.Element {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
        {title}
      </div>
      <div style={{ padding: '14px', background: '#fff' }}>
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
            background: '#fff',
          }}
        >
          <LinkText>{interpretation}</LinkText>
        </div>
      )}
    </div>
  )
}

/* ── RiskSection (리스크 카드) ── */

export function RiskSection({
  title,
  risks,
  icon,
}: {
  title: string
  risks: string[]
  icon: React.ReactNode
}): React.JSX.Element | null {
  if (!risks?.length) return null
  return (
    <div style={{ border: '1px solid #fecaca', borderRadius: 12, overflow: 'hidden' }}>
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
        {icon}
        {title}
      </div>
      <div style={{ padding: '12px 14px', background: '#fff' }}>
        <BulletList items={risks} color="#ef4444" />
      </div>
    </div>
  )
}

/* ── BulletCard (제목 + 불릿 리스트 카드) ── */

export function BulletCard({
  title,
  items,
  color,
}: {
  title: string
  items: string[]
  color: string
}): React.JSX.Element | null {
  if (!items?.length) return null
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid var(--border)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
        {title}
      </div>
      <div style={{ padding: '12px 14px', background: '#fff' }}>
        <BulletList items={items} color={color} />
      </div>
    </div>
  )
}
