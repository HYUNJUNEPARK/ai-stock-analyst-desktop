import { useState } from 'react'
import { FiArrowRight, FiCheck } from 'react-icons/fi'
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
          에이전트별 분석을 마친 후 종합 투자 분석이 진행됩니다. (4-8분 소요)
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
// Chain A (재무+업종 → 밸류에이션) / Chain B (뉴스+기술) 병렬 진행 후 합류 → 투자 유형 판단 → 투자 전략
function AgentStatusBar({
  agentStatuses
}: {
  agentStatuses: Record<string, AgentStatus>
}): React.JSX.Element {
  const chainAAgents = [AGENT_CONFIG[0], AGENT_CONFIG[1]] // 재무, 업종
  const chainBAgents = [AGENT_CONFIG[2], AGENT_CONFIG[3]] // 뉴스, 기술
  const valuationAgent = AGENT_CONFIG[4]
  const classifierAgent = AGENT_CONFIG[5]
  const strategyAgent = AGENT_CONFIG[6]

  const chainADone = chainAAgents.every((a) => agentStatuses[a.key] === 'done')
  const valuationDone = agentStatuses[valuationAgent?.key] === 'done'
  const chainBDone = chainBAgents.every((a) => agentStatuses[a.key] === 'done')
  // 두 체인 모두 완료돼야 classifier 진입 가능
  const readyForClassifier = valuationDone && chainBDone
  const classifierDone = agentStatuses[classifierAgent?.key] === 'done'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
      {/* 두 체인을 세로로 배치 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        {/* Chain A: 재무+업종 → 밸류에이션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {chainAAgents.map((agent) => (
            <AgentStatusChip
              key={agent.key}
              label={agent.label}
              status={agentStatuses[agent.key] ?? 'idle'}
            />
          ))}
          <FlowArrow active={chainADone} />
          {valuationAgent && (
            <AgentStatusChip
              label={valuationAgent.label}
              status={agentStatuses[valuationAgent.key] ?? 'idle'}
            />
          )}
        </div>

        {/* Chain B: 뉴스+기술 (밸류에이션 너비만큼 패딩으로 정렬) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {chainBAgents.map((agent) => (
            <AgentStatusChip
              key={agent.key}
              label={agent.label}
              status={agentStatuses[agent.key] ?? 'idle'}
            />
          ))}
        </div>
      </div>

      {/* → (두 체인 모두 완료 시 활성화) */}
      <FlowArrow active={readyForClassifier} />

      {/* Wave 2 Step 1: 투자 유형 판단 */}
      {classifierAgent && (
        <AgentStatusChip
          label={classifierAgent.label}
          status={agentStatuses[classifierAgent.key] ?? 'idle'}
        />
      )}

      {/* → */}
      <FlowArrow active={classifierDone} />

      {/* Wave 2 Step 2: 투자 전략 */}
      {strategyAgent && (
        <AgentStatusChip
          label={strategyAgent.label}
          status={agentStatuses[strategyAgent.key] ?? 'idle'}
        />
      )}
    </div>
  )
}

function FlowArrow({ active }: { active: boolean }): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        color: active ? 'var(--accent)' : 'var(--text-tertiary)',
        flexShrink: 0
      }}
    >
      <FiArrowRight size={16} />
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
        textAlign: 'center'
      }}
    >
      {status === 'running' && <div className="spinner" style={{ width: 10, height: 10 }} />}
      {status === 'done' && <FiCheck size={10} />}
      {label}
    </div>
  )
}
