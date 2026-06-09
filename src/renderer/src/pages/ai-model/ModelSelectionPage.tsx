import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPackage } from 'react-icons/fi'
import { useApp } from '../../context/AppContext'
import { gptIcon2 as gptIcon, claudeIcon2 as claudeIcon} from '../../assets'
import { ROUTES } from '../../routes'
import './ModelSelectionPage.css'

const models = [
  {
    id: 'gpt' as const,
    name: 'GPT',
    subtitle: 'OpenAI',
    description: '강력한 추론 능력과\n광범위한 지식을 갖춘 AI 모델',
    icon: gptIcon,
    accentColor: '#10a37f',
    disabled: false
  },
  {
    id: 'claude' as const,
    name: 'Claude',
    subtitle: 'Anthropic',
    description: '안전하고 정확한 분석에\n특화된 차세대 AI 모델',
    icon: claudeIcon,
    accentColor: '#D4A853',
    disabled: true
  }
]

export default function ModelSelectionPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { setSelectedModel } = useApp()

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Page] ModelSelectionPage 렌더링')
  }, [])

  function handleSelect(id: 'gpt' | 'claude'): void {
    setSelectedModel(id)
    navigate(ROUTES.STATUS_CHECK)
  }

  return (
    <div className="page model-selection-page">
      <div className="model-selection-content">
        {/* 헤더 영역 */}
        <div className="model-selection-header">
          <h1 className="model-selection-title">AI 모델 선택</h1>
          <p className="model-selection-subtitle">
            투자 분석에 사용할 AI 모델을 선택하세요
          </p>
        </div>

        {/* 모델 카드 그리드 */}
        <div className="model-card-grid">
          {models.map((model, index) => (
            <button
              key={model.id}
              className={`model-card ${model.disabled ? 'model-card--disabled' : ''}`}
              onClick={() => handleSelect(model.id)}
              disabled={model.disabled}
              aria-label={`${model.name} 선택`}
              style={
                { '--card-index': index, '--accent-color': model.accentColor } as React.CSSProperties
              }
            >
              {/* 아이콘 */}
              <div className="model-card-icon-wrap">
                <img
                  src={model.icon}
                  alt={model.name}
                  className="model-card-icon"
                />
              </div>

              {/* 텍스트 */}
              <div className="model-card-text">
                <div className="model-card-name">{model.name}</div>
                <div className="model-card-company">{model.subtitle}</div>
                <div className="model-card-desc">{model.description}</div>
              </div>

              {/* CTA */}
              <div className="model-card-cta">
                <span className="model-card-cta-label">
                  {model.disabled ? '준비 중' : '시작하기'}
                </span>
                <svg
                  className="model-card-cta-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M3.5 8h9M8.5 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 하단 링크 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          paddingTop: 16,
          paddingBottom: 4
        }}
      >
        <button
          onClick={() => window.api.openPrerequisitesWindow()}
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
      </div>

      {/* 버전 */}
      <div className="model-selection-version">v{__APP_VERSION__}</div>

    </div>
  )
}
