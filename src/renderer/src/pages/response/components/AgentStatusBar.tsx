import { AGENT_CONFIG } from '../constants'
import type { AgentStatus } from '../types'

type AgentStatusBarProps = {
  agentStatuses: Record<string, AgentStatus>
}

export default function AgentStatusBar({ agentStatuses }: AgentStatusBarProps): React.JSX.Element {
  const firstRowAgents = AGENT_CONFIG.slice(0, 3)
  const strategyAgent = AGENT_CONFIG[3]
  const firstRowDone = firstRowAgents.every((agent) => agentStatuses[agent.key] === 'done')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
    >
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
        <div
          style={{
            height: 1,
            background: firstRowDone ? 'var(--accent)' : 'var(--border)'
          }}
        />
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 3v10" />
          <polyline points="5,9 9,13 13,9" />
        </svg>
        <div
          style={{
            height: 1,
            background: firstRowDone ? 'var(--accent)' : 'var(--border)'
          }}
        />
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
      {status === 'done' && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="1.5,5 4,7.5 8.5,2.5" />
        </svg>
      )}
      {label}
    </div>
  )
}
