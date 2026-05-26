import { useState } from 'react'
import { FiArrowDown, FiCheck } from 'react-icons/fi'
import ConfirmDialog from '../../../components/ConfirmDialog'
import { AGENT_CONFIG } from '../constants'
import type { AgentStatus } from '../types'

type AnalysisProgressViewProps = {
  agentStatuses: Record<string, AgentStatus>
  onCancel: () => void
  showAgentFlow: boolean
}

export default function AnalysisProgressView({
  agentStatuses,
  onCancel,
  showAgentFlow
}: AnalysisProgressViewProps): React.JSX.Element {
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
            marginBottom: 2
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
          에이전트별 분석을 마친 후 종합 투자 분석이 진행됩니다.(4-8분)
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

// 에이전트 실행 흐름을 시각화하는 컴포넌트.
// 상단 3개 에이전트(병렬) → 화살표 → 하단 1개 에이전트(종합) 구조로 표시한다.
function AgentStatusBar({
  agentStatuses
}: {
  agentStatuses: Record<string, AgentStatus>
}): React.JSX.Element {
  const firstRowAgents = AGENT_CONFIG.slice(0, 3)
  const strategyAgent = AGENT_CONFIG[3]
  const firstRowDone = firstRowAgents.every((agent) => agentStatuses[agent.key] === 'done')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 8
        }}
      >
        {firstRowAgents.map((agent) => (
          <AgentStatusChip
            key={agent.key}
            label={agent.label}
            status={agentStatuses[agent.key] ?? 'idle'}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          columnGap: 8,
          color: firstRowDone ? 'var(--accent)' : 'var(--text-tertiary)'
        }}
      >
        <div style={{ height: 1, background: firstRowDone ? 'var(--accent)' : 'var(--border)' }} />
        <FiArrowDown size={18} />
        <div style={{ height: 1, background: firstRowDone ? 'var(--accent)' : 'var(--border)' }} />
      </div>
      {strategyAgent && (
        <div>
          <AgentStatusChip
            label={strategyAgent.label}
            status={agentStatuses[strategyAgent.key] ?? 'idle'}
          />
        </div>
      )}
    </div>
  )
}

// 개별 에이전트의 상태(idle / running / done)를 칩 형태로 표시하는 컴포넌트.
function AgentStatusChip({
  label,
  status
}: {
  label: string
  status: AgentStatus
}): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 30,
        padding: '5px 10px',
        borderRadius: 20,
        fontSize: 'var(--text-xs)',
        fontWeight: 500,
        border: '1px solid var(--border)',
        background:
          status === 'done'
            ? 'var(--success)'
            : status === 'running'
              ? 'var(--accent-light)'
              : 'var(--bg-secondary)',
        color:
          status === 'done'
            ? '#fff'
            : status === 'running'
              ? 'var(--accent)'
              : 'var(--text-tertiary)',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap'
      }}
    >
      {status === 'running' && <div className="spinner" style={{ width: 10, height: 10 }} />}
      {status === 'done' && <FiCheck size={10} />}
      {label}
    </div>
  )
}
