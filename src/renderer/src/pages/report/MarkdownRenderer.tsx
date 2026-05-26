import { useState } from 'react'
import type { ReactNode } from 'react'

type MarkdownRendererProps = {
  text: string
  isStreaming: boolean
}

export default function MarkdownRenderer({
  text,
  isStreaming
}: MarkdownRendererProps): React.JSX.Element {
  const lines = text.split('\n')
  const elements: React.JSX.Element[] = []
  let codeBlock: string[] = []
  let codeLang = ''
  let inCode = false
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLang = line.slice(3).trim()
        codeBlock = []
      } else {
        elements.push(<CodeBlock key={key++} lang={codeLang} code={codeBlock.join('\n')} />)
        inCode = false
        codeBlock = []
        codeLang = ''
      }
      continue
    }

    if (inCode) {
      codeBlock.push(line)
      continue
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={key++}
          style={{
            fontSize: 15,
            fontWeight: 600,
            margin: '12px 0 6px',
            color: 'var(--text-primary)'
          }}
        >
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={key++}
          style={{
            fontSize: 17,
            fontWeight: 600,
            margin: '16px 0 8px',
            color: 'var(--text-primary)'
          }}
        >
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={key++}
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: '20px 0 10px',
            color: 'var(--text-primary)'
          }}
        >
          {line.slice(2)}
        </h1>
      )
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={key++}
          style={{
            borderLeft: '3px solid var(--accent)',
            margin: '0 0 12px',
            padding: '4px 0 4px 14px',
            color: 'var(--text-secondary)',
            fontStyle: 'italic'
          }}
        >
          {line.slice(2)}
        </blockquote>
      )
    } else if (line.match(/^[-*]\s/)) {
      elements.push(
        <div
          key={key++}
          style={{
            paddingLeft: 16,
            marginBottom: 4,
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)'
          }}
        >
          • {renderInline(line.slice(2))}
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={key++} style={{ height: 8 }} />)
    } else {
      elements.push(
        <p
          key={key++}
          style={{
            marginBottom: 12,
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            lineHeight: 1.7
          }}
        >
          {renderInline(line)}
        </p>
      )
    }
  }

  if (inCode && codeBlock.length > 0) {
    elements.push(<CodeBlock key={key++} lang={codeLang} code={codeBlock.join('\n')} />)
  }

  return (
    <div className="markdown-body" style={{ userSelect: 'text' }}>
      {elements}
      {isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
    </div>
  )
}

// 코드 블록(```lang ... ```)을 렌더링하는 컴포넌트. 언어 레이블과 클립보드 복사 버튼을 포함한다.
function CodeBlock({ lang, code }: { lang: string; code: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  function handleCopy(): void {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-lang">{lang || 'code'}</span>
        <button className="code-copy-btn" onClick={handleCopy}>
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
      <div className="code-body">{code}</div>
    </div>
  )
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 4,
            padding: '2px 6px',
            fontFamily: "'SF Mono', 'Menlo', monospace",
            fontSize: 13,
            color: '#D73A49',
            userSelect: 'text'
          }}
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
