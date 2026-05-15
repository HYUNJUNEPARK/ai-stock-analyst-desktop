export type Status = 'streaming' | 'done' | 'error' | 'cancelled'
export type AgentStatus = 'idle' | 'running' | 'done'
export type PreviewModel = 'gpt' | 'claude'

export type ResponseLocationState = {
  previewOnly?: boolean
  model?: PreviewModel
  prompt?: string
} | null

export type AgentConfig = {
  key: string
  label: string
}
