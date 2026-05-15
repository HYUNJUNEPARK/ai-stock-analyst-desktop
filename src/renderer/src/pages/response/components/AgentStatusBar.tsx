import { AGENT_CONFIG } from '../constants'
import type { AgentStatus } from '../types'

type AgentStatusBarProps = {
  agentStatuses: Record<string, AgentStatus>
}

export default function AgentStatusBar({ agentStatuses }: AgentStatusBarProps): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap'
      }}
    >
      {AGENT_CONFIG.map((agent) => {
        const agentStatus = agentStatuses[agent.key] ?? 'idle'
        return (
          <div
            key={agent.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 20,
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              border: '1px solid var(--border)',
              background:
                agentStatus === 'done'
                  ? 'var(--success)'
                  : agentStatus === 'running'
                    ? 'var(--accent-light)'
                    : 'var(--bg-secondary)',
              color:
                agentStatus === 'done'
                  ? '#fff'
                  : agentStatus === 'running'
                    ? 'var(--accent)'
                    : 'var(--text-tertiary)',
              transition: 'all 0.2s'
            }}
          >
            {agentStatus === 'running' && (
              <div className="spinner" style={{ width: 10, height: 10 }} />
            )}
            {agentStatus === 'done' && (
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
            {agent.label}
          </div>
        )
      })}
    </div>
  )
}
