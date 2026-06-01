import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../../routes'

// GPT(Codex) CLI 로그인 상태
type CliStatus = 'idle' | 'running' | 'done'

interface UseGptLoginReturn {
  cliStatus: CliStatus
  cliError: string
  handleCliLogin: () => void
}

// GPT(Codex) CLI 로그인 흐름을 관리하는 훅.
// IPC를 통해 main 프로세스에 로그인을 요청하고, 결과에 따라 상태를 갱신한다.
export function useGptLogin(): UseGptLoginReturn {
  const navigate = useNavigate()
  const [cliStatus, setCliStatus] = useState<CliStatus>('idle')
  const [cliError, setCliError] = useState('')

  function handleCliLogin(): void {
    setCliStatus('running')
    setCliError('')

    // 로그인 완료 이벤트 수신 — 성공 시 프롬프트 페이지로 이동, 실패 시 에러 메시지 표시
    window.api.onCliLoginComplete((result: { success: boolean; error?: string }) => {
      if (result.success) {
        setCliStatus('done')
        setTimeout(() => navigate(ROUTES.PROMPT), 1000)
        return
      }

      setCliStatus('idle')
      setCliError(result.error ?? '로그인에 실패했습니다.')
    })

    // main 프로세스에 GPT CLI 로그인 실행 요청
    window.api.runGptLogin()
  }

  return { cliStatus, cliError, handleCliLogin }
}
