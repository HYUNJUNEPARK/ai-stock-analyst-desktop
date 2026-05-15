export default function InstallingState({
  logs,
  command,
  logRef
}: {
  logs: string[]
  command: string
  logRef: React.RefObject<HTMLDivElement | null>
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div className="spinner-lg" style={{ marginBottom: 20 }} />

      <h2
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 8
        }}
      >
        CLI 설치 중
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: 6
        }}
      >
        잠시만 기다려 주세요...
      </p>
      <code
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginBottom: 24
        }}
      >
        {command}
      </code>

      <div
        ref={logRef}
        className="terminal"
        role="log"
        aria-live="polite"
        style={{ width: '100%', height: 200 }}
      >
        {logs.length === 0 ? (
          <span className="terminal-line dim">설치를 시작하는 중...</span>
        ) : (
          logs.map((line, i) => (
            <div key={i} className="terminal-line">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
