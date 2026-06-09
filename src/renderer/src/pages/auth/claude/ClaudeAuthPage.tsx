import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { claudeIcon as claudeImg } from '../../../assets'
import NavBar from '../../../components/NavBar'
import { ROUTES } from '../../../routes'
import { useClaudeLogin } from './useClaudeLogin'
import './ClaudeAuthPage.css'

export default function ClaudeAuthPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { cliStatus, cliError, handleCliLogin } = useClaudeLogin()

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Page] ClaudeAuthPage 렌더링')
  }, [])

  return (
    <div className="page">
      <NavBar onBack={() => navigate(ROUTES.ROOT)} />

      <div className="page-content">
        <div className="claude-auth">
          {/* 아이콘 */}
          <div className="claude-auth-icon-wrap">
            <img src={claudeImg} alt="Claude" className="claude-auth-icon" />
          </div>

          {/* 헤더 텍스트 */}
          <h1 className="claude-auth-title">Claude 인증</h1>
          <p className="claude-auth-desc">
            브라우저가 열리면 Anthropic 계정으로
            <br />
            Claude에 로그인해 주세요.
          </p>

          {/* 안내 카드 */}
          <div className="claude-auth-info-card">
            <div className="claude-auth-info-row">
              <span className="claude-auth-info-step">1</span>
              <span className="claude-auth-info-text">아래 버튼을 눌러 로그인을 시작합니다</span>
            </div>
            <div className="claude-auth-info-row">
              <span className="claude-auth-info-step">2</span>
              <span className="claude-auth-info-text">브라우저에서 Anthropic 계정으로 인증합니다</span>
            </div>
            <div className="claude-auth-info-row">
              <span className="claude-auth-info-step">3</span>
              <span className="claude-auth-info-text">인증이 완료되면 자동으로 이동합니다</span>
            </div>
          </div>

          {/* 에러 */}
          {cliError && (
            <div className="claude-auth-error">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4.5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {cliError}
            </div>
          )}

          {/* 성공 */}
          {cliStatus === 'done' && (
            <div className="claude-auth-success">
              <div className="claude-auth-success-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M5 10.5l3.5 3.5L15 7"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              로그인 성공
            </div>
          )}

          {/* CTA 버튼 */}
          <button
            className="claude-auth-btn"
            onClick={handleCliLogin}
            disabled={cliStatus !== 'idle'}
            data-status={cliStatus}
          >
            {cliStatus === 'running' && <span className="claude-auth-btn-spinner" />}
            {cliStatus === 'idle' && '시작하기'}
            {cliStatus === 'running' && '로그인 진행 중...'}
            {cliStatus === 'done' && '완료'}
          </button>
        </div>
      </div>
    </div>
  )
}
