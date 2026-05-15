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

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
