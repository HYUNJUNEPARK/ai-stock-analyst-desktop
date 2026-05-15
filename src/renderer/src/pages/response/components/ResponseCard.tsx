import type { AgentStatus, PreviewModel, Status } from '../types'
import MarkdownRenderer from './MarkdownRenderer'
import StreamingResponseView from './StreamingResponseView'

type ResponseCardProps = {
  agentStatuses: Record<string, AgentStatus>
  copied: boolean
  errorMsg: string
  model: PreviewModel | null
  modelImg: string
  modelLabel: string
  onCancel: () => void
  onCopy: () => void
  response: string
  status: Status
}

export default function ResponseCard({
  agentStatuses,
  copied,
  errorMsg,
  model,
  modelImg,
  modelLabel,
  onCancel,
  onCopy,
  response,
  status
}: ResponseCardProps): React.JSX.Element {
  const isStreamingEmpty = status === 'streaming' && !response
  const contentMinHeight = status === 'done' ? 216 : 260

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

        {/* {status === 'streaming' && (
          <div className="spinner" style={{ marginLeft: 'auto' }} aria-label="응답 생성 중" />
        )} */}
      </div>

      <div style={{ padding: 16, minHeight: contentMinHeight }} role="article" aria-label="AI 응답">
        {isStreamingEmpty && (
          <StreamingResponseView
            agentStatuses={agentStatuses}
            onCancel={onCancel}
            showAgentFlow={model === 'claude' || model === 'gpt'}
          />
        )}

        {(response || status !== 'streaming') && (
          <MarkdownRenderer text={response} isStreaming={status === 'streaming'} />
        )}

        {status === 'error' && (
          <div className="error-banner" style={{ marginTop: response ? 16 : 0 }}>
            {errorMsg}
          </div>
        )}
      </div>

      {status === 'done' && (
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '0 10px',
            height: 44,
            borderTop: '1px solid var(--border)',
            alignItems: 'center'
          }}
        >
          <button
            onClick={onCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              fontSize: 'var(--text-xs)',
              color: copied ? 'var(--success)' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: 8,
              fontFamily: 'inherit',
              transition: 'background 0.15s, color 0.15s'
            }}
            aria-label="응답 복사"
          >
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
      )}
    </div>
  )
}
