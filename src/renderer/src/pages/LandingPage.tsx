import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function LandingPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel } = useApp()

  useEffect(() => {
    if (!selectedModel) {
      navigate('/')
      return
    }

    window.api.checkCliStatus(selectedModel).then((result) => {
      if (!result.cliInstalled) {
        navigate('/download')
      } else if (result.authenticated) {
        navigate('/prompt')
      } else {
        navigate('/auth')
      }
    })
  }, [])

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
