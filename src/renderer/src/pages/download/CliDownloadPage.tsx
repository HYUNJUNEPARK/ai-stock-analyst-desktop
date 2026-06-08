import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import PageFooter from '../../components/PageFooter'
import NodeCheckState from './NodeCheckState'
import InstallingState from './InstallingState'
import SuccessState from './SuccessState'
import ErrorState from './ErrorState'
import { ROUTES } from '../../routes'

type Status = 'checking-node' | 'node-missing' | 'installing' | 'success' | 'error'
type DownloadPreviewState = {
  previewOnly?: boolean
  previewStatus?: 'install-error'
}

const DEV_PREVIEW_INSTALL_ERROR = '개발용 미리보기: npm install 프로세스가 exit code 1로 종료되었습니다.'
const DEV_PREVIEW_INSTALL_LOGS = [
  '> npm install --prefix ~/.ai-cli-launcher @openai/codex',
  'npm info using npm@10.9.0',
  'npm info using node@v22.19.1',
  'npm http fetch GET 200 https://registry.npmjs.org/@openai%2fcodex 236ms',
  'npm http fetch GET 200 https://registry.npmjs.org/@electron%2fget 144ms',
  'npm http fetch GET 200 https://registry.npmjs.org/debug 118ms',
  'npm WARN deprecated sample-package@1.0.0: 개발용 미리보기 경고입니다.',
  'npm timing idealTree:init Completed in 42ms',
  'npm timing idealTree:userRequests Completed in 18ms',
  'npm timing idealTree:buildDeps Completed in 328ms',
  'npm timing reify:loadTrees Completed in 411ms',
  'npm timing reify:diffTrees Completed in 25ms',
  'npm timing reify:retireShallow Completed in 2ms',
  'npm timing reify:createSparse Completed in 36ms',
  'npm timing reify:loadBundles Completed in 0ms',
  'npm ERR! code EACCES',
  'npm ERR! syscall mkdir',
  'npm ERR! path ~/.ai-cli-launcher/node_modules',
  'npm ERR! errno -13',
  'npm ERR! Error: EACCES: permission denied, mkdir ~/.ai-cli-launcher/node_modules',
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
  const [status, setStatus] = useState<Status>(
    isInstallFailurePreview ? 'error' : 'checking-node'
  )
  const [logs, setLogs] = useState<string[]>(
    isInstallFailurePreview ? DEV_PREVIEW_INSTALL_LOGS : []
  )
  const [errorMsg, setErrorMsg] = useState(isInstallFailurePreview ? DEV_PREVIEW_INSTALL_ERROR : '')
  const [showLogs, setShowLogs] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const cliInstallStarted = useRef(false)

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[Page] CliDownloadPage 렌더링')
  }, [])

  /** Node.js 확인 완료 후 CLI 설치를 시작한다 */
  const startCliInstall = useCallback(() => {
    if (!selectedModel || cliInstallStarted.current) return
    cliInstallStarted.current = true

    setStatus('installing')

    window.api.onInstallProgress((data: string) => {
      setLogs((prev) => [...prev, data])
      setTimeout(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight
        }
      }, 0)
    })

    window.api.onInstallComplete((result: { success: boolean; error?: string }) => {
      if (result.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(result.error ?? '알 수 없는 오류가 발생했습니다.')
      }
    })

    window.api.startCliInstall(selectedModel)
  }, [selectedModel])

  /** Node.js 설치가 확인되면 CLI 설치로 넘어간다 */
  const handleNodeReady = useCallback(() => {
    startCliInstall()
  }, [startCliInstall])

  // 마운트 시 Node.js 설치 여부를 먼저 확인한다
  useEffect(() => {
    if (!selectedModel) {
      navigate(ROUTES.ROOT)
      return
    }

    if (isInstallFailurePreview) return

    window.api.checkNodeStatus().then((nodeStatus) => {
      if (nodeStatus.nodeInstalled && nodeStatus.npmInstalled) {
        // Node.js가 이미 설치되어 있으면 바로 CLI 설치 진행
        startCliInstall()
      } else {
        setStatus('node-missing')
      }
    })
  }, [selectedModel, navigate, isInstallFailurePreview, startCliInstall])

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

    cliInstallStarted.current = false
    setStatus('installing')
    setLogs([])
    setErrorMsg('')
    startCliInstall()
  }

  return (
    <div className="page">
      <div
        className="page-content"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="content-container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          {status === 'checking-node' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="spinner-lg" style={{ marginBottom: 20 }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Node.js 설치 상태를 확인하고 있습니다...
              </p>
            </div>
          )}
          {status === 'node-missing' && (
            <NodeCheckState onNodeReady={handleNodeReady} />
          )}
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
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              margin: '0 auto',
              display: 'flex',
              gap: 'var(--space-3)'
            }}
          >
            <button className="btn-primary danger" onClick={handleRetry} style={{ flex: 1 }}>
              다시 시도
            </button>
            <button className="btn-ghost" onClick={() => navigate(ROUTES.ROOT)} style={{ flex: 1 }}>
              모델 다시 선택
            </button>
          </div>
        </PageFooter>
      )}
    </div>
  )
}
