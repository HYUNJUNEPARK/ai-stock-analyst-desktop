import { FiSearch, FiX, FiArrowUp } from 'react-icons/fi'

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export default function PromptInput({ value, onChange, onSubmit }: Props): React.JSX.Element {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' && value.trim()) onSubmit()
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        border: '1.5px solid var(--border)',
        borderRadius: 28,
        padding: '0 16px',
        height: 52,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'border-color 0.15s, box-shadow 0.15s'
      }}
    >
      <FiSearch size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="종목명 입력  예) 삼성전자"
        aria-label="종목명 입력"
        autoFocus
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'inherit',
          fontSize: 'var(--text-base)',
          color: 'var(--text-primary)',
          marginLeft: 10
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="입력 지우기"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
            borderRadius: '50%',
            transition: 'color 0.15s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
        >
          <FiX size={16} />
        </button>
      )}
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        aria-label="분석 시작"
        style={{
          background: value.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
          border: 'none',
          cursor: value.trim() ? 'pointer' : 'not-allowed',
          color: value.trim() ? '#fff' : 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 34,
          height: 34,
          borderRadius: '50%',
          marginLeft: 6,
          flexShrink: 0,
          transition: 'background 0.15s, color 0.15s'
        }}
      >
        <FiArrowUp size={16} />
      </button>
    </div>
  )
}
