export type Status = 'streaming' | 'done' | 'error' | 'cancelled'
export type AgentStatus = 'idle' | 'running' | 'done'
export type PreviewModel = 'gpt' | 'claude'

export type ResponseLocationState = {
  previewOnly?: boolean
  previewStatus?: Extract<Status, 'streaming' | 'done' | 'error'>
  model?: PreviewModel
  prompt?: string
} | null

export type AgentConfig = {
  key: string
  label: string
}
