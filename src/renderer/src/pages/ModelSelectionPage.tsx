import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const models = [
  {
    id: 'gpt' as const,
    name: 'OpenAI GPT',
    subtitle: 'o3 / o4-mini',
    dotColor: '#000000',
    iconBg: '#000000',
    initial: 'G'
  },
  {
    id: 'claude' as const,
    name: 'Anthropic Claude',
    subtitle: 'claude-code CLI',
    dotColor: '#D4A853',
    iconBg: '#D4A853',
    initial: 'C'
  }
]

export default function ModelSelectionPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { setSelectedModel } = useApp()

  function handleSelect(id: 'gpt' | 'claude'): void {
    setSelectedModel(id)
    navigate('/download')
  }

  return (
    <div className="page" style={{ justifyContent: 'space-between' }}>
      {/* 상단 콘텐츠 */}
      <div
        className="page-content"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="content-container">
          {/* 앱 로고 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                boxShadow: '0 4px 16px rgba(0, 122, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20
              }}
            >
              {/* 터미널 아이콘 */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <polyline
                  points="6,10 12,14 6,18"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="14"
                  y1="18"
                  x2="22"
                  y2="18"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textAlign: 'center',
                marginBottom: 8
              }}
            >
              AI CLI Launcher
            </h1>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}
            >
              원하는 AI 모델을 선택해 주세요
            </p>
          </div>

          {/* 모델 카드 목록 */}
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {models.map((model) => (
              <ModelCard key={model.id} model={model} onSelect={handleSelect} />
            ))}
          </div>
        </div>
      </div>

      {/* 버전 표시 */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          paddingBottom: 24
        }}
      >
        v1.0.0
      </div>
    </div>
  )
}

function ModelCard({
  model,
  onSelect
}: {
  model: (typeof models)[number]
  onSelect: (id: 'gpt' | 'claude') => void
}): React.JSX.Element {
  return (
    <button
      onClick={() => onSelect(model.id)}
      aria-label={`${model.name} 선택`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        width: '100%',
        background: 'var(--bg-secondary)',
        border: '1.5px solid var(--border)',
        borderRadius: 16,
        padding: 20,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        fontFamily: 'inherit'
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--accent)'
        el.style.boxShadow =
          '0 0 0 3px var(--accent-light), 0 4px 12px rgba(0,0,0,0.08)'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--border)'
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
        el.style.transform = 'translateY(0)'
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.99) translateY(0)'
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
    >
      {/* 모델 아이콘 */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: model.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1
          }}
        >
          {model.initial}
        </span>
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 3
          }}
        >
          {model.name}
        </div>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)'
          }}
        >
          {model.subtitle}
        </div>
      </div>

      {/* Chevron */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}
      >
        <polyline
          points="6,3 12,9 6,15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
