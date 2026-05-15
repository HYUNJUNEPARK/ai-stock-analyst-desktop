import type { AgentStatus } from '../types'
import AgentStatusBar from './AgentStatusBar'

type StreamingResponseViewProps = {
  agentStatuses: Record<string, AgentStatus>
  onCancel: () => void
  showAgentFlow: boolean
}

export default function StreamingResponseView({
  agentStatuses,
  onCancel,
  showAgentFlow
}: StreamingResponseViewProps): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%'
      }}
    >
      <div>
        <div
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 4
          }}
        >
          투자 리포트 생성 중
        </div>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)',
            lineHeight: 1.5
          }}
        >
          분석 결과를 종합하고 있습니다.
        </div>
      </div>

      {showAgentFlow && (
        <div
          style={{
            margin: '28px 0 24px',
            padding: 14,
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)'
          }}
        >
          <AgentStatusBar agentStatuses={agentStatuses} />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 'auto',
          paddingTop: 8
        }}
      >
        <button className="btn-ghost" onClick={onCancel} aria-label="분석 취소">
          분석 취소
        </button>
      </div>
    </div>
  )
}
