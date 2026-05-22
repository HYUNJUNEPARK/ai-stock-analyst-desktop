import { AGENT_CONFIG } from '../constants'
import type { AgentStatus, PreviewModel, Status } from '../types'
import ErrorResponseView from './ErrorResponseView'
import MarkdownRenderer from './MarkdownRenderer'
import StreamingResponseView from './StreamingResponseView'

type ResponseCardProps = {
  agentStatuses: Record<string, AgentStatus>
  analysisLog: string
  errorMsg: string
  model: PreviewModel | null
  modelImg: string
  modelLabel: string
  onCancel: () => void
  onRetry: () => void
  response: string
  status: Status
}

export default function ResponseCard({
  agentStatuses,
  analysisLog,
  errorMsg,
  model,
  modelImg,
  modelLabel,
  onCancel,
  onRetry,
  response,
  status
}: ResponseCardProps): React.JSX.Element {
  const isStreamingEmpty = status === 'streaming' && !response
  const contentMinHeight = status === 'done' ? 216 : 260
  const isCancelled = status === 'cancelled'
  const isError = status === 'error'

  const isStockModel = model === 'claude' || model === 'gpt'
  const showProgress = status === 'streaming' && isStockModel
  const doneCount = Object.values(agentStatuses).filter((s) => s === 'done').length
  const totalCount = AGENT_CONFIG.length
  const progressPct = Math.round((doneCount / totalCount) * 100)

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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
            <div
              style={{
                flex: 1,
                height: 4,
                background: 'var(--border)',
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: 'var(--accent)',
                  borderRadius: 2,
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                flexShrink: 0,
                minWidth: 28,
                textAlign: 'right'
              }}
            >
              {progressPct}%
            </span>
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
            analysisLog={analysisLog}
            onCancel={onCancel}
            showAgentFlow={model === 'claude' || model === 'gpt'}
          />
        )}

        {!isCancelled && !isError && (response || status !== 'streaming') && (
          <MarkdownRenderer text={response} isStreaming={status === 'streaming'} />
        )}
      </div>
    </div>
  )
}
