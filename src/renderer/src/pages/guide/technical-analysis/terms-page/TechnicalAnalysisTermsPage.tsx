import { useSearchParams } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import NavBar from '../../../../components/NavBar'
import data from '../../../../data/technical-analysis-terms.json'

const categoryNumbers: Record<string, number> = {
  trend: 1,
  momentum: 2,
  volatility: 3,
  volume: 4,
  supportResistance: 5,
  pricePosition: 6,
  chartPattern: 7,
  technicalSummary: 8
}

export default function TechnicalAnalysisTermsPage(): React.JSX.Element {
  const [searchParams] = useSearchParams()
  const isWindow = searchParams.get('mode') === 'window'

  function openCategory(categoryId: string): void {
    void window.api.openGuideWindow(`technical-analysis/${categoryId}`)
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <NavBar
        onBack={() => window.close()}
        backLabel={isWindow ? '닫기' : '뒤로'}
        title="기술적 분석 용어 사전"
      />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 48px' }}>
          {/* 설명 */}
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.6
              }}
            >
              {data.description}
            </p>
          </div>

          {/* 카테고리 탭 목록 */}
          <div style={{ display: 'grid', gap: 8 }}>
            {data.categories.map((category) => (
              <div
                key={category.id}
                role="button"
                tabIndex={0}
                onClick={() => openCategory(category.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openCategory(category.id)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 18px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                {/* 번호 */}
                <span
                  style={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                    borderRadius: 10
                  }}
                >
                  {categoryNumbers[category.id] ?? 0}
                </span>

                {/* 텍스트 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 2
                    }}
                  >
                    {category.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-tertiary)',
                      lineHeight: 1.4
                    }}
                  >
                    {category.description}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                      marginTop: 6
                    }}
                  >
                    {category.terms.map((t) => (
                      <span
                        key={t.id}
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--accent)',
                          background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                          padding: '2px 8px',
                          borderRadius: 6,
                          lineHeight: 1.5
                        }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 화살표 */}
                <FiChevronRight
                  style={{
                    flexShrink: 0,
                    fontSize: 18,
                    color: 'var(--text-tertiary)'
                  }}
                />
              </div>
            ))}
          </div>

          {/* 보고서 읽는 순서 */}
          <div style={{ marginTop: 32 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 10
              }}
            >
              {data.readingGuide.title}
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {data.readingGuide.steps.map((step) => (
                <div
                  key={step.step}
                  style={{
                    display: 'flex',
                    gap: 12,
                    fontSize: 12,
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--accent)',
                      color: '#fff',
                      borderRadius: '50%',
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    {step.step}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {step.action}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {step.purpose}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 면책조항 */}
          <div
            style={{
              marginTop: 20,
              fontSize: 11,
              color: 'var(--text-tertiary)',
              lineHeight: 1.6,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '12px 14px'
            }}
          >
            {data.readingGuide.disclaimer}
          </div>
        </div>
      </div>
    </div>
  )
}
