import { useState } from 'react'

type CodeBlockProps = {
  lang: string
  code: string
}

export default function CodeBlock({ lang, code }: CodeBlockProps): React.JSX.Element {
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
