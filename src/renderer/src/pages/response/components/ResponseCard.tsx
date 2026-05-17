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
            color: 'var(--text-secondary)'
          }}
        >
          {modelLabel}
        </span>
      </div>

      <div
        style={{ padding: 16, minHeight: contentMinHeight, position: 'relative' }}
        role="article"
        aria-label="AI 응답"
      >
        {isCancelled && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                textAlign: 'center'
              }}
            >
              분석을 취소했습니다.
            </div>
            <button
              className="btn-ghost"
              onClick={onRetry}
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 16,
                transform: 'translateX(-50%)'
              }}
            >
              다시 시도
            </button>
          </>
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
