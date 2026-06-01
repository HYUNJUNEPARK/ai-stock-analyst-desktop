import { useState } from 'react'
import {
  FiArrowRight,
  FiBarChart2,
  FiCheck,
  FiClock,
  FiFileText,
  FiRadio,
  FiSliders,
  FiTarget,
  FiTrendingUp,
  FiUsers
} from 'react-icons/fi'
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

  const [financial, sector, news, price, valuation, classifier, strategy] = AGENT_CONFIG

  const doneCount = Object.values(agentStatuses).filter((s) => s === 'done').length
  const progressPct = Math.round((doneCount / AGENT_CONFIG.length) * 100)

  const chainADone =
    agentStatuses[financial.key] === 'done' && agentStatuses[sector.key] === 'done'
  const wave1Done =
    chainADone &&
    agentStatuses[valuation.key] === 'done' &&
    agentStatuses[news.key] === 'done' &&
    agentStatuses[price.key] === 'done'
  const classifierDone = agentStatuses[classifier?.key] === 'done'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 헤더 */}
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
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          에이전트별 분석을 마친 후 종합 투자 분석이 진행됩니다.
        </div>
      </div>

      {showAgentFlow ? (
        <>
          {/* 3단계 카드 레이아웃 */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
            {/* 1단계 카드 */}
            <div
              style={{
                flex: '0 0 340px',
                border: '2px solid var(--accent)',
                borderRadius: 14,
                padding: 14,
                background: 'var(--bg-secondary)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StageBadge num={1} color="#3B82F6" />
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}
                  >
                    데이터 분석 및 밸류에이션
                  </span>
                </div>

              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  marginBottom: 12
                }}
              >
                기업 및 시장 데이터 분석 → 적정가치 산출
              </div>

              {/* 2×2 그리드 + → + 밸류에이션 */}
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                    flex: 1
                  }}
                >
                  <AgentCard
                    icon={<FiFileText size={14} />}
                    label="재무 분석"
                    description="기업 재무제표 및 재무 건전성 분석"
                    status={agentStatuses[financial.key] ?? 'idle'}
                  />
                  <AgentCard
                    icon={<FiUsers size={14} />}
                    label="업종 리서치"
                    description="산업 동향 및 경쟁사 분석"
                    status={agentStatuses[sector.key] ?? 'idle'}
                  />
                  <AgentCard
                    icon={<FiRadio size={14} />}
                    label="뉴스 분석"
                    description="뉴스 수집 및 감성 분석"
                    status={agentStatuses[news.key] ?? 'idle'}
                  />
                  <AgentCard
                    icon={<FiTrendingUp size={14} />}
                    label="기술 분석"
                    description="주가 흐름 및 기술적 지표 분석"
                    status={agentStatuses[price.key] ?? 'idle'}
                  />
                </div>

                <ValuationCard
                  icon={<FiBarChart2 size={24} />}
                  label="밸류에이션"
                  description={'재무 + 업종 분석\n결과 기반\n적정가치 산출'}
                  status={agentStatuses[valuation.key] ?? 'idle'}
                />
              </div>
            </div>

            {/* → 화살표 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: wave1Done ? 'var(--accent)' : 'var(--text-tertiary)',
                flexShrink: 0,
                transition: 'color 0.3s'
              }}
            >
              <FiArrowRight size={16} />
            </div>

            {/* 2단계 카드 */}
            <StageCard
              num={2}
              color="#10B981"
              title="투자 유형 판단"
              description="뉴스 + 기술 + 밸류에이션 결과를 종합하여 판단"
              icon={<FiSliders size={28} />}
              status={agentStatuses[classifier?.key] ?? 'idle'}
              active={wave1Done}
              waitingMsg="모든 분석 결과가 완료되면 자동으로 진행됩니다."
            />

            {/* → 화살표 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: classifierDone ? 'var(--accent)' : 'var(--text-tertiary)',
                flexShrink: 0,
                transition: 'color 0.3s'
              }}
            >
              <FiArrowRight size={16} />
            </div>

            {/* 3단계 카드 */}
            <StageCard
              num={3}
              color="#8B5CF6"
              title="투자 전략 생성"
              description="최종 투자 전략 및 제안"
              icon={<FiTarget size={28} />}
              status={agentStatuses[strategy?.key] ?? 'idle'}
              active={classifierDone}
              waitingMsg="투자 유형 판단 완료 후 자동으로 진행됩니다."
            />
          </div>

          {/* 진행률 + 취소 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-xs)',
                flexShrink: 0
              }}
            >
              <FiClock size={12} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span>예상 완료 시간</span>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>약 3~5분</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)'
                }}
              >
                전체 진행률
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: 'var(--border)',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPct}%`,
                    background: 'var(--accent)',
                    borderRadius: 3,
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  minWidth: 28,
                  textAlign: 'right'
                }}
              >
                {progressPct}%
              </span>
              </div>
            </div>
            <button
              className="btn-ghost"
              onClick={() => setShowConfirm(true)}
              aria-label="분석 취소"
              style={{
                flexShrink: 0,
                width: 'auto',
                height: 'auto',
                padding: '5px 12px',
                borderRadius: 8
              }}
            >
              분석 취소
            </button>
          </div>
        </>
      ) : (
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
      )}

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

// ─── 서브 컴포넌트 ───────────────────────────────────────────

function StageBadge({ num, color }: { num: number; color: string }): React.JSX.Element {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        color: '#fff',
        background: color,
        borderRadius: 6,
        padding: '2px 6px',
        flexShrink: 0
      }}
    >
      {num}단계
    </span>
  )
}

type StageCardProps = {
  num: number
  color: string
  title: string
  description: string
  icon: React.ReactNode
  status: AgentStatus
  active: boolean
  waitingMsg: string
}

function StageCard({
  num,
  color,
  title,
  description,
  icon,
  status,
  active,
  waitingMsg
}: StageCardProps): React.JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        border: `1.5px solid ${active ? color : 'var(--border)'}`,
        borderRadius: 14,
        padding: 14,
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'border-color 0.3s'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <StageBadge num={num} color={color} />
          <span
            style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}
          >
            {title}
          </span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
          {description}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        <div
          style={{
            color: active ? color : 'var(--text-tertiary)',
            opacity: active ? 1 : 0.4,
            transition: 'color 0.3s, opacity 0.3s'
          }}
        >
          {icon}
        </div>
        <StageStatusIndicator status={status} waitingMsg={waitingMsg} />
      </div>
    </div>
  )
}

function StageStatusIndicator({
  status,
  waitingMsg
}: {
  status: AgentStatus
  waitingMsg: string
}): React.JSX.Element {
  if (status === 'done') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          color: 'var(--success)',
          fontWeight: 600
        }}
      >
        <FiCheck size={12} />
        완료
      </div>
    )
  }
  if (status === 'running') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)' }}>
        <div className="spinner" style={{ width: 12, height: 12 }} />
        분석 중
      </div>
    )
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        textAlign: 'center'
      }}
    >
      <div className="spinner" style={{ width: 14, height: 14, opacity: 0.25 }} />
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>대기 중</div>
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{waitingMsg}</div>
    </div>
  )
}

type AgentCardProps = {
  icon: React.ReactNode
  label: string
  description: string
  status: AgentStatus
}

function AgentCard({ icon, label, description, status }: AgentCardProps): React.JSX.Element {
  const isDone = status === 'done'
  const isRunning = status === 'running'

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '8px 9px',
        background: 'var(--bg-primary)',
        position: 'relative',
        transition: 'border-color 0.2s'
      }}
    >
      {isDone && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FiCheck size={9} color="#fff" />
        </div>
      )}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 8,
          background: isRunning ? 'var(--accent-light)' : '#EFF6FF',
          marginBottom: 5
        }}
      >
        {isRunning ? (
          <div className="spinner" style={{ width: 13, height: 13 }} />
        ) : (
          <div style={{ color: isDone ? 'var(--accent)' : '#60A5FA' }}>{icon}</div>
        )}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 2,
          lineHeight: 1.2
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          lineHeight: 1.3
        }}
      >
        {description}
      </div>
    </div>
  )
}

function ValuationCard({ icon, label, description, status }: AgentCardProps): React.JSX.Element {
  const isDone = status === 'done'
  const isRunning = status === 'running'

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '10px 8px',
        background: 'var(--bg-primary)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minWidth: 88,
        transition: 'border-color 0.2s'
      }}
    >
      {isDone && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FiCheck size={9} color="#fff" />
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: isRunning ? 'var(--accent-light)' : '#EFF6FF'
        }}
      >
        {isRunning ? (
          <div className="spinner" style={{ width: 18, height: 18 }} />
        ) : (
          <div style={{ color: isDone ? 'var(--accent)' : '#93C5FD' }}>{icon}</div>
        )}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-primary)',
          textAlign: 'center',
          lineHeight: 1.2
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          textAlign: 'center',
          lineHeight: 1.3,
          whiteSpace: 'pre-line'
        }}
      >
        {description}
      </div>
    </div>
  )
}
