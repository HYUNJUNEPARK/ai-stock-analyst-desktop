import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../../routes'

type CliStatus = 'idle' | 'running' | 'done'

interface UseClaudeLoginReturn {
  cliStatus: CliStatus
  cliError: string
  handleCliLogin: () => void
}

export function useClaudeLogin(): UseClaudeLoginReturn {
  const navigate = useNavigate()
  const [cliStatus, setCliStatus] = useState<CliStatus>('idle')
  const [cliError, setCliError] = useState('')

  function handleCliLogin(): void {
    setCliStatus('running')
    setCliError('')

    window.api.onCliLoginComplete((result: { success: boolean; error?: string }) => {
      if (result.success) {
        setCliStatus('done')
        setTimeout(() => navigate(ROUTES.PROMPT), 800)
        return
      }

      setCliStatus('idle')
      setCliError(result.error ?? 'Claude CLI 로그인에 실패했습니다.')
    })

    window.api.runClaudeLogin()
  }

  return { cliStatus, cliError, handleCliLogin }
}
