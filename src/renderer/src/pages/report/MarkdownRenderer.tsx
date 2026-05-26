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
  let tableLines: string[] = []
  let inTable = false
  let key = 0

  function flushTable(): void {
    if (tableLines.length < 2) {
      tableLines.forEach((l) => {
        elements.push(
          <p key={key++} style={{ marginBottom: 12, color: 'var(--text-primary)', fontSize: 'var(--text-base)', lineHeight: 1.7 }}>
            {renderInline(l)}
          </p>
        )
      })
      tableLines = []
      return
    }
    const header = tableLines[0]
    const body = tableLines.slice(2) // skip separator line
    const headers = header.split('|').map((c) => c.trim()).filter(Boolean)
    elements.push(
      <div key={key++} style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-secondary)',
                    borderBottom: '2px solid var(--border)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {renderInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => {
              const cells = row.split('|').map((c) => c.trim()).filter(Boolean)
              return (
                <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}>
                  {cells.map((cell, ci) => (
                    <td
                      key={ci}
                      style={{
                        padding: '7px 12px',
                        color: 'var(--text-secondary)',
                        verticalAlign: 'top'
                      }}
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
    tableLines = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 코드 블록
    if (line.startsWith('```')) {
      if (inTable) { flushTable(); inTable = false }
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

    // 테이블 감지 (|로 시작하는 라인)
    const isTableLine = line.trim().startsWith('|')
    if (isTableLine) {
      inTable = true
      tableLines.push(line)
      continue
    } else if (inTable) {
      flushTable()
      inTable = false
    }

    // 수평선
    if (/^[-*_]{3,}$/.test(line.trim())) {
      elements.push(
        <hr
          key={key++}
          style={{
            border: 'none',
            borderTop: '1px solid var(--border)',
            margin: '16px 0'
          }}
        />
      )
      continue
    }

    if (line.startsWith('#### ')) {
      elements.push(
        <h4
          key={key++}
          style={{ fontSize: 13, fontWeight: 600, margin: '10px 0 4px', color: 'var(--text-primary)' }}
        >
          {renderInline(line.slice(5))}
        </h4>
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={key++}
          style={{ fontSize: 15, fontWeight: 600, margin: '12px 0 6px', color: 'var(--text-primary)' }}
        >
          {renderInline(line.slice(4))}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={key++}
          style={{ fontSize: 17, fontWeight: 700, margin: '18px 0 8px', color: 'var(--text-primary)' }}
        >
          {renderInline(line.slice(3))}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={key++}
          style={{ fontSize: 20, fontWeight: 700, margin: '20px 0 10px', color: 'var(--text-primary)' }}
        >
          {renderInline(line.slice(2))}
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
          {renderInline(line.slice(2))}
        </blockquote>
      )
    } else if (line.match(/^[-*]\s/)) {
      elements.push(
        <div
          key={key++}
          style={{ paddingLeft: 16, marginBottom: 4, color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}
        >
          • {renderInline(line.slice(2))}
        </div>
      )
    } else if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)$/)
      if (match) {
        elements.push(
          <div
            key={key++}
            style={{ display: 'flex', gap: 6, marginBottom: 4, color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}
          >
            <span style={{ flexShrink: 0, color: 'var(--text-tertiary)', minWidth: 20 }}>{match[1]}.</span>
            <span>{renderInline(match[2])}</span>
          </div>
        )
      }
    } else if (line.trim() === '') {
      elements.push(<div key={key++} style={{ height: 8 }} />)
    } else {
      elements.push(
        <p
          key={key++}
          style={{ marginBottom: 12, color: 'var(--text-primary)', fontSize: 'var(--text-base)', lineHeight: 1.7 }}
        >
          {renderInline(line)}
        </p>
      )
    }
  }

  if (inCode && codeBlock.length > 0) {
    elements.push(<CodeBlock key={key++} lang={codeLang} code={codeBlock.join('\n')} />)
  }
  if (inTable && tableLines.length > 0) {
    flushTable()
  }

  return (
    <div className="markdown-body" style={{ userSelect: 'text' }}>
      {elements}
      {isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
    </div>
  )
}

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
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={i}>{part.slice(1, -1)}</em>
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
