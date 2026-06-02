/**
 * 뉴스 감성 분석 에이전트 결과 뷰
 * 수집된 뉴스 기사의 호재/악재 태그, 센티먼트 요약, 종합 판정을 표시한다.
 */
import { IoNewspaperOutline } from 'react-icons/io5'
import LinkText from '../components/LinkText'

export type NewsData = {
  company: string
  ticker: string
  asOfDate: string
  analysisPeriod: { start: string; end: string }
  articles: {
    title: string
    url?: string
    date: string
    summary: string
    tag: string
    rationale: string
  }[]
  sentimentSummary: {
    bullish: number | string
    bearish: number | string
    unconfirmed: number | string
    total: number | string
  }
  verdict: {
    sentiment: string
    rationale: string
  }
}

export function tryParseNewsJson(text: string): NewsData | null {
  if (!text.trim()) return null
  try {
    const parsed = JSON.parse(text.trim())
    if (parsed && parsed.articles && parsed.verdict) return parsed as NewsData
    return null
  } catch {
    return null
  }
}

const TAG_STYLES: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  '호재': { emoji: '🟢', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  '악재': { emoji: '🔴', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  '미확인': { emoji: '⚠️', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
}

function getTagStyle(tag: string): { emoji: string; color: string; bg: string; border: string } {
  for (const [key, style] of Object.entries(TAG_STYLES)) {
    if (tag.includes(key)) return style
  }
  return TAG_STYLES['미확인']
}

function getSentimentStyle(sentiment: string): { emoji: string; color: string; bg: string; border: string } {
  if (sentiment.includes('긍정')) return { emoji: '🟢', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
  if (sentiment.includes('부정')) return { emoji: '🔴', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
  return { emoji: '🟠', color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
}

export default function NewsAnalysisSection({ data }: { data: NewsData }): React.JSX.Element {
  const sentimentStyle = getSentimentStyle(data.verdict.sentiment)
  const bullish = Number(data.sentimentSummary.bullish) || 0
  const bearish = Number(data.sentimentSummary.bearish) || 0
  const unconfirmed = Number(data.sentimentSummary.unconfirmed) || 0
  const total = Number(data.sentimentSummary.total) || (bullish + bearish + unconfirmed)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 판정 + 분석 기간 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        {/* 판정 배지 */}
        <div
          style={{
            flex: '0 0 auto',
            padding: '16px 24px',
            background: sentimentStyle.bg,
            border: `1px solid ${sentimentStyle.border}`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>시장 심리</div>
          <div style={{ fontSize: 'var(--text-2xl)' }}>{sentimentStyle.emoji}</div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: sentimentStyle.color }}>{data.verdict.sentiment}</div>
        </div>

        {/* 요약 + 기간 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              padding: '12px 16px',
              background: '#fff',
              borderRadius: 10,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>분석 기간</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {data.analysisPeriod.start} ~ {data.analysisPeriod.end}
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65, padding: '0 4px' }}>
            <LinkText>{data.verdict.rationale}</LinkText>
          </div>
        </div>
      </div>

      {/* 감성 분석 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        <SentimentCountCard label="호재" emoji="🟢" count={bullish} color="#16a34a" />
        <SentimentCountCard label="악재" emoji="🔴" count={bearish} color="#dc2626" />
        <SentimentCountCard label="미확인" emoji="⚠️" count={unconfirmed} color="#d97706" />
        <SentimentCountCard label="총계" emoji="" count={total} color="var(--text-primary)" />
      </div>

      {/* 뉴스 목록 */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div
          style={{
            padding: '10px 14px',
            background: '#fff',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          <IoNewspaperOutline size={15} />
          뉴스 목록 ({total}건)
        </div>
        {data.articles.map((article, i) => {
          const tagStyle = getTagStyle(article.tag)
          return (
            <div
              key={i}
              style={{
                padding: '12px 14px',
                borderBottom: i < data.articles.length - 1 ? '1px solid var(--border)' : 'none',
                background: '#fff',
              }}
            >
              {/* 제목 + 태그 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, flex: 1 }}>
                  {article.url ? (
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); window.api.openExternalUrl(article.url!) }}
                      style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {article.title}
                    </a>
                  ) : article.title}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: tagStyle.color,
                    background: tagStyle.bg,
                    border: `1px solid ${tagStyle.border}`,
                    borderRadius: 6,
                    padding: '2px 8px',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tagStyle.emoji} {article.tag}
                </span>
              </div>
              {/* 날짜 + 요약 */}
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                {article.date}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <LinkText>{article.summary}</LinkText>
              </div>
              {/* 근거 */}
              {article.rationale && (
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                    lineHeight: 1.5,
                    marginTop: 6,
                    paddingTop: 6,
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <LinkText>{article.rationale}</LinkText>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
        본 분석은 뉴스 기반 감성 분석으로, 투자 권유가 아닙니다.
      </div>
    </div>
  )
}

function SentimentCountCard({
  label,
  emoji,
  count,
  color,
}: {
  label: string
  emoji: string
  count: number
  color: string
}): React.JSX.Element {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '10px 12px',
        background: '#fff',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>
        {emoji} {label}
      </div>
      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color }}>
        {count}
      </div>
    </div>
  )
}
