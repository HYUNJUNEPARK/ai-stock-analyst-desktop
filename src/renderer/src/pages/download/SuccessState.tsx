export default function SuccessState({
  modelLabel,
  logs,
  showLogs,
  setShowLogs,
  logRef,
  onNext
}: {
  modelLabel: string
  logs: string[]
  showLogs: boolean
  setShowLogs: (v: boolean) => void
  logRef: React.RefObject<HTMLDivElement | null>
  onNext: () => void
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div className="status-icon success" style={{ marginBottom: 20 }} aria-label="설치 완료">
        <svg viewBox="0 0 28 28">
          <polyline points="6,14 11,19 22,8" />
        </svg>
      </div>

      <h2
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 8
        }}
      >
        설치 완료!
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: 32
        }}
      >
        {modelLabel} CLI가 성공적으로 설치되었습니다.
        <br />
        <span style={{ color: 'var(--text-tertiary)' }}>3초 후 자동으로 이동합니다.</span>
      </p>

      <button
        onClick={() => setShowLogs(!showLogs)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          fontSize: 'var(--text-sm)',
          cursor: 'pointer',
          marginBottom: 12,
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        설치 로그 보기
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: showLogs ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        >
          <polyline points="2,4 7,10 12,4" />
        </svg>
      </button>

      <div
        style={{
          width: '100%',
          maxHeight: showLogs ? 172 : 0,
          opacity: showLogs ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease, opacity 0.3s ease',
          marginBottom: showLogs ? 24 : 0
        }}
      >
        <div ref={logRef} className="terminal" style={{ width: '100%', height: 160 }}>
          {logs.map((line, i) => (
            <div key={i} className="terminal-line success">
              {line}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', marginTop: 8 }}>
        <button className="btn-primary" onClick={onNext}>
          다음: API 키 설정
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6,3 12,9 6,15" />
          </svg>
        </button>
      </div>
    </div>
  )
}
