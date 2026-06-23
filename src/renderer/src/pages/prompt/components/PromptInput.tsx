import { useState, useRef, useEffect, useCallback } from 'react'
import { FiSearch, FiX, FiArrowUp } from 'react-icons/fi'

type StockSymbol = {
  ticker: string
  name: string
  market: string
}

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  market?: string
}

/** 자동완성 검색 디바운스 시간 (ms) */
const DEBOUNCE_MS = 200
/** 자동완성 결과 최대 표시 개수 */
const MAX_RESULTS = 6
/** 자동완성이 작동하는 최소 입력 글자 수 */
const MIN_QUERY_LENGTH = 1

export default function PromptInput({ value, onChange, onSubmit, market = 'auto' }: Props): React.JSX.Element {
  const [suggestions, setSuggestions] = useState<StockSymbol[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  /** 자동완성 항목 선택으로 인한 onChange를 구분하기 위한 플래그 */
  const skipSearchRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const searchSymbols = useCallback(async (query: string) => {
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const results = await window.api.searchStockSymbols(query, MAX_RESULTS, market)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
      setActiveIndex(-1)
    } catch {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [market])

  /** 입력값이 바뀔 때 디바운스로 검색 실행 */
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      searchSymbols(value.trim())
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, market, searchSymbols])

  /** 외부 클릭 시 드롭다운 닫기 */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectSymbol(symbol: StockSymbol): void {
    skipSearchRef.current = true
    onChange(symbol.name)
    setShowSuggestions(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        return
      }
      if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        selectSymbol(suggestions[activeIndex])
        return
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        setActiveIndex(-1)
        return
      }
    }

    if (e.key === 'Enter' && value.trim()) {
      setShowSuggestions(false)
      onSubmit()
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
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
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={market === 'us' ? '종목명 입력  예) Apple, TSLA' : '종목명 입력  예) 삼성전자'}
          aria-label="종목명 입력"
          autoComplete="off"
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
            onClick={() => {
              onChange('')
              setSuggestions([])
              setShowSuggestions(false)
            }}
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
          onClick={() => {
            setShowSuggestions(false)
            onSubmit()
          }}
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

      {/* 자동완성 드롭다운 */}
      {showSuggestions && suggestions.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: 56,
            left: 0,
            right: 0,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            padding: '6px 0',
            margin: 0,
            listStyle: 'none',
            zIndex: 100,
            maxHeight: 300,
            overflowY: 'auto'
          }}
        >
          {suggestions.map((symbol, index) => (
            <li
              key={symbol.ticker}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => selectSymbol(symbol)}
              onMouseEnter={() => setActiveIndex(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 18px',
                cursor: 'pointer',
                background: index === activeIndex ? 'var(--bg-tertiary)' : 'transparent',
                transition: 'background 0.1s'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--text-primary)'
                  }}
                >
                  {symbol.name}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-tertiary)'
                  }}
                >
                  {symbol.ticker}
                </span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-tertiary)',
                  padding: '2px 8px',
                  borderRadius: 8,
                  fontWeight: 500,
                  flexShrink: 0
                }}
              >
                {symbol.market}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
