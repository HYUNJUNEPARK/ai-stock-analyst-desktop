import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import NavBar from '../../../../components/NavBar'
import data from '../../../../data/technical-analysis-terms.json'
import { SectionTitle } from '../components/SectionTitle'
import { TermCard } from './TermCard'
import { TrendSection } from './TrendSection'

export default function TechnicalAnalysisCategoryPage(): React.JSX.Element {
  const { categoryId } = useParams<{ categoryId: string }>()
  const [searchParams] = useSearchParams()
  const isWindow = searchParams.get('mode') === 'window'
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const category = data.categories.find((c) => c.id === categoryId)

  function toggle(id: string): void {
    // 추세 분석은 항상 펼침이므로 다른 카테고리만 토글
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!category) {
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
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 14
          }}
        >
          카테고리를 찾을 수 없습니다.
        </div>
      </div>
    )
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
        title={category.name}
      />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 48px' }}>
          {/* 카테고리 설명 */}
          <div style={{ marginBottom: 20 }}>
            <SectionTitle>{category.name}</SectionTitle>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.6
              }}
            >
              {category.description}
            </p>
          </div>

          {/* 카테고리별 콘텐츠 */}
          {category.id === 'trend' ? (
            <TrendSection category={category} />
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {category.terms.map((term) => (
                <TermCard
                  key={term.id}
                  term={term}
                  expanded={expandedIds.has(term.id)}
                  onToggle={() => toggle(term.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
