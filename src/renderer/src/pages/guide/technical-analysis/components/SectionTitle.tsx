/**
 * 가이드 섹션 제목 컴포넌트
 */
export function SectionTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
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
      {children}
    </div>
  )
}
