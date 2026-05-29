import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { ROUTES } from '../../routes'

export default function LandingPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel } = useApp()

  useEffect(() => {
    console.log('[Page] LandingPage 렌더링')
  }, [])

  // [selectedModel, navigate] : checkCliStatus 호출과 리다이렉트 분기가 모두
  // selectedModel 값에 의존한다. 빈 배열([])이면 마운트 시점의 selectedModel
  // 스냅샷만 사용하는 클로저가 생성되어, 이후 값이 바뀌어도 이전 값으로
  // API 호출이 실행되는 스테일 클로저(stale closure) 버그가 발생한다.
  useEffect(() => {
    if (!selectedModel) {
      navigate(ROUTES.ROOT)
      return
    }

    window.api.checkCliStatus(selectedModel).then((result) => {
      if (!result.cliInstalled) {
        navigate(ROUTES.DOWNLOAD)
      } else if (result.authenticated) {
        navigate(ROUTES.PROMPT)
      } else {
        navigate(ROUTES.AUTH)
      }
    })
  }, [selectedModel, navigate])

  return (
    <div
      className="page"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>확인 중...</p>
      </div>
    </div>
  )
}
