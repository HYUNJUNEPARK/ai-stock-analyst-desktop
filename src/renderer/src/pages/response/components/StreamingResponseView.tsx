import { useState } from 'react'
import ConfirmDialog from '../../../components/ConfirmDialog'
import type { AgentStatus } from '../types'
import AgentStatusBar from './AgentStatusBar'

type StreamingResponseViewProps = {
  agentStatuses: Record<string, AgentStatus>
  analysisLog: string
  onCancel: () => void
  showAgentFlow: boolean
}

export default function StreamingResponseView({
  agentStatuses,
  analysisLog,
  onCancel,
  showAgentFlow
}: StreamingResponseViewProps): React.JSX.Element {
  const [showConfirm, setShowConfirm] = useState(false)

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
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          title={analysisLog}
        >
          {analysisLog}
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
        <button className="btn-ghost" onClick={() => setShowConfirm(true)} aria-label="분석 취소">
          분석 취소
        </button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="분석을 취소하시겠습니까?"
          message="취소하면 분석 결과를 받을 수 없으며, 이미 소모된 토큰은 되돌릴 수 없습니다."
          confirmLabel="취소"
          cancelLabel="계속 분석"
          onConfirm={onCancel}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
