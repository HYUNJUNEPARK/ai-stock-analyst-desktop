import { useState, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import { gptIcon, claudeIcon } from '../../assets'
import {
  FiFileText,
  FiUsers,
  FiTrendingUp,
  FiTarget,
  FiBarChart2,
  FiList,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi'
import { LuNewspaper, LuDiamond } from 'react-icons/lu'

type InvestType = {
  type: string
  coreIdea: string
  suitableHorizon: string
  investmentThesisBreakers: string[]
}

type PricePoint = {
  price: string
  source: string
  rationale: string
}

type AgentVerdicts = {
  financial?: { grade: string; summary: string }
  news?: { sentiment: string; summary: string }
  sector?: { outlook: string; summary: string }
  price?: { verdict: string; summary: string }
  valuation?: { position: string; summary: string }
  investType?: { type: string; summary: string }
}

type InvestmentStrategy = {
  entryStrategy: string
  positionSizing: string
  actionPlan: string[]
  exitStrategy: string
  timeHorizon: string
  caution: string
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
  agentVerdicts?: AgentVerdicts
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
    targetPrice?: string
    stopLoss: string
    stopLossPrice?: string
    targetPrices?: PricePoint[]
    stopLossPrices?: PricePoint[]
    recommendedBuyPrice?: string
    recommendedBuyPriceBasis?: string
    buyPriceRationale?: string
  }
  investmentStrategy?: InvestmentStrategy
  valuation?: {
    securitiesTargetRange?: string
    fairValueConservative?: string
    fairValueBase?: string
    fairValueOptimistic?: string
    currentPricePosition?: string
    valuationSummary?: string
  }
}

type ArtifactTab = 'summary' | 'financial' | 'news' | 'sector' | 'price' | 'valuation' | 'invest-type'

const TAB_LABELS: { key: ArtifactTab; label: string }[] = [
  { key: 'summary', label: '종합' },
  { key: 'financial', label: '재무' },
  { key: 'news', label: '뉴스' },
  { key: 'sector', label: '업종' },
  { key: 'price', label: '기술적' },
  { key: 'valuation', label: '밸류에이션' },
  { key: 'invest-type', label: '투자전략' },
]

const VERDICT_COLORS: Record<string, string> = {
  '적극 매수': '#e53935',
  '분할 매수': '#f57c00',
  '관망': '#f9a825',
  '비중 축소': '#388e3c',
  '매도': '#1976d2'
}

function getSignalColor(signal: string | undefined): string {
  if (!signal) return '#f59e0b'
  if (signal.includes('상승 추세')) return '#22c55e'
  if (signal.includes('하락 추세')) return '#ef4444'
  const hasBullish = signal.includes('강세') || signal.includes('긍정')
  const hasBearish = signal.includes('약세') || signal.includes('부정')
  if (hasBullish && hasBearish) return '#f97316'
  if (hasBullish) return '#22c55e'
  if (hasBearish) return '#ef4444'
  return '#f59e0b'
}

function getValuationPositionColor(position: string): string {
  if (position.includes('저평가')) return '#22c55e'
  if (position.includes('과열')) return '#ef4444'
  if (position.includes('낙관')) return '#f97316'
  if (position.includes('기준 근처')) return '#f59e0b'
  return '#f59e0b'
}

export const ZOOM_LEVELS = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5]
export const DEFAULT_ZOOM_INDEX = 2 // 1.0

export default function ReportView({ data, zoomIndex = DEFAULT_ZOOM_INDEX }: { data: Report; zoomIndex?: number }): React.JSX.Element {
  const verdictColor = VERDICT_COLORS[data.verdict] ?? 'var(--accent)'
  const aiModel = data['ai-model'] || data.aiInfo?.model
  const aiProvider = data.aiInfo?.provider
  const isGpt = (data.aiInfo?.provider === 'openai') || (typeof aiModel === 'string' && aiModel.toLowerCase().includes('gpt'))
  const modelIcon = isGpt ? gptIcon : claudeIcon
  const [activeTab, setActiveTab] = useState<ArtifactTab>('summary')
  const [artifacts, setArtifacts] = useState<{ financial: string; news: string; sector: string; price: string; valuation: string; investType: string } | null>(null)
  const [artifactLoading, setArtifactLoading] = useState(false)
  const zoom = ZOOM_LEVELS[zoomIndex] ?? 1.0

  useEffect(() => {
    if (!data.artifactDir || artifacts) return
    setArtifactLoading(true)
    window.api.readArtifactFiles(data.artifactDir).then((result) => {
      setArtifacts(result)
      setArtifactLoading(false)
    })
  }, [data.artifactDir, artifacts])

  return (
    <div
      className="report-view"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        '--text-xs': `${Math.round(11 * zoom)}px`,
        '--text-sm': `${Math.round(13 * zoom)}px`,
        '--text-base': `${Math.round(15 * zoom)}px`,
        '--text-md': `${Math.round(17 * zoom)}px`,
        '--text-lg': `${Math.round(20 * zoom)}px`,
        '--text-xl': `${Math.round(24 * zoom)}px`,
        '--text-2xl': `${Math.round(28 * zoom)}px`,
      } as React.CSSProperties}
    >

      {/* 헤더: 종목 + 판정 + 확대/축소 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {data.company}{data.ticker && data.ticker !== 'unknown' ? ` (${data.ticker})` : ''}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>


              {(aiModel || aiProvider) && <>
                <img
                  src={modelIcon}
                  alt={isGpt ? 'GPT' : 'Claude'}
                  style={{ width: 14, height: 14, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{aiModel}</span>
              </>}

              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{data.asOfDate}</span>

            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: `${verdictColor}18`,
              border: `1px solid ${verdictColor}50`,
              borderRadius: 10,
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: 18 }}>{data.verdictEmoji}</span>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: verdictColor }}>
              {data.verdict}
            </span>
          </div>
        </div>
      </div>

      {/* 탭 바 */}
      {data.artifactDir && (
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid var(--border)',
          }}
        >
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: 'var(--text-xs)',
                fontWeight: activeTab === key ? 700 : 400,
                color: activeTab === key ? '#2563eb' : 'var(--text-tertiary)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === key ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: -1,
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

      {/* 종합 보고서 탭 */}
      {activeTab === 'summary' && <>

        {/* 1. 결론 카드: 요약 + 전략가 종합 */}
        <div
          style={{
            padding: '18px 20px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <FiCheckCircle size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {data.summary}
            </div>
          </div>
          {data.analysis.strategist && (
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                borderTop: '1px solid #bfdbfe40',
                paddingTop: 10,
                paddingLeft: 30,
              }}
            >
              {data.analysis.strategist}
            </div>
          )}
        </div>

        {/* 2. 분석 요약 (신호 + 에이전트 판정 통합) */}
        <AnalysisSummarySection
          analysis={data.analysis}
          valuation={data.valuation}
          agentVerdicts={data.agentVerdicts}
        />

        {/* 3. 투자 전략 카드 */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            투자 전략
          </div>
          {/* 목표 주가 */}
          <div style={{ padding: '16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 6 }}>목표 주가</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>
              {data.strategy.targetPrice || data.strategy.currentPrice}
            </div>
          </div>
          {/* 시나리오 테이블 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg-primary)' }}>
            <div style={{ padding: '14px 16px', borderRight: '1px solid var(--border)' }}>
              {data.strategy.targetPrices && data.strategy.targetPrices.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#ef4444', marginBottom: 2 }}>목표가 시나리오</div>
                  {data.strategy.targetPrices.map((item, i) => {
                    const pct = calcPctFromCurrent(item.price, data.strategy.currentPrice)
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#ef4444', minWidth: 80 }}>{item.price}</span>
                        {pct && <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#ef4444', minWidth: 45 }}>{pct}</span>}
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{item.source}</span>
                      </div>
                    )
                  })}
                </div>
              ) : data.strategy.targetPrice ? (
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>목표가 시나리오</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#ef4444' }}>{data.strategy.targetPrice}</span>
                    {data.strategy.targetReturn && <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#ef4444' }}>{data.strategy.targetReturn}</span>}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>목표가 없음</div>
              )}
            </div>
            <div style={{ padding: '14px 16px' }}>
              {data.strategy.stopLossPrices && data.strategy.stopLossPrices.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#1976d2', marginBottom: 2 }}>손절가 시나리오</div>
                  {data.strategy.stopLossPrices.map((item, i) => {
                    const pct = calcPctFromCurrent(item.price, data.strategy.currentPrice)
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#1976d2', minWidth: 80 }}>{item.price}</span>
                        {pct && <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#1976d2', minWidth: 45 }}>{pct}</span>}
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{item.source}</span>
                      </div>
                    )
                  })}
                </div>
              ) : data.strategy.stopLossPrice ? (
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#1976d2', marginBottom: 6 }}>손절가 시나리오</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#1976d2' }}>{data.strategy.stopLossPrice}</span>
                    {data.strategy.stopLoss && <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#1976d2' }}>{data.strategy.stopLoss}</span>}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>손절가 없음</div>
              )}
            </div>
          </div>
        </div>

        {/* 4. 실전 투자 가이드 */}
        {data.investmentStrategy && <InvestmentStrategySection strategy={data.investmentStrategy} verdictColor={verdictColor} />}

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
    <div
      style={{
        border: `1px solid ${primaryColor}40`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* 유형 + 기간 */}
      <div
        style={{
          padding: '10px 14px',
          background: `${primaryColor}0d`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          borderBottom: `1px solid ${primaryColor}20`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
                padding: '2px 8px',
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
            padding: '2px 8px',
            flexShrink: 0,
          }}
        >
          {horizon.label}
        </span>
      </div>

      {/* 핵심 투자 아이디어 */}
      <div style={{ padding: '12px 14px', background: 'var(--bg-primary)', borderBottom: `1px solid var(--border)` }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 5, letterSpacing: '0.03em' }}>
          핵심 투자 아이디어
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.65 }}>
          {investType.coreIdea}
        </div>
      </div>

      {/* 무효화 조건 */}
      {investType.investmentThesisBreakers?.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6, letterSpacing: '0.03em' }}>
            아이디어 무효화 조건
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                    width: 4,
                    height: 4,
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
  )
}

function parsePriceToNumber(price: string): number | null {
  const cleaned = price.replace(/[$원,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function calcPctFromCurrent(itemPrice: string, currentPrice: string): string | null {
  const current = parsePriceToNumber(currentPrice)
  const target = parsePriceToNumber(itemPrice)
  if (current == null || target == null || current === 0) return null
  const pct = ((target - current) / current) * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}


const ANALYSIS_ICONS: Record<string, React.ReactNode> = {
  financial: <FiFileText size={16} />,
  sector: <FiUsers size={16} />,
  news: <LuNewspaper size={16} />,
  price: <FiTrendingUp size={16} />,
  valuation: <LuDiamond size={16} />,
  investType: <FiTarget size={16} />,
}

const ANALYSIS_CATEGORIES: { key: keyof AgentVerdicts; label: string; fullLabel: string; analysisKey?: 'financial' | 'news' | 'sector' | 'price' }[] = [
  { key: 'financial', label: '재무', fullLabel: '재무 분석', analysisKey: 'financial' },
  { key: 'sector', label: '업종', fullLabel: '업종 리서치', analysisKey: 'sector' },
  { key: 'news', label: '뉴스', fullLabel: '뉴스 분석', analysisKey: 'news' },
  { key: 'price', label: '기술적', fullLabel: '기술 분석', analysisKey: 'price' },
  { key: 'valuation', label: '밸류에이션', fullLabel: '밸류에이션 분석' },
  { key: 'investType', label: '투자유형', fullLabel: '투자유형' },
]

function getAgentVerdictValue(verdicts: AgentVerdicts, key: keyof AgentVerdicts): string {
  const v = verdicts[key]
  if (!v) return ''
  if ('grade' in v) return v.grade
  if ('sentiment' in v) return v.sentiment
  if ('outlook' in v) return v.outlook
  if ('verdict' in v) return v.verdict
  if ('position' in v) return v.position
  if ('type' in v) return v.type
  return ''
}

function getAgentVerdictColor(value: string): string {
  if (!value || value === '데이터 없음') return '#6b7280'
  const lower = value.toLowerCase()
  if (lower.includes('🟢') || lower.includes('긍정') || lower.includes('강세') || lower.includes('저평가') || lower.includes('매수')) return '#22c55e'
  if (lower.includes('🔴') || lower.includes('부정') || lower.includes('약세') || lower.includes('고평가') || lower.includes('매도') || lower.includes('과열')) return '#ef4444'
  if (lower.includes('🟠') || lower.includes('고위험')) return '#f97316'
  if (/^[ab]$/i.test(value.trim())) return '#22c55e'
  if (/^[cd]$/i.test(value.trim())) return '#ef4444'
  return '#f59e0b'
}

function AnalysisSummarySection({
  analysis,
  valuation,
  agentVerdicts,
}: {
  analysis: Report['analysis']
  valuation?: Report['valuation']
  agentVerdicts?: AgentVerdicts
}): React.JSX.Element {
  // 각 카테고리별로 signal(분석 신호)과 verdict(에이전트 판정)를 통합
  const rows = ANALYSIS_CATEGORIES.map(({ key, label, fullLabel, analysisKey }) => {
    // signal: analysis에서 가져오기 (밸류에이션은 valuation에서)
    let signal = ''
    if (analysisKey && analysis[analysisKey]) {
      signal = ('signal' in analysis[analysisKey]! ? analysis[analysisKey]!.signal : '') ?? ''
    } else if (key === 'valuation' && valuation?.currentPricePosition) {
      signal = valuation.currentPricePosition
    }

    // verdict: agentVerdicts에서 가져오기
    const verdictValue = agentVerdicts ? getAgentVerdictValue(agentVerdicts, key) : ''
    const verdictSummary = agentVerdicts?.[key]?.summary ?? ''

    // 표시할 신호 결정: verdict가 있으면 verdict 우선, 없으면 signal 사용
    const displaySignal = verdictValue || signal
    if (!displaySignal) return null

    const color = key === 'valuation' && !verdictValue
      ? getValuationPositionColor(signal)
      : verdictValue
        ? getAgentVerdictColor(verdictValue)
        : getSignalColor(signal)

    return { key, label, fullLabel, displaySignal, verdictSummary, color }
  }).filter(Boolean) as { key: string; label: string; fullLabel: string; displaySignal: string; verdictSummary: string; color: string }[]

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        분석 요약
      </div>
      {rows.map(({ key, fullLabel, displaySignal, verdictSummary, color }) => (
        <div
          key={key}
          style={{
            padding: '14px 16px',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: 12,
          }}
        >
          {/* 아이콘 */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            flexShrink: 0,
          }}>
            {ANALYSIS_ICONS[key]}
          </div>
          {/* 내용 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {fullLabel}
              </span>
              {key === 'investType' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  {displaySignal.split('+').map((part) => part.trim()).filter(Boolean).map((part) => {
                    const c = getInvestTypeColor(part)
                    return (
                      <span
                        key={part}
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                          color: c,
                          background: `${c}15`,
                          border: `1px solid ${c}50`,
                          borderRadius: 6,
                          padding: '2px 8px',
                        }}
                      >
                        {part}
                      </span>
                    )
                  })}
                </div>
              ) : (
                <span style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {displaySignal}
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                    display: 'inline-block',
                  }} />
                </span>
              )}
            </div>
            {verdictSummary && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {verdictSummary}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const STRATEGY_ICONS: Record<string, React.ReactNode> = {
  '진입 전략': <FiTarget size={16} />,
  '포지션 비중': <FiBarChart2 size={16} />,
  '실행 계획': <FiList size={16} />,
  '익절/손절 전략': <FiTrendingUp size={16} />,
  '권장 보유 기간': <FiFileText size={16} />,
  '리스크 관리': <FiShield size={16} />,
}

function InvestmentStrategySection({ strategy, verdictColor }: { strategy: InvestmentStrategy; verdictColor: string }): React.JSX.Element {
  const rows: { label: string; content: string | string[] }[] = [
    { label: '진입 전략', content: strategy.entryStrategy },
    { label: '포지션 비중', content: strategy.positionSizing },
    { label: '실행 계획', content: strategy.actionPlan },
    { label: '익절/손절 전략', content: strategy.exitStrategy },
    { label: '권장 보유 기간', content: strategy.timeHorizon },
    { label: '리스크 관리', content: strategy.caution },
  ]

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        실전 투자 가이드
      </div>
      {rows.map(({ label, content }) => {
        if (!content || (Array.isArray(content) && content.length === 0)) return null
        return (
          <div
            key={label}
            style={{
              padding: '14px 16px',
              background: 'var(--bg-primary)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: 12,
            }}
          >
            {/* 아이콘 */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
              flexShrink: 0,
            }}>
              {STRATEGY_ICONS[label] || <FiTarget size={16} />}
            </div>
            {/* 내용 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {label}
              </span>
              {Array.isArray(content) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {content.map((step, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.65,
                        display: 'flex',
                        gap: 6,
                      }}
                    >
                      <span style={{ fontWeight: 700, color: verdictColor, flexShrink: 0 }}>{i + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {content}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}


