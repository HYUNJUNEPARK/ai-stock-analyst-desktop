/**
 * 가이드 필드 라벨 컴포넌트
 */
export function Label({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 2 }}>
      {children}
    </div>
  )
}
