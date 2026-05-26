import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import ClaudeAuthPage from './ClaudeAuthPage'
import GptAuthPage from './GptAuthPage'

export default function AuthPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel } = useApp()

  useEffect(() => {
    console.log('[Page] AuthPage 렌더링')
  }, [])

  // 모델이 선택되지 않은 상태로 직접 접근하면 홈으로 리다이렉트
  useEffect(() => {
    if (!selectedModel) navigate('/')
  }, [])

  if (selectedModel === 'claude') return <ClaudeAuthPage />
  if (selectedModel === 'gpt') return <GptAuthPage />
  return <></>
}
