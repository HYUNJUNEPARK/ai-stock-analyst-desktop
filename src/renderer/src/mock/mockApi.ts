/**
 * 목업 API — window.api가 없는 환경(개발/브라우저)에서 주입됩니다.
 * Electron IPC 동작을 시뮬레이션합니다.
 */

const INSTALL_LOGS_GPT = [
  'npm warn deprecated glob@7.2.3',
  'npm warn deprecated inflight@1.0.6',
  'added 12 packages in 1.2s',
  '',
  '> @openai/codex@0.84.0 postinstall',
  '> node ./scripts/postinstall.js',
  '',
  'added 89 packages, and audited 90 packages in 3.4s',
  '13 packages are looking for funding',
  '  run `npm fund` for details',
  '',
  'found 0 vulnerabilities',
  '✓ Codex CLI installed successfully'
]

const INSTALL_LOGS_CLAUDE = [
  'npm warn deprecated glob@7.2.3',
  'npm warn deprecated rimraf@3.0.2',
  '',
  '> @anthropic-ai/claude-code@1.0.3 postinstall',
  '> node scripts/setup.js',
  '',
  'Claude Code CLI setup...',
  'Checking Node.js version... ✓ v22.0.0',
  'Setting up shell integration...',
  'added 1024 packages in 8.2s',
  '',
  '185 packages are looking for funding',
  '  run `npm fund` for details',
  '',
  'found 0 vulnerabilities',
  '✓ Claude Code CLI installed successfully'
]

const CLI_LOGIN_LOGS = [
  '$ cli login',
  'Opening browser for authentication...',
  'Waiting for login to complete...',
  '✓ Authentication successful',
  '✓ Credentials saved to local CLI config'
]

const MOCK_RESPONSE_GPT = `# 안녕하세요! 무엇이든 물어보세요.

저는 OpenAI GPT 모델입니다. 다양한 주제에 대해 도움을 드릴 수 있습니다.

## 제가 도울 수 있는 것들

- **코드 작성 및 디버깅** — TypeScript, Python, Go 등 다양한 언어 지원
- **문서 작성** — 이메일, 보고서, 기술 문서
- **개념 설명** — 복잡한 내용을 쉽게 풀어서 설명

## 예시 코드

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}! How can I help you today?\`
}

const message = greet('Developer')
console.log(message)
\`\`\`

> 더 구체적인 질문을 입력하면 더 정확한 답변을 드릴 수 있습니다.

무엇이든 자유롭게 질문해 주세요!`

const MOCK_RESPONSE_CLAUDE = `# 안녕하세요! Claude입니다.

저는 Anthropic의 Claude AI 어시스턴트입니다. 다양한 방면에서 도움을 드릴 수 있어요.

## 지원 분야

- **코드 리뷰 및 버그 수정** — 문제를 정확하게 파악하고 해결책 제시
- **아이디어 구체화** — 막연한 아이디어를 실행 가능한 계획으로
- **번역 및 글쓰기** — 자연스러운 한국어/영어 표현

## 코드 예시

\`\`\`python
def fibonacci(n: int) -> list[int]:
    """피보나치 수열을 반환합니다."""
    if n <= 0:
        return []
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq[:n]

print(fibonacci(10))
# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
\`\`\`

## 주의할 점

1. 민감한 개인정보는 입력하지 마세요
2. 중요한 결정에는 전문가 의견을 함께 참고하세요
3. 생성된 코드는 실제 사용 전 테스트를 권장합니다

> 어떤 것이든 편하게 질문해 주세요!`

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function setupMockApi(): void {
  // 실제 IPC 구현이 주입되어 있으면 건너뜀
  if (typeof window.api?.startCliInstall === 'function') return

  const callbacks: {
    installProgress?: (data: string) => void
    installComplete?: (result: { success: boolean; error?: string }) => void
    cliLoginProgress?: (data: string) => void
    cliLoginComplete?: (result: { success: boolean; error?: string }) => void
    responseChunk?: (chunk: string) => void
    responseDone?: (result: { success: boolean; error?: string }) => void
    stockAnalysisAgent?: (event: { name: string; status: 'running' | 'done' }) => void
    stockAnalysisChunk?: (chunk: string) => void
    stockAnalysisDone?: (result: { success: boolean; error?: string }) => void
  } = {}

  const STORAGE_KEY_PREFIX = 'mock_api_key_'

  window.api = {
    /* ── CLI 설치 ── */
    startCliInstall: (model: string) => {
      const logs = model === 'gpt' ? INSTALL_LOGS_GPT : INSTALL_LOGS_CLAUDE
      let i = 0
      const timer = setInterval(() => {
        if (i < logs.length) {
          callbacks.installProgress?.(logs[i])
          i++
        } else {
          clearInterval(timer)
          setTimeout(() => {
            callbacks.installComplete?.({ success: true })
          }, 400)
        }
      }, 250)
    },
    onInstallProgress: (cb) => {
      callbacks.installProgress = cb
    },
    onInstallComplete: (cb) => {
      callbacks.installComplete = cb
    },

    /* ── API 키 ── */
    validateApiKey: async ({ apiKey }) => {
      await delay(1400)
      if (!apiKey || apiKey.trim().length < 8) {
        return { valid: false, error: '유효하지 않은 API 키입니다. 키를 다시 확인해 주세요.' }
      }
      return { valid: true }
    },
    saveApiKey: async ({ model, apiKey }) => {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${model}`, apiKey)
    },
    loadApiKey: async (model) => {
      return localStorage.getItem(`${STORAGE_KEY_PREFIX}${model}`)
    },

    /* ── Claude CLI 로그인 ── */
    runClaudeLogin: () => {
      let i = 0
      const timer = setInterval(() => {
        if (i < CLI_LOGIN_LOGS.length) {
          callbacks.cliLoginProgress?.(CLI_LOGIN_LOGS[i])
          i++
        } else {
          clearInterval(timer)
          setTimeout(() => {
            callbacks.cliLoginComplete?.({ success: true })
          }, 400)
        }
      }, 600)
    },
    onCliLoginProgress: (cb) => {
      callbacks.cliLoginProgress = cb
    },
    onCliLoginComplete: (cb) => {
      callbacks.cliLoginComplete = cb
    },
    runGptLogin: () => {
      let i = 0
      const logs = CLI_LOGIN_LOGS.map((line, index) => (index === 0 ? '$ codex login' : line))
      const timer = setInterval(() => {
        if (i < logs.length) {
          callbacks.cliLoginProgress?.(logs[i])
          i++
        } else {
          clearInterval(timer)
          setTimeout(() => {
            callbacks.cliLoginComplete?.({ success: true })
          }, 400)
        }
      }, 600)
    },

    /* ── 프롬프트 실행 ── */
    runPrompt: ({ model }) => {
      const fullText = model === 'gpt' ? MOCK_RESPONSE_GPT : MOCK_RESPONSE_CLAUDE

      // 글자 단위로 스트리밍
      let i = 0
      const chunkSize = 4
      const timer = setInterval(() => {
        if (i < fullText.length) {
          const chunk = fullText.slice(i, i + chunkSize)
          callbacks.responseChunk?.(chunk)
          i += chunkSize
        } else {
          clearInterval(timer)
          setTimeout(() => {
            callbacks.responseDone?.({ success: true })
          }, 200)
        }
      }, 20)
    },
    onResponseChunk: (cb) => {
      callbacks.responseChunk = cb
    },
    onResponseDone: (cb) => {
      callbacks.responseDone = cb
    },

    runStockAnalysis: ({ model }) => {
      const roles = [
        'financial-analyst-kr',
        'news-sentiment-analyst',
        'sector-researcher',
        'aggressive-investment-strategist'
      ] as const

      let index = 0
      const timer = setInterval(() => {
        const role = roles[index]
        if (!role) {
          clearInterval(timer)
          callbacks.stockAnalysisChunk?.(
            model === 'gpt' ? MOCK_RESPONSE_GPT : MOCK_RESPONSE_CLAUDE
          )
          callbacks.stockAnalysisDone?.({ success: true })
          return
        }

        callbacks.stockAnalysisAgent?.({ name: role, status: 'running' })
        setTimeout(() => {
          callbacks.stockAnalysisAgent?.({ name: role, status: 'done' })
        }, 500)
        index += 1
      }, 700)
    },
    cancelStockAnalysis: () => {
      callbacks.stockAnalysisDone?.({ success: false, error: '분석이 취소되었습니다.' })
    },
    onStockAnalysisAgent: (cb) => {
      callbacks.stockAnalysisAgent = cb
    },
    onStockAnalysisChunk: (cb) => {
      callbacks.stockAnalysisChunk = cb
    },
    onStockAnalysisDone: (cb) => {
      callbacks.stockAnalysisDone = cb
    }
  }
}

export default setupMockApi
