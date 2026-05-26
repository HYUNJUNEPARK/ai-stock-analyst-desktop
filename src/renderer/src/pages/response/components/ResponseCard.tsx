import { AGENT_CONFIG } from '../constants'
import type { AgentStatus, PreviewModel, Status } from '../types'
import ErrorResponseView from './ErrorResponseView'
import MarkdownRenderer from './MarkdownRenderer'
import StreamingResponseView from './StreamingResponseView'

type ResponseCardProps = {
  agentStatuses: Record<string, AgentStatus>
  errorMsg: string
  model: PreviewModel | null
  modelImg: string
  modelLabel: string
  onCancel: () => void
  onRetry: () => void
  onViewReport: () => void
  response: string
  status: Status
}

export default function ResponseCard({
  agentStatuses,
  errorMsg,
  model,
  modelImg,
  modelLabel,
  onCancel,
  onRetry,
  onViewReport,
  response,
  status
}: ResponseCardProps): React.JSX.Element {
  const isStreamingEmpty = status === 'streaming' && !response
  const contentMinHeight = status === 'done' ? 216 : 260
  const isCancelled = status === 'cancelled'
  const isError = status === 'error'

  const isStockModel = model === 'claude' || model === 'gpt'
  const doneCount = Object.values(agentStatuses).filter((s) => s === 'done').length
  const totalCount = AGENT_CONFIG.length
  const progressPct = Math.round((doneCount / totalCount) * 100)
  const showProgress = status === 'streaming' && isStockModel && progressPct < 100

  const circleSize = 28
  const radius = 10
  const progressColor =
    doneCount === 0
      ? 'var(--text-tertiary)'
      : doneCount === 1
        ? '#4A90E2'
        : doneCount === 2
          ? '#9B59B6'
          : '#E67E22'

  return (
    <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          height: 48,
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <img
          src={modelImg}
          alt={modelLabel}
          style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            flexShrink: 0
          }}
        >
          {modelLabel}
        </span>

        {showProgress && (
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
            <svg
              width={circleSize}
              height={circleSize}
              style={{ animation: 'spin 1s linear infinite', display: 'block' }}
            >
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth={3}
              />
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                fill="none"
                stroke={progressColor}
                strokeWidth={3}
                strokeDasharray={`${2 * Math.PI * radius * 0.25} ${2 * Math.PI * radius * 0.75}`}
                strokeLinecap="round"
                style={{ transition: 'stroke 0.4s ease' }}
              />
            </svg>
          </div>
        )}
      </div>

      <div
        style={{ padding: 16, minHeight: contentMinHeight, position: 'relative' }}
        role="article"
        aria-label="AI 응답"
      >
        {isCancelled && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 'inherit'
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)'
              }}
            >
              분석을 취소했습니다.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
              <button className="btn-ghost" onClick={onRetry}>
                다시 시도
              </button>
            </div>
          </div>
        )}

        {isError && <ErrorResponseView errorMsg={errorMsg} onRetry={onRetry} />}

        {!isCancelled && !isError && isStreamingEmpty && (
          <StreamingResponseView
            agentStatuses={agentStatuses}
            onCancel={onCancel}
            showAgentFlow={model === 'claude' || model === 'gpt'}
          />
        )}

        {!isCancelled && !isError && isStockModel && status === 'done' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 'inherit'
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)'
              }}
            >
              분석이 완료되었습니다.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
              <button className="btn-ghost" onClick={onViewReport}>
                보고서 보기
              </button>
            </div>
          </div>
        )}

        {!isCancelled && !isError && !isStockModel && (response || status !== 'streaming') && (
          <MarkdownRenderer text={response} isStreaming={status === 'streaming'} />
        )}
      </div>
    </div>
  )
}
