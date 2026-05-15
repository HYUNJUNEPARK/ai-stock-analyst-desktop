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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            padding: 12,
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)'
          }}
        >
          <AgentStatusBar agentStatuses={agentStatuses} />
        </div>
      )}

      <div
        aria-hidden="true"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          paddingTop: 2
        }}
      >
        <SkeletonLine width="94%" />
        <SkeletonLine width="78%" />
        <SkeletonLine width="88%" />
        <SkeletonLine width="52%" />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 2
        }}
      >
        <button className="btn-ghost" onClick={onCancel} aria-label="분석 취소">
          분석 취소
        </button>
      </div>
    </div>
  )
}

function SkeletonLine({ width }: { width: string }): React.JSX.Element {
  return (
    <div
      className="skeleton-line"
      style={{
        width,
        height: 10
      }}
    />
  )
}
