type ErrorResponseViewProps = {
  errorMsg: string
  onRetry: () => void
}

export default function ErrorResponseView({
  errorMsg,
  onRetry
}: ErrorResponseViewProps): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'inherit',
        gap: 16,
        textAlign: 'center'
      }}
    >
      <div>
        <div
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--danger)',
            marginBottom: 6
          }}
        >
          분석에 실패했습니다.
        </div>
        <div
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.5
          }}
        >
          {errorMsg}
        </div>
      </div>

      <button className="btn-primary danger" onClick={onRetry}>
        다시 시도
      </button>
    </div>
  )
}
