import { useState, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import gptIcon from '../../assets/gpt.jpg'
import claudeIcon from '../../assets/claude.png'

type InvestType = {
  type: string
  coreIdea: string
  suitableHorizon: string
  investmentThesisBreakers: string[]
}

type Report = {
  company: string
  ticker: string
  asOfDate: string
  'ai-model'?: string
  aiInfo?: {
    provider?: string
    model?: string
    engine?: string
  }
  artifactDir?: string
  verdict: string
  verdictEmoji: string
  summary: string
  investType?: InvestType
  analysis: {
    financial: { signal: string; content: string }
    news: { signal: string; content: string }
    sector: { signal: string; content: string }
    price?: { signal?: string; content: string }
    strategist: string
  }
  strategy: {
    currentPrice: string
    targetReturn: string
    targetPrice: string
    stopLoss: string
    stopLossPrice: string
    recommendedBuyPrice?: string
    recommendedBuyPriceBasis?: string
  }
  risks: string[]
  monitoringPoints: string[]
}

type ArtifactTab = 'summary' | 'financial' | 'news' | 'sector' | 'price' | 'valuation' | 'invest-type'

const TAB_LABELS: { key: ArtifactTab; label: string }[] = [
  { key: 'summary', label: '종합 보고서' },
  { key: 'financial', label: '재무 분석' },
  { key: 'news', label: '뉴스 분석' },
  { key: 'sector', label: '업종 리서치' },
  { key: 'price', label: '기술적 분석' },
  { key: 'valuation', label: '밸류에이션' },
  { key: 'invest-type', label: '투자 유형' },
]

const VERDICT_COLORS: Record<string, string> = {
  '적극 매수': '#e53935',
  '분할 매수': '#f57c00',
  '관망': '#f9a825',
  '비중 축소': '#388e3c',
  '매도': '#1976d2'
}

function extractPriceVerdictText(markdown: string): string {
  // [^\n]+\n 으로 헤더 한 줄만 소비하고 이후 내용을 캡처
  const section8Match = markdown.match(/##\s*8[^\n]+\n([\s\S]*)/)
  if (!section8Match) return ''
  const section8 = section8Match[1]
  const parts: string[] = []

  const entryPriceMatch = section8.match(/\*\*기술적 진입 적합 가격대\*\*[:\s]*(.+)/)
  if (entryPriceMatch) {
    parts.push(entryPriceMatch[1].trim())
  }

  // 블록쿼트 여러 줄을 모두 합침
  const blockquoteLines = section8.match(/^>\s*(.+)$/gm)
  if (blockquoteLines) {
    const blockquoteText = blockquoteLines
      .map((line) => line.replace(/^>\s*/, '').trim())
      .join(' ')
    parts.push(blockquoteText)
  }

  return parts.join('\n\n')
}

function getSignalColor(signal: string | undefined): string {
  if (!signal) return '#f59e0b'
  if (signal.includes('상승 추세')) return '#22c55e'  // 상승 추세 → 초록
  if (signal.includes('하락 추세')) return '#ef4444'  // 하락 추세 → 빨강
  const hasBullish = signal.includes('강세')
  const hasBearish = signal.includes('약세')
  if (hasBullish && hasBearish) return '#f97316' // 혼합 → 주황
  if (hasBullish) return '#22c55e'               // 강세 → 초록
  if (hasBearish) return '#ef4444'               // 약세 → 빨강
  return '#f59e0b'                               // 중립/횡보 → 노랑/앰버
}

export default function ReportView({ data }: { data: Report }): React.JSX.Element {
  const verdictColor = VERDICT_COLORS[data.verdict] ?? 'var(--accent)'
  const aiModel = data['ai-model'] || data.aiInfo?.model
  const aiProvider = data.aiInfo?.provider
  const isGpt = (data.aiInfo?.provider === 'openai') || (typeof aiModel === 'string' && aiModel.toLowerCase().includes('gpt'))
  const modelIcon = isGpt ? gptIcon : claudeIcon
  const [activeTab, setActiveTab] = useState<ArtifactTab>('summary')
  const [artifacts, setArtifacts] = useState<{ financial: string; news: string; sector: string; price: string; valuation: string; investType: string } | null>(null)
  const [artifactLoading, setArtifactLoading] = useState(false)

  useEffect(() => {
    if (!data.artifactDir || artifacts) return
    setArtifactLoading(true)
    window.api.readArtifactFiles(data.artifactDir).then((result) => {
      setArtifacts(result)
      setArtifactLoading(false)
    })
  }, [data.artifactDir, artifacts])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 종목 + 판정 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.company}{data.ticker && data.ticker !== 'unknown' ? ` (${data.ticker})` : ''}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 3 }}>
            {data.asOfDate}
          </div>
          {(aiModel || aiProvider) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <img
                src={modelIcon}
                alt={isGpt ? 'GPT' : 'Claude'}
                style={{ width: 22, height: 22, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }}
              />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {[aiModel].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: `${verdictColor}18`,
            border: `1px solid ${verdictColor}50`,
            borderRadius: 10,
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: 15 }}>{data.verdictEmoji}</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: verdictColor }}>
            {data.verdict}
          </span>
        </div>
      </div>

      {/* 탭 바 */}
      {data.artifactDir && (
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: 'var(--bg-secondary)',
            borderRadius: 10,
            padding: 4,
          }}
        >
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: 'var(--text-xs)',
                fontWeight: activeTab === key ? 700 : 400,
                color: activeTab === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                background: activeTab === key ? 'var(--bg-primary)' : 'transparent',
                border: activeTab === key ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: 7,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* 역할별 상세 분석 탭 내용 */}
      {activeTab !== 'summary' && (
        <div>
          {artifactLoading ? (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: '20px 0', textAlign: 'center' }}>
              불러오는 중...
            </div>
          ) : activeTab === 'invest-type' ? (
            artifacts?.investType
              ? <MarkdownRenderer text={artifacts.investType} isStreaming={false} />
              : data.investType
                ? <InvestTypeSection investType={data.investType} />
                : (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: '20px 0', textAlign: 'center' }}>
                    투자 유형 분석 데이터가 없습니다.
                  </div>
                )
          ) : activeTab === 'valuation' ? (
            artifacts?.valuation
              ? <MarkdownRenderer text={artifacts.valuation} isStreaming={false} />
              : (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: '20px 0', textAlign: 'center' }}>
                  밸류에이션 분석 데이터가 없습니다.
                </div>
              )
          ) : (
            <MarkdownRenderer
              text={
                activeTab === 'financial' ? (artifacts?.financial ?? '') :
                activeTab === 'news' ? (artifacts?.news ?? '') :
                activeTab === 'price' ? (artifacts?.price ?? '') :
                (artifacts?.sector ?? '')
              }
              isStreaming={false}
            />
          )}
        </div>
      )}

      {activeTab === 'summary' && <>

      {/* 한 줄 요약 */}
      <div
        style={{
          padding: '16px 18px',
          background: 'rgba(0, 122, 255, 0.08)',
          border: '1px solid rgba(0, 122, 255, 0.2)',
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '0.04em'
          }}
        >
          한 줄 요약
        </div>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            lineHeight: 1.65
          }}
        >
          {data.summary}
        </div>
      </div>

      {/* 투자 유형 */}
      {data.investType && <InvestTypeSection investType={data.investType} />}

      {/* 투자 실행 전략 */}
      <div style={{ marginTop: 12 }}>
        <SectionTitle>* 투자 실행 전략</SectionTitle>

        {/* 매수 추천가 강조 카드 */}
        {data.strategy.recommendedBuyPrice && (
          <div
            style={{
              padding: '14px 16px',
              background: `${verdictColor}10`,
              border: `1px solid ${verdictColor}40`,
              borderRadius: 10,
              marginBottom: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: verdictColor, letterSpacing: '0.04em' }}>
                매수 추천가
              </div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: verdictColor }}>
                {data.strategy.recommendedBuyPrice}
              </div>
            </div>
            {data.strategy.recommendedBuyPriceBasis && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: `1px solid ${verdictColor}25`, paddingTop: 8 }}>
                {data.strategy.recommendedBuyPriceBasis}
              </div>
            )}
          </div>
        )}

        {/* 기술적 종합 판정 */}
        {data.analysis.price && (() => {
          const priceSignalColor = getSignalColor(data.analysis.price.signal)
          const verdictText = artifacts?.price ? extractPriceVerdictText(artifacts.price) : ''
          return (
            <div
              style={{
                padding: '14px 16px',
                background: `${priceSignalColor}10`,
                border: `1px solid ${priceSignalColor}40`,
                borderRadius: 10,
                marginBottom: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: priceSignalColor, letterSpacing: '0.04em' }}>
                기술적 종합 판정
              </div>
              {verdictText && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: `1px solid ${priceSignalColor}25`, paddingTop: 8, whiteSpace: 'pre-line' }}>
                  {verdictText}
                </div>
              )}
            </div>
          )
        })()}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            background: 'var(--border)',
            borderRadius: 10,
            overflow: 'hidden'
          }}
        >
          {[
            ['현재 주가', data.strategy.currentPrice],
            ['목표 수익률', `${data.strategy.targetReturn} (${data.strategy.targetPrice})`],
            ['손절 라인', `${data.strategy.stopLoss} (${data.strategy.stopLossPrice})`],
            ['판정', data.verdict]
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: '10px 14px',
                background: 'var(--bg-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{label}</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 분석 근거 */}
      <div style={{ marginTop: 12 }}>
        <SectionTitle>* 분석 근거</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnalysisItem label="재무 분석" signal={data.analysis.financial.signal} content={data.analysis.financial.content} />
          <AnalysisItem label="뉴스 분석" signal={data.analysis.news.signal} content={data.analysis.news.content} />
          <AnalysisItem label="업종 리서치" signal={data.analysis.sector.signal} content={data.analysis.sector.content} />
          {data.analysis.price && (
            <AnalysisItem label="기술적 분석" content={data.analysis.price.content} />
          )}
          <AnalysisItem label="전략가 종합" content={data.analysis.strategist} />
        </div>
      </div>

      {/* 리스크 + 모니터링 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <BulletSection title="* 핵심 리스크" items={data.risks} />
        <BulletSection title="* 모니터링 포인트" items={data.monitoringPoints} />
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
        본 분석은 투자 참고용이며, 최종 투자 결정은 본인의 책임입니다.
      </div>

      </>}
    </div>
  )
}

const INVEST_TYPE_COLORS: { keyword: string; color: string }[] = [
  { keyword: '실적 성장형', color: '#16a34a' },
  { keyword: '저평가 가치형', color: '#2563eb' },
  { keyword: '턴어라운드형', color: '#d97706' },
  { keyword: '모멘텀형', color: '#7c3aed' },
  { keyword: '고위험 테마형', color: '#dc2626' },
  { keyword: '배당·방어형', color: '#0891b2' },
]

const HORIZON_LABELS: Record<string, { label: string; color: string }> = {
  '단기': { label: '단기', color: '#dc2626' },
  '중기': { label: '중기', color: '#d97706' },
  '장기': { label: '장기', color: '#16a34a' },
}

function getInvestTypeColor(type: string): string {
  for (const { keyword, color } of INVEST_TYPE_COLORS) {
    if (type.includes(keyword)) return color
  }
  return '#6b7280'
}

function InvestTypeSection({ investType }: { investType: InvestType }): React.JSX.Element {
  const primaryColor = getInvestTypeColor(investType.type)
  const horizon = HORIZON_LABELS[investType.suitableHorizon] ?? { label: investType.suitableHorizon, color: '#6b7280' }

  return (
    <div style={{ marginTop: 12 }}>
      <SectionTitle>* 투자 유형 판단</SectionTitle>
      <div
        style={{
          border: `1px solid ${primaryColor}40`,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* 헤더: 유형 + 기간 */}
        <div
          style={{
            padding: '12px 16px',
            background: `${primaryColor}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            borderBottom: `1px solid ${primaryColor}20`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {investType.type.split('+').map((part) => part.trim()).filter(Boolean).map((part) => (
              <span
                key={part}
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  color: getInvestTypeColor(part),
                  background: `${getInvestTypeColor(part)}15`,
                  border: `1px solid ${getInvestTypeColor(part)}50`,
                  borderRadius: 6,
                  padding: '3px 10px',
                }}
              >
                {part}
              </span>
            ))}
          </div>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: horizon.color,
              background: `${horizon.color}15`,
              border: `1px solid ${horizon.color}40`,
              borderRadius: 6,
              padding: '3px 10px',
              flexShrink: 0,
            }}
          >
            {horizon.label} 투자
          </span>
        </div>

        {/* 핵심 투자 아이디어 */}
        <div
          style={{
            padding: '14px 16px',
            background: 'var(--bg-primary)',
            borderBottom: `1px solid var(--border)`,
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6, letterSpacing: '0.03em' }}>
            핵심 투자 아이디어
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.65 }}>
            {investType.coreIdea}
          </div>
        </div>

        {/* 아이디어 무효화 조건 */}
        {investType.investmentThesisBreakers?.length > 0 && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--bg-secondary)',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 8, letterSpacing: '0.03em' }}>
              투자 아이디어 무효화 조건
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {investType.investmentThesisBreakers.map((item, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    paddingLeft: 12,
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
                      background: '#dc2626',
                      display: 'inline-block',
                    }}
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div
      style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: 10
      }}
    >
      {children}
    </div>
  )
}

function AnalysisItem({
  label,
  signal,
  content
}: {
  label: string
  signal?: string
  content: string
}): React.JSX.Element {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: 'var(--bg-secondary)',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
          {label}
        </span>
        {signal && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: getSignalColor(signal),
              background: `${getSignalColor(signal)}18`,
              border: `1px solid ${getSignalColor(signal)}50`,
              borderRadius: 6,
              padding: '2px 8px'
            }}
          >
            {signal}
          </span>
        )}
      </div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {content}
      </div>
    </div>
  )
}

function BulletSection({ title, items }: { title: string; items: string[] }): React.JSX.Element {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: 'var(--bg-secondary)',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
    >
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
        {title}
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            paddingLeft: 10,
            position: 'relative'
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 0,
              top: '0.4em',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'var(--text-tertiary)',
              display: 'inline-block'
            }}
          />
          {item}
        </div>
      ))}
    </div>
  )
}
