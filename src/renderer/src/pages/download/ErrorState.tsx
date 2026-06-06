import { useRef, useState } from 'react'
import { FiX, FiChevronDown } from 'react-icons/fi'

export default function ErrorState({
  errorMsg,
  logs
}: {
  errorMsg: string
  logs: string[]
}): React.JSX.Element {
  const [showLogs, setShowLogs] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div className="status-icon error" style={{ marginBottom: 20 }} aria-label="설치 실패">
        <FiX />
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
          marginBottom: 16,
          wordBreak: 'break-word'
        }}
      >
        ⚠ {errorMsg}
      </div>

      {logs.length > 0 && (
        <>
          <button
            onClick={() => setShowLogs((v) => !v)}
            aria-expanded={showLogs}
            aria-controls="install-error-log"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              padding: '4px 0',
              marginBottom: 8
            }}
          >
            <FiChevronDown
              size={14}
              style={{
                transform: showLogs ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease'
              }}
            />
            {showLogs ? '로그 숨기기' : '상세 로그 보기'}
          </button>

          <div
            style={{
              width: '100%',
              maxHeight: showLogs ? 196 : 0,
              opacity: showLogs ? 1 : 0,
              overflow: 'hidden',
              transform: showLogs ? 'translateY(0)' : 'translateY(-4px)',
              transition:
                'max-height 0.35s ease, opacity 0.25s ease, transform 0.35s ease, margin-bottom 0.35s ease',
              marginBottom: showLogs ? 16 : 0
            }}
            aria-hidden={!showLogs}
          >
            <div
              id="install-error-log"
              ref={logRef}
              className="terminal"
              role="log"
              style={{ width: '100%', height: 180 }}
            >
              {logs.map((line, i) => (
                <div key={i} className="terminal-line">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
