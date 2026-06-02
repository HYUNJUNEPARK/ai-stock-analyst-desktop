/**
 * 종합 분석 탭 뷰
 * 모든 에이전트의 판정을 종합하여 결론, 분석 신호, 투자 전략, 실전 가이드를 표시한다.
 */
import {
  FiUsers,
  FiTarget,
  FiBarChart2,
  FiList,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi'
import {
  IoNewspaperOutline,
  IoDiamondOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5'
import { FaChartLine } from 'react-icons/fa6'
import { LuScale } from 'react-icons/lu'
import type { Report, AgentVerdicts, InvestType, InvestmentStrategy } from '../types'
import {
  VERDICT_COLORS,
  HORIZON_LABELS,
  getInvestTypeColor,
  getSignalColor,
  getValuationPositionColor,
  getAgentVerdictColor,
  calcPctFromCurrent,
} from '../utils'

export default function SummarySection({ data }: { data: Report }): React.JSX.Element {
  const verdictColor = VERDICT_COLORS[data.verdict] ?? 'var(--accent)'

  return (
    <>
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
        {/* 현재 주가 */}
        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 6 }}>현재 주가</div>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)' }}>
            {data.strategy.currentPrice}
          </div>
        </div>
        {/* 시나리오 테이블 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg-primary)' }}>
          <div style={{ padding: '14px 16px', borderRight: '1px solid var(--border)' }}>
            {data.strategy.targetPrices && data.strategy.targetPrices.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: '#ef4444', marginBottom: 2 }}>목표가 시나리오</div>
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
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: '#ef4444', marginBottom: 6 }}>목표가 시나리오</div>
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
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: '#1976d2', marginBottom: 2 }}>손절가 시나리오</div>
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
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: '#1976d2', marginBottom: 6 }}>손절가 시나리오</div>
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
    </>
  )
}


/* ── 투자유형 카드 (종합 보고서 JSON fallback용) ── */

export function InvestTypeSection({ investType }: { investType: InvestType }): React.JSX.Element {
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


/* ── 분석 요약 섹션 ── */

const ANALYSIS_ICONS: Record<string, React.ReactNode> = {
  financial: <IoDocumentTextOutline size={16} />,
  sector: <FiUsers size={16} />,
  news: <IoNewspaperOutline size={16} />,
  price: <FaChartLine size={16} />,
  valuation: <IoDiamondOutline size={16} />,
  investType: <LuScale size={16} />,
}

const ANALYSIS_CATEGORIES: { key: keyof AgentVerdicts; label: string; fullLabel: string; analysisKey?: 'financial' | 'news' | 'sector' | 'price' }[] = [
  { key: 'financial', label: '재무', fullLabel: '재무 분석', analysisKey: 'financial' },
  { key: 'sector', label: '업종', fullLabel: '업종 리서치', analysisKey: 'sector' },
  { key: 'news', label: '뉴스', fullLabel: '뉴스 분석', analysisKey: 'news' },
  { key: 'price', label: '기술적', fullLabel: '기술 분석', analysisKey: 'price' },
  { key: 'investType', label: '투자유형', fullLabel: '투자유형' },
  { key: 'valuation', label: '밸류에이션', fullLabel: '밸류에이션 분석' },
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

function AnalysisSummarySection({
  analysis,
  valuation,
  agentVerdicts,
}: {
  analysis: Report['analysis']
  valuation?: Report['valuation']
  agentVerdicts?: AgentVerdicts
}): React.JSX.Element {
  const rows = ANALYSIS_CATEGORIES.map(({ key, label, fullLabel, analysisKey }) => {
    let signal = ''
    if (analysisKey && analysis[analysisKey]) {
      signal = ('signal' in analysis[analysisKey]! ? analysis[analysisKey]!.signal : '') ?? ''
    } else if (key === 'valuation' && valuation?.currentPricePosition) {
      signal = valuation.currentPricePosition
    }

    const verdictValue = agentVerdicts ? getAgentVerdictValue(agentVerdicts, key) : ''
    const verdictSummary = agentVerdicts?.[key]?.summary ?? ''

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
          background: '#fff',
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
            background: '#fff',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: 12,
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#fff',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            flexShrink: 0,
          }}>
            {ANALYSIS_ICONS[key]}
          </div>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0, alignSelf: 'flex-start', width: 100 }}>
            {fullLabel}
          </span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                fontWeight: 800,
                color,
              }}>
                {displaySignal}
              </span>
            )}
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


/* ── 실전 투자 가이드 섹션 ── */

const STRATEGY_ICONS: Record<string, React.ReactNode> = {
  '진입 전략': <FiTarget size={16} />,
  '포지션 비중': <FiBarChart2 size={16} />,
  '실행 계획': <FiList size={16} />,
  '익절/손절 전략': <FaChartLine size={16} />,
  '권장 보유 기간': <IoDocumentTextOutline size={16} />,
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
          background: '#fff',
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
              background: '#fff',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: 12,
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#fff',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
              flexShrink: 0,
            }}>
              {STRATEGY_ICONS[label] || <FiTarget size={16} />}
            </div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0, alignSelf: 'flex-start', width: 100 }}>
              {label}
            </span>
            <div style={{ flex: 1 }}>
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
