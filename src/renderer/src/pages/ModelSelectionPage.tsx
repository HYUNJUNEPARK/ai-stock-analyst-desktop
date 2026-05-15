import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import gptIcon from '../assets/gpt.jpg'
import claudeIcon from '../assets/claude.png'

const models = [
  {
    id: 'gpt' as const,
    name: 'GPT',
    subtitle: 'OpenAI',
    dotColor: '#000000',
    icon: gptIcon
  },
  {
    id: 'claude' as const,
    name: 'Claude',
    subtitle: 'Anthropic',
    dotColor: '#D4A853',
    icon: claudeIcon
  }
]

export default function ModelSelectionPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { setSelectedModel } = useApp()

  // 선택한 모델을 전역 상태에 저장하고 CLI 설치 화면으로 이동
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

            <p
              style={{
                fontSize: 'var(--text-md)',
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
      <img
        src={model.icon}
        alt={model.name}
        style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
      />

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
