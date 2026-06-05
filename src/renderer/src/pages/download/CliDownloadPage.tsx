import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import PageFooter from '../../components/PageFooter'
import InstallingState from './InstallingState'
import SuccessState from './SuccessState'
import ErrorState from './ErrorState'
import { ROUTES } from '../../routes'

type Status = 'installing' | 'success' | 'error'

export default function CliDownloadPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { selectedModel } = useApp()
  const [status, setStatus] = useState<Status>('installing')
  const [logs, setLogs] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [showLogs, setShowLogs] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Page] CliDownloadPage 렌더링')
  }, [])

  // [selectedModel, navigate] : selectedModel을 가드 조건과 startCliInstall 인수로
  // 직접 사용한다. 빈 배열([])이면 마운트 시 selectedModel이 아직 null인 경우
  // 가드를 통과하지 못하고, 이후 값이 채워져도 effect가 재실행되지 않아
  // 설치가 시작되지 않는 버그가 발생한다.
  useEffect(() => {
    // 모델이 선택되지 않은 상태로 직접 접근하면 홈으로 리다이렉트
    if (!selectedModel) {
      navigate(ROUTES.ROOT)
      return
    }

    // 설치 로그 수신 시마다 터미널에 추가하고 자동 스크롤
    window.api.onInstallProgress((data: string) => {
      setLogs((prev) => [...prev, data])
      setTimeout(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight
        }
      }, 0)
    })

    // 설치 완료 이벤트: 성공/실패 여부에 따라 상태를 전환
    window.api.onInstallComplete((result: { success: boolean; error?: string }) => {
      if (result.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(result.error ?? '알 수 없는 오류가 발생했습니다.')
      }
    })

    // CLI 설치 시작
    window.api.startCliInstall(selectedModel)
  }, [selectedModel, navigate])

  const modelLabel = selectedModel === 'gpt' ? 'GPT' : 'Claude'
  const command =
    selectedModel === 'claude'
      ? 'npm install -g @anthropic-ai/claude-code'
      : 'npm install -g @openai/codex'

  function handleRetry(): void {
    setStatus('installing')
    setLogs([])
    setErrorMsg('')
    window.api.startCliInstall(selectedModel!)
  }

  return (
    <div className="page">
      <div
        className="page-content"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="content-container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          {status === 'installing' && (
            <InstallingState logs={logs} command={command} logRef={logRef} />
          )}
          {status === 'success' && (
            <SuccessState
              modelLabel={modelLabel}
              logs={logs}
              showLogs={showLogs}
              setShowLogs={setShowLogs}
              logRef={logRef}
            />
          )}
          {status === 'error' && <ErrorState errorMsg={errorMsg} logs={logs} />}
        </div>
      </div>

      {status === 'success' && (
        <PageFooter>
          <button className="btn-primary" onClick={() => navigate(ROUTES.AUTH)}>
            로그인 하기
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6,3 12,9 6,15" />
            </svg>
          </button>
        </PageFooter>
      )}

      {status === 'error' && (
        <PageFooter>
          <button className="btn-primary danger" onClick={handleRetry}>
            다시 시도
          </button>
          <button className="btn-ghost btn-gap" onClick={() => navigate(ROUTES.ROOT)}>
            모델 다시 선택
          </button>
        </PageFooter>
      )}
    </div>
  )
}
