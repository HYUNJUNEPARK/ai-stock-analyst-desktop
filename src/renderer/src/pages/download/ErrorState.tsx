export default function ErrorState({
  errorMsg,
  onRetry,
  onBack
}: {
  errorMsg: string
  onRetry: () => void
  onBack: () => void
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div className="status-icon error" style={{ marginBottom: 20 }} aria-label="설치 실패">
        <svg viewBox="0 0 28 28">
          <line x1="8" y1="8" x2="20" y2="20" />
          <line x1="20" y1="8" x2="8" y2="20" />
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
        설치 실패
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: 20
        }}
      >
        오류가 발생했습니다.
      </p>

      <div
        style={{
          width: '100%',
          background: 'rgba(255,59,48,0.08)',
          borderLeft: '3px solid var(--danger)',
          borderRadius: 8,
          padding: '12px 14px',
          fontSize: 'var(--text-sm)',
          color: 'var(--danger)',
          lineHeight: 1.5,
          marginBottom: 32,
          wordBreak: 'break-word'
        }}
      >
        ⚠ {errorMsg}
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn-primary danger" onClick={onRetry}>
          다시 시도
        </button>
        <button className="btn-ghost" onClick={onBack}>
          모델 다시 선택
        </button>
      </div>
    </div>
  )
}
