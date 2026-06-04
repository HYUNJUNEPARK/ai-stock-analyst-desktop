import { FiRefreshCw } from 'react-icons/fi'
import { MdOutlineError } from 'react-icons/md'
import { VscOutput } from 'react-icons/vsc'

type ErrorResponseViewProps = {
  errorMsg: string
  errorLog: string
  onRetry: () => void
}

export default function ErrorResponseView({
  errorMsg,
  errorLog,
  onRetry
}: ErrorResponseViewProps): React.JSX.Element {
  function handleOpenErrorLog(): void {
    if (errorLog) {
      window.api.openErrorLogWindow(errorLog)
    }
  }

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
          onClick={onRetry}
          aria-label="분석 다시 시작"
          style={{
            width: 'auto',
            height: 'auto',
            padding: '5px 12px',
            borderRadius: 8
          }}
        >
          <FiRefreshCw size={15} />
          다시 분석
        </button>
        {errorLog && (
          <button
            className="btn-ghost"
            onClick={handleOpenErrorLog}
            aria-label="에러 로그 보기"
            style={{
              width: 'auto',
              height: 'auto',
              padding: '5px 12px',
              borderRadius: 8
            }}
          >
            <VscOutput size={15} />
            에러 로그
          </button>
        )}
      </div>
    </div>
  )
}
