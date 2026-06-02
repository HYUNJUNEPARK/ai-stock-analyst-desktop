/**
 * 보고서 탭 컨테이너
 * 헤더(종목명, AI 모델, 판정)와 탭 바를 렌더링하고,
 * 선택된 탭에 따라 해당 섹션 컴포넌트를 표시한다.
 */
import { useState, useEffect } from 'react'
import MarkdownRenderer from './components/MarkdownRenderer'
import FinancialAnalysisSection, { tryParseFinancialJson } from './sections/FinancialAnalysisSection'
import NewsAnalysisSection, { tryParseNewsJson } from './sections/NewsAnalysisSection'
import SectorAnalysisSection, { tryParseSectorJson } from './sections/SectorAnalysisSection'
import PriceAnalysisSection, { tryParsePriceJson } from './sections/PriceAnalysisSection'
import ValuationAnalysisSection, { tryParseValuationJson } from './sections/ValuationAnalysisSection'
import InvestTypeAnalysisSection, { tryParseInvestTypeJson } from './sections/InvestTypeAnalysisSection'
import SummarySection, { InvestTypeSection } from './sections/SummarySection'
import { gptIcon, claudeIcon } from '../../assets'
import type { Report, ArtifactTab } from './types'
import { VERDICT_COLORS } from './utils'

const TAB_LABELS: { key: ArtifactTab; label: string }[] = [
  { key: 'summary', label: '종합' },
  { key: 'financial', label: '재무' },
  { key: 'news', label: '뉴스' },
  { key: 'sector', label: '업종' },
  { key: 'price', label: '기술적' },
  { key: 'valuation', label: '밸류에이션' },
  { key: 'invest-type', label: '투자유형' },
]

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

      {/* 헤더: 종목 + 판정 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {data.company}{data.ticker && data.ticker !== 'unknown' ? ` (${data.ticker})` : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{data.asOfDate}</span>
              {(aiModel || aiProvider) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <img
                    src={modelIcon}
                    alt={isGpt ? 'GPT' : 'Claude'}
                    style={{ width: 12, height: 12, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{aiModel}</span>
                </div>
              )}
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
              flexShrink: 0,
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

      {/* 탭 내용 분기 */}
      {activeTab === 'summary'
        ? <SummarySection data={data} />
        : renderArtifactTab(activeTab, artifacts, artifactLoading, data)
      }
    </div>
  )
}

/** 에이전트별 상세 분석 탭 렌더링 */
function renderArtifactTab(
  activeTab: ArtifactTab,
  artifacts: { financial: string; news: string; sector: string; price: string; valuation: string; investType: string } | null,
  loading: boolean,
  data: Report,
): React.JSX.Element | null {
  if (loading) {
    return (
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: '20px 0', textAlign: 'center' }}>
        불러오는 중...
      </div>
    )
  }

  const tabConfig: Record<string, { raw: string | undefined; tryParse: (t: string) => unknown; Component: React.ComponentType<{ data: never }>; emptyMsg: string }> = {
    'financial': { raw: artifacts?.financial, tryParse: tryParseFinancialJson, Component: FinancialAnalysisSection as never, emptyMsg: '재무 분석 데이터가 없습니다.' },
    'news': { raw: artifacts?.news, tryParse: tryParseNewsJson, Component: NewsAnalysisSection as never, emptyMsg: '뉴스 분석 데이터가 없습니다.' },
    'sector': { raw: artifacts?.sector, tryParse: tryParseSectorJson, Component: SectorAnalysisSection as never, emptyMsg: '업종 분석 데이터가 없습니다.' },
    'price': { raw: artifacts?.price, tryParse: tryParsePriceJson, Component: PriceAnalysisSection as never, emptyMsg: '기술적 분석 데이터가 없습니다.' },
    'valuation': { raw: artifacts?.valuation, tryParse: tryParseValuationJson, Component: ValuationAnalysisSection as never, emptyMsg: '밸류에이션 분석 데이터가 없습니다.' },
    'invest-type': { raw: artifacts?.investType, tryParse: tryParseInvestTypeJson, Component: InvestTypeAnalysisSection as never, emptyMsg: '투자 유형 분석 데이터가 없습니다.' },
  }

  const cfg = tabConfig[activeTab]
  if (!cfg) return null

  const text = cfg.raw ?? ''
  const parsed = text ? cfg.tryParse(text) : null

  if (parsed) {
    const C = cfg.Component as React.ComponentType<{ data: unknown }>
    return <C data={parsed} />
  }
  if (text) return <MarkdownRenderer text={text} isStreaming={false} />
  if (activeTab === 'invest-type' && data.investType) return <InvestTypeSection investType={data.investType} />

  return <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: '20px 0', textAlign: 'center' }}>{cfg.emptyMsg}</div>
}
