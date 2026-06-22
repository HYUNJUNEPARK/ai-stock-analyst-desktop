/**
 * 정보 박스 컴포넌트 (비유, 예시 등)
 */
import { Label } from '../components/Label'

export function InfoBox({
  label,
  content
}: {
  label: string
  content: string
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          margin: '6px 0 0',
          lineHeight: 1.6,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '8px 10px'
        }}
      >
        {content}
      </p>
    </div>
  )
}
