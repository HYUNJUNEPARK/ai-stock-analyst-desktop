import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import ClaudeAuthPage from './ClaudeAuthPage'
import GptAuthPage from './GptAuthPage'

export default function AuthPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel } = useApp()

  useEffect(() => {
    if (!selectedModel) navigate('/')
  }, [])

  if (selectedModel === 'claude') return <ClaudeAuthPage />
  if (selectedModel === 'gpt') return <GptAuthPage />
  return <></>
}
