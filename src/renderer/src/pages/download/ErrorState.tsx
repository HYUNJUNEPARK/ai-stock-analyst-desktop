import { FiX, FiPackage } from 'react-icons/fi'
import ErrorLogButton from '../../components/ErrorLogButton'

export default function ErrorState({
  errorMsg,
  logs
}: {
  errorMsg: string
  logs: string[]
}): React.JSX.Element {
  const errorLog = logs.length > 0 ? [`[error] ${errorMsg}`, '', ...logs].join('\n') : ''

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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 8,
          width: '100%',
          marginBottom: 12
        }}
      >
        <button
          onClick={() => void window.api.openPrerequisitesWindow()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: 8,
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            fontFamily: 'inherit',
            transition: 'color 0.15s, background 0.15s',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent)'
            e.currentTarget.style.background = 'var(--accent-light)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)'
            e.currentTarget.style.background = 'none'
          }}
        >
          <FiPackage size={15} />
          사용 전 준비사항
        </button>

        <ErrorLogButton
          errorLog={errorLog}
          style={{
            fontSize: 'var(--text-sm)',
            padding: '6px 10px',
            borderRadius: 8
          }}
        />
      </div>
    </div>
  )
}
