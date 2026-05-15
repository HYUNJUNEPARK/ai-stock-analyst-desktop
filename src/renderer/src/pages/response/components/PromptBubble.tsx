type PromptBubbleProps = {
  prompt: string
}

export default function PromptBubble({ prompt }: PromptBubbleProps): React.JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
      <div
        style={{
          maxWidth: '80%',
          background: 'var(--accent)',
          color: '#fff',
          borderRadius: '18px 18px 4px 18px',
          padding: '12px 16px',
          fontSize: 'var(--text-base)',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          userSelect: 'text'
        }}
      >
        {prompt}
      </div>
    </div>
  )
}
