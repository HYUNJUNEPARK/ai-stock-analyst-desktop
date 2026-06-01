import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import ClaudeAuthPage from './ClaudeAuthPage'
import GptAuthPage from './GptAuthPage'
import { ROUTES } from '../../routes'

export default function AuthPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel } = useApp()

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Page] AuthPage 렌더링')
  }, [])

  // 모델이 선택되지 않은 상태로 직접 접근하면 홈으로 리다이렉트
  // [selectedModel, navigate] : selectedModel이 변경될 때마다 재실행되어야
  // 빈 배열([])이면 마운트 시 1회만 실행되므로, 이후 selectedModel이 null로
  // 바뀌어도 리다이렉트가 동작하지 않는 버그가 생긴다.
  useEffect(() => {
    if (!selectedModel) navigate(ROUTES.ROOT)
  }, [selectedModel, navigate])

  if (selectedModel === 'claude') return <ClaudeAuthPage />
  if (selectedModel === 'gpt') return <GptAuthPage />
  return <></>
}
