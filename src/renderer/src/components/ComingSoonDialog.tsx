interface ComingSoonDialogProps {
  visible: boolean
  title?: string
  message?: string
  onClose: () => void
}

export default function ComingSoonDialog({
  visible,
  title = '개발 중인 기능입니다',
  message = '조금만 기다려 주세요!',
  onClose
}: ComingSoonDialogProps): React.JSX.Element | null {
  if (!visible) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-primary)',
          border: '1.5px solid var(--border)',
          borderRadius: 16,
          padding: '32px 28px',
          width: 320,
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
        }}
      >
        <div
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 24,
            lineHeight: 1.6,
            whiteSpace: 'pre-line'
          }}
        >
          {message}
        </div>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px 0',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          확인
        </button>
      </div>
    </div>
  )
}
