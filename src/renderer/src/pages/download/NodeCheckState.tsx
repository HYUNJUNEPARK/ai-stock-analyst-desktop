import { useEffect, useRef, useState } from 'react'
import { FiDownload, FiCheckCircle, FiX } from 'react-icons/fi'

type NodeInstallStatus = 'idle' | 'downloading' | 'success' | 'error'

export default function NodeCheckState({
  onNodeReady
}: {
  onNodeReady: () => void
}): React.JSX.Element {
  const [installStatus, setInstallStatus] = useState<NodeInstallStatus>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.api.onNodeInstallProgress((data: string) => {
      setLogs((prev) => [...prev, data])
      setTimeout(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight
        }
      }, 0)
    })

    window.api.onNodeInstallComplete((result: { success: boolean; error?: string }) => {
      if (result.success) {
        setInstallStatus('success')
        // 설치 후 잠시 대기 후 Node.js 사용 가능 상태로 전환
        setTimeout(() => onNodeReady(), 1500)
      } else {
        setInstallStatus('error')
        setErrorMsg(result.error ?? '알 수 없는 오류가 발생했습니다.')
      }
    })
  }, [onNodeReady])

  function handleAutoInstall(): void {
    setInstallStatus('downloading')
    setLogs([])
    setErrorMsg('')
    window.api.installNode()
  }

  function handleManualInstall(): void {
    void window.api.openExternalUrl('https://nodejs.org')
  }

  async function handleRecheck(): Promise<void> {
    const status = await window.api.checkNodeStatus()
    if (status.nodeInstalled && status.npmInstalled) {
      onNodeReady()
    } else {
      setErrorMsg('Node.js가 아직 설치되지 않았습니다. 설치 후 다시 확인해 주세요.')
      setInstallStatus('error')
    }
  }

  // 설치 진행 중
  if (installStatus === 'downloading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div className="spinner-lg" style={{ marginBottom: 20 }} />
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 8
          }}
        >
          Node.js 설치 중
        </h2>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            marginBottom: 24
          }}
        >
          설치 프로그램이 표시되면 안내에 따라 진행해 주세요
        </p>

        <div
          ref={logRef}
          className="terminal"
          role="log"
          aria-live="polite"
          style={{ width: '100%', height: 100 }}
        >
          {logs.length === 0 ? (
            <span className="terminal-line dim">준비 중...</span>
          ) : (
            logs.map((line, i) => (
              <div key={i} className="terminal-line">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // 설치 성공
  if (installStatus === 'success') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div className="status-icon success" style={{ marginBottom: 20 }} aria-label="설치 완료">
          <FiCheckCircle />
        </div>
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 8
          }}
        >
          Node.js 설치 완료
        </h2>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            textAlign: 'center'
          }}
        >
          CLI 설치를 시작합니다...
        </p>
      </div>
    )
  }

  // 설치 에러
  if (installStatus === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div className="status-icon error" style={{ marginBottom: 20 }} aria-label="설치 실패">
          <FiX />
        </div>
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 8
          }}
        >
          Node.js 설치 실패
        </h2>

        <div
          style={{
            width: '100%',
            background: 'rgba(255,59,48,0.08)',
            borderLeft: '3px solid var(--danger)',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 'var(--text-sm)',
            color: 'var(--danger)',
            lineHeight: 1.5,
            marginBottom: 20,
            wordBreak: 'break-word'
          }}
        >
          {errorMsg}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%', maxWidth: 320, margin: '0 auto' }}>
          <button className="btn-primary" onClick={handleAutoInstall} style={{ flex: 1 }}>
            다시 시도
          </button>
          <button className="btn-ghost" onClick={handleManualInstall} style={{ flex: 1 }}>
            수동 설치
          </button>
        </div>

        <button
          onClick={() => void handleRecheck()}
          style={{
            marginTop: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            fontFamily: 'inherit',
            textDecoration: 'underline'
          }}
        >
          이미 설치했다면 여기를 클릭하세요
        </button>
      </div>
    )
  }

  // 기본: Node.js 미설치 안내
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'var(--accent-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}
      >
        <FiDownload size={26} color="var(--accent)" />
      </div>

      <h2
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 8
        }}
      >
        Node.js 설치 필요
      </h2>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: 24,
          maxWidth: 340
        }}
      >
        AI CLI 도구를 설치하려면 Node.js가 필요합니다.
        <br />
        아래 버튼을 눌러 자동으로 설치하거나,
        <br />
        직접 설치할 수 있습니다.
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          width: '100%',
          maxWidth: 300
        }}
      >
        <button className="btn-primary" onClick={handleAutoInstall}>
          Node.js 자동 설치
        </button>
        <button className="btn-ghost" onClick={handleManualInstall}>
          nodejs.org에서 직접 설치
        </button>
      </div>

      <button
        onClick={() => void handleRecheck()}
        style={{
          marginTop: 16,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          fontFamily: 'inherit',
          textDecoration: 'underline'
        }}
      >
        이미 설치했다면 여기를 클릭하세요
      </button>
    </div>
  )
}
