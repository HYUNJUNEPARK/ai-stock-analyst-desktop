import { useState, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'

type GptReport = {
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
  analysis: {
    financial: { signal: string; content: string }
    news: { signal: string; content: string }
    sector: { signal: string; content: string }
    strategist: string
  }
  strategy: {
    currentPrice: string
    targetReturn: string
    targetPrice: string
    stopLoss: string
    stopLossPrice: string
    riskReward: string
    entryTiming: string
    positionSize: string
    holdingPeriod: string
  }
  risks: string[]
  monitoringPoints: string[]
}

type ArtifactTab = 'summary' | 'financial' | 'news' | 'sector'

const TAB_LABELS: { key: ArtifactTab; label: string }[] = [
  { key: 'summary', label: '종합 보고서' },
  { key: 'financial', label: '재무 분석' },
  { key: 'news', label: '뉴스 감성' },
  { key: 'sector', label: '섹터 리서치' },
]

const VERDICT_COLORS: Record<string, string> = {
  '적극 매수': '#e53935',
  '분할 매수': '#f57c00',
  '관망': '#f9a825',
  '비중 축소': '#388e3c',
  '매도': '#1976d2'
}

export default function GptReportView({ data }: { data: GptReport }): React.JSX.Element {
  const verdictColor = VERDICT_COLORS[data.verdict] ?? 'var(--accent)'
  const aiModel = data['ai-model'] || data.aiInfo?.model
  const aiProvider = data.aiInfo?.provider
  const [activeTab, setActiveTab] = useState<ArtifactTab>('summary')
  const [artifacts, setArtifacts] = useState<{ financial: string; news: string; sector: string } | null>(null)
  const [artifactLoading, setArtifactLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'summary' || !data.artifactDir || artifacts) return
    setArtifactLoading(true)
    window.api.readArtifactFiles(data.artifactDir).then((result) => {
      setArtifacts(result)
      setArtifactLoading(false)
    })
  }, [activeTab, data.artifactDir, artifacts])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 종목 + 판정 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.company} ({data.ticker})
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 3 }}>
            {data.asOfDate}
          </div>
          {(aiModel || aiProvider) && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
              {[aiModel].filter(Boolean).join(' · ')}
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
          ) : (
            <MarkdownRenderer
              text={
                activeTab === 'financial' ? (artifacts?.financial ?? '') :
                activeTab === 'news' ? (artifacts?.news ?? '') :
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
          padding: '14px 16px',
          background: 'rgba(0, 122, 255, 0.08)',
          border: '1px solid rgba(0, 122, 255, 0.2)',
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 6
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

      {/* 투자 실행 전략 */}
      <div>
        <SectionTitle>투자 실행 전략</SectionTitle>
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
            ['리스크/리워드', data.strategy.riskReward],
            ['진입 타이밍', data.strategy.entryTiming],
            ['포지션 크기', data.strategy.positionSize],
            ['투자 기간', data.strategy.holdingPeriod],
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
      <div>
        <SectionTitle>분석 근거</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnalysisItem label="재무 분석" signal={data.analysis.financial.signal} content={data.analysis.financial.content} />
          <AnalysisItem label="뉴스 감성" signal={data.analysis.news.signal} content={data.analysis.news.content} />
          <AnalysisItem label="업종 리서치" signal={data.analysis.sector.signal} content={data.analysis.sector.content} />
          <AnalysisItem label="전략가 종합" content={data.analysis.strategist} />
        </div>
      </div>

      {/* 리스크 + 모니터링 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <BulletSection title="핵심 리스크" items={data.risks} />
        <BulletSection title="모니터링 포인트" items={data.monitoringPoints} />
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
        본 분석은 투자 참고용이며, 최종 투자 결정은 본인의 책임입니다.
      </div>

      </>}
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
              color: 'var(--text-tertiary)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
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
