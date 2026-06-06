import type { CSSProperties, ReactNode } from 'react'
import { VscOutput } from 'react-icons/vsc'

type ErrorLogButtonProps = {
  errorLog: string
  children?: ReactNode
  style?: CSSProperties
}

export default function ErrorLogButton({
  errorLog,
  children = '에러 로그',
  style
}: ErrorLogButtonProps): React.JSX.Element | null {
  if (!errorLog) return null

  function handleOpenErrorLog(): void {
    void window.api.openErrorLogWindow(errorLog)
  }

  return (
    <button
      className="btn-ghost"
      onClick={handleOpenErrorLog}
      aria-label="에러 로그 보기"
      style={{
        width: 'auto',
        height: 'auto',
        padding: '5px 12px',
        borderRadius: 8,
        ...style
      }}
    >
      <VscOutput size={15} />
      {children}
    </button>
  )
}
