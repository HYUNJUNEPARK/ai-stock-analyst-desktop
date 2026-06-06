import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import PageFooter from '../../components/PageFooter'
import InstallingState from './InstallingState'
import SuccessState from './SuccessState'
import ErrorState from './ErrorState'
import { ROUTES } from '../../routes'

type Status = 'installing' | 'success' | 'error'
type DownloadPreviewState = {
  previewOnly?: boolean
  previewStatus?: 'install-error'
}

const DEV_PREVIEW_INSTALL_ERROR =
  '개발용 미리보기: npm install 프로세스가 exit code 1로 종료되었습니다.'
const DEV_PREVIEW_INSTALL_LOGS = [
  '> npm install --prefix ~/.ai-cli-launcher @openai/codex',
  'npm ERR! code EACCES',
  'npm ERR! syscall mkdir',
  'npm ERR! path ~/.ai-cli-launcher/node_modules',
  'npm ERR! 권한 문제로 CLI 패키지를 설치하지 못했습니다.'
]

export default function CliDownloadPage(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedModel } = useApp()
  const previewState = location.state as DownloadPreviewState | null
  const isInstallFailurePreview =
    import.meta.env.DEV &&
    previewState?.previewOnly === true &&
    previewState.previewStatus === 'install-error'
  const [status, setStatus] = useState<Status>(isInstallFailurePreview ? 'error' : 'installing')
  const [logs, setLogs] = useState<string[]>(
    isInstallFailurePreview ? DEV_PREVIEW_INSTALL_LOGS : []
  )
  const [errorMsg, setErrorMsg] = useState(isInstallFailurePreview ? DEV_PREVIEW_INSTALL_ERROR : '')
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

    if (isInstallFailurePreview) return

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
  }, [selectedModel, navigate, isInstallFailurePreview])

  const modelLabel = selectedModel === 'gpt' ? 'GPT' : 'Claude'
  const command =
    selectedModel === 'claude'
      ? 'npm install -g @anthropic-ai/claude-code'
      : 'npm install -g @openai/codex'

  function handleRetry(): void {
    if (isInstallFailurePreview) {
      setStatus('error')
      setLogs(DEV_PREVIEW_INSTALL_LOGS)
      setErrorMsg(DEV_PREVIEW_INSTALL_ERROR)
      return
    }

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
