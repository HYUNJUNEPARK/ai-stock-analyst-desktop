import { FiLogIn, FiRefreshCw } from 'react-icons/fi'
import { MdOutlineError } from 'react-icons/md'
import ErrorLogButton from '../../../components/ErrorLogButton'

type ErrorResponseViewProps = {
  errorMsg: string
  errorLog: string
  authRequired?: boolean
  onRetry: () => void
  onReauthenticate?: () => void
}

export default function ErrorResponseView({
  errorMsg,
  errorLog,
  authRequired = false,
  onRetry,
  onReauthenticate
}: ErrorResponseViewProps): React.JSX.Element {
  const handlePrimaryAction = authRequired && onReauthenticate ? onReauthenticate : onRetry

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'inherit',
        gap: 20
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <MdOutlineError size={48} color="var(--danger)" />
        <div
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textAlign: 'center',
            lineHeight: 1.5
          }}
        >
          {errorMsg || '분석에 실패하였습니다.'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="btn-ghost"
          onClick={handlePrimaryAction}
          aria-label={authRequired ? 'Codex 다시 인증' : '분석 다시 시작'}
          style={{
            width: 'auto',
            height: 'auto',
            padding: '5px 12px',
            borderRadius: 8
          }}
        >
          {authRequired ? <FiLogIn size={15} /> : <FiRefreshCw size={15} />}
          {authRequired ? '다시 인증' : '다시 분석'}
        </button>
        <ErrorLogButton errorLog={errorLog} />
      </div>
    </div>
  )
}
