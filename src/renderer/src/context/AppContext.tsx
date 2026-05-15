import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type Model = 'gpt' | 'claude' | null

interface AppContextValue {
  selectedModel: Model
  setSelectedModel: (model: Model) => void
  apiKey: string
  setApiKey: (key: string) => void
  currentPrompt: string
  setCurrentPrompt: (prompt: string) => void
  lastResponse: string
  setLastResponse: (response: string) => void
}

// 초기값을 null로 설정해 Provider 외부에서 사용 시 오류를 감지할 수 있게 한다
const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [selectedModel, setSelectedModel] = useState<Model>(null)
  const [apiKey, setApiKey] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [lastResponse, setLastResponse] = useState('')

  return (
    <AppContext.Provider
      value={{
        selectedModel,
        setSelectedModel,
        apiKey,
        setApiKey,
        currentPrompt,
        setCurrentPrompt,
        lastResponse,
        setLastResponse
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// AppContext 접근 훅 — Provider 외부에서 호출하면 즉시 에러를 던져 잘못된 사용을 방지
// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
