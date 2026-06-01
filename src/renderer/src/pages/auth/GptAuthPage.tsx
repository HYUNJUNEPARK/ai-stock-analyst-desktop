import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { gptIcon as gptImg } from '../../assets'
import PageFooter from '../../components/PageFooter'
import NavBar from '../../components/NavBar'
import { ROUTES } from '../../routes'
import { useGptLogin } from './hooks/useGptLogin'

export default function GptAuthPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { cliStatus, cliError, handleCliLogin } = useGptLogin()

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Page] GptAuthPage 렌더링')
  }, [])

  return (
    <div className="page">
      <NavBar onBack={() => navigate(ROUTES.ROOT)} />

      <div className="page-content">
        <div className="content-container">
          <div style={{ textAlign: 'center', paddingTop: 220, paddingBottom: 32 }}>
            <img
              src={gptImg}
              alt="Codex"
              style={{ width: 58, height: 58, borderRadius: 10, objectFit: 'cover', marginBottom: 16 }}
            />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 8 }}>
              Codex 인증
            </h1>
            <div style={{ display: 'inline-block', textAlign: 'left' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                브라우저가 열리면 ChatGPT 계정으로 Codex에 로그인해 주세요.
              </p>
              {cliError && <div className="error-banner">⚠ {cliError}</div>}

              {cliStatus === 'done' && (
                <div
                  style={{
                    paddingRight: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--success)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 500
                  }}
                >
                  ✓ Codex 로그인 성공
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PageFooter>
        <button className="btn-primary" onClick={handleCliLogin} disabled={cliStatus !== 'idle'}>
          {cliStatus === 'running' && (
            <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          )}
          {cliStatus === 'idle' && '시작하기'}
          {cliStatus === 'running' && '로그인 진행 중...'}
          {cliStatus === 'done' && '✓ 로그인 완료'}
        </button>
      </PageFooter>
    </div>
  )
}
