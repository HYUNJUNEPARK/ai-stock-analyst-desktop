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
          에이전트별 분석을 마친 후 종합 투자 분석이 진행됩니다. (5-10분 소요)
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
// Wave 1 (4개 병렬) → Wave 2 (밸류에이션, Wave 1 결과 주입) → 투자 유형 판단 → 투자 전략 구조로 표시한다.
function AgentStatusBar({
  agentStatuses
}: {
  agentStatuses: Record<string, AgentStatus>
}): React.JSX.Element {
  const wave1Agents = AGENT_CONFIG.slice(0, 4)
  const wave2Agent = AGENT_CONFIG[4]
  const classifierAgent = AGENT_CONFIG[5]
  const strategyAgent = AGENT_CONFIG[6]

  const wave1Done = wave1Agents.every((agent) => agentStatuses[agent.key] === 'done')
  const wave2Done = agentStatuses[wave2Agent?.key] === 'done'
  const classifierDone = agentStatuses[classifierAgent?.key] === 'done'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Wave 1: 독립 에이전트 4개 동시 실행 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 8
        }}
      >
        {wave1Agents.map((agent) => (
          <AgentStatusChip
            key={agent.key}
            label={agent.label}
            status={agentStatuses[agent.key] ?? 'idle'}
          />
        ))}
      </div>

      {/* 화살표 1 */}
      <FlowArrow active={wave1Done} />

      {/* Wave 2: 밸류에이션 — Wave 1 재무·업종 결과 주입 후 실행 */}
      {wave2Agent && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 'calc(50% - 4px)' }}>
            <AgentStatusChip
              label={wave2Agent.label}
              status={agentStatuses[wave2Agent.key] ?? 'idle'}
            />
          </div>
        </div>
      )}

      {/* 화살표 2 */}
      <FlowArrow active={wave2Done} />

      {/* Phase 3: 투자 유형 판단 */}
      {classifierAgent && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 'calc(50% - 4px)' }}>
            <AgentStatusChip
              label={classifierAgent.label}
              status={agentStatuses[classifierAgent.key] ?? 'idle'}
            />
          </div>
        </div>
      )}

      {/* 화살표 3 */}
      <FlowArrow active={classifierDone} />

      {/* Phase 4: 투자 전략 */}
      {strategyAgent && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 'calc(50% - 4px)' }}>
            <AgentStatusChip
              label={strategyAgent.label}
              status={agentStatuses[strategyAgent.key] ?? 'idle'}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function FlowArrow({ active }: { active: boolean }): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        columnGap: 8,
        color: active ? 'var(--accent)' : 'var(--text-tertiary)'
      }}
    >
      <div style={{ height: 1, background: active ? 'var(--accent)' : 'var(--border)' }} />
      <FiArrowDown size={18} />
      <div style={{ height: 1, background: active ? 'var(--accent)' : 'var(--border)' }} />
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
