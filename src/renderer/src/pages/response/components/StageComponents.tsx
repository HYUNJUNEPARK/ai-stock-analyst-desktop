/**
 * AnalysisProgressView 서브 컴포넌트
 * StageBadge, StageCard, StageStatusIndicator, AgentCard, ValuationCard
 */
import { FiCheck } from 'react-icons/fi'
import type { AgentStatus } from '../types'

export function StageBadge({ num, color }: { num: number; color: string }): React.JSX.Element {
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

export function StageStatusIndicator({
  status,
  color
}: {
  status: AgentStatus
  color: string
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color, fontWeight: 600 }}>
        <div className="spinner" style={{ width: 12, height: 12, borderTopColor: color }} />
        분석 중
      </div>
    )
  }
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>대기 중</div>
  )
}

type StageCardProps = {
  num: number
  color: string
  iconBg: string
  iconColor: string
  title: string
  description: string
  icon: React.ReactNode
  status: AgentStatus
}

export function StageCard({
  num,
  color,
  iconBg,
  iconColor,
  title,
  description,
  icon,
  status
}: StageCardProps): React.JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        border: `1.5px solid ${color}`,
        borderRadius: 14,
        padding: 14,
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
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
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: 14,
            background: iconBg
          }}
        >
          <div style={{ color: iconColor }}>
            {icon}
          </div>
        </div>
        <StageStatusIndicator status={status} color={color} />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: AgentStatus }): React.JSX.Element | null {
  if (status === 'done') {
    return (
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
    )
  }
  if (status === 'running') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid var(--bg-tertiary)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite'
        }}
      />
    )
  }
  return null
}

type AgentCardProps = {
  icon: React.ReactNode
  label: string
  description: string
  status: AgentStatus
}

export function AgentCard({ icon, label, description, status }: AgentCardProps): React.JSX.Element {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '8px 9px',
        background: '#f5f9fd',
        position: 'relative',
        transition: 'border-color 0.2s'
      }}
    >
      <StatusBadge status={status} />
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 6,
          background: '#e2eef9',
          marginBottom: 5
        }}
      >
        <div style={{ color: '#93C5FD' }}>
          {icon}
        </div>
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
          lineHeight: 1.3,
          whiteSpace: 'pre-line'
        }}
      >
        {description}
      </div>
    </div>
  )
}

export function ValuationCard({ icon, label, description, status }: AgentCardProps): React.JSX.Element {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '10px 8px',
        background: '#f5f9fd',
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
      <StatusBadge status={status} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: '20%',
          background: '#e2eef9',
        }}
      >
        <div style={{ color: '#93C5FD' }}>
          {icon}
        </div>
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
