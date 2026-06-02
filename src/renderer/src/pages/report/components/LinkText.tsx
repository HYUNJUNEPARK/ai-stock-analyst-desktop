import type { ReactNode } from 'react'

/**
 * 텍스트 내 URL을 감지해 클릭 가능한 링크로 렌더링한다.
 * 마크다운 링크 [text](url)와 날 URL을 모두 지원한다.
 */
export default function LinkText({ children }: { children: string }): ReactNode {
  if (!children) return null
  const parts = children.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\)|https?:\/\/[^\s)>]+)/g)
  return parts.map((part, i) => {
    const mdLink = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
    if (mdLink) {
      return (
        <a
          key={i}
          href="#"
          onClick={(e) => { e.preventDefault(); window.api.openExternalUrl(mdLink[2]) }}
          style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          {mdLink[1]}
        </a>
      )
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href="#"
          onClick={(e) => { e.preventDefault(); window.api.openExternalUrl(part) }}
          style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', wordBreak: 'break-all' }}
        >
          {part}
        </a>
      )
    }
    return part
  })
}
