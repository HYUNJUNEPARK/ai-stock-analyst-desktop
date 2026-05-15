export default function PageFooter({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="page-footer">
      <div className="content-container">
        {children}
      </div>
    </div>
  )
}
