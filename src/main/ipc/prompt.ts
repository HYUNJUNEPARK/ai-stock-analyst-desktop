/**
 * src/main/ipc/prompt.ts — 단발 프롬프트 실행 IPC 핸들러
 *
 * 담당 채널:
 *   - run-prompt : 사용자 프롬프트를 CLI로 실행하고 응답을 스트리밍 (단방향)
 */

import { ipcMain, type BrowserWindow } from 'electron'
import { spawnCommand } from '../utils/spawn'
import { getCliCommand } from '../utils/cli'

/**
 * 단발 프롬프트 실행 IPC 핸들러를 등록한다.
 *
 * @param win - IPC 이벤트를 push할 BrowserWindow 인스턴스
 */
export function registerPromptHandlers(win: BrowserWindow): void {

  // ── [on] 단발 프롬프트 실행 ────────────────────────────────────
  /**
   * IPC 채널: 'run-prompt'
   * 방향: renderer → main (on = 단방향)
   * 용도: 프롬프트 화면에서 사용자가 입력한 질문을 CLI로 실행
   *
   * 모델별 실행 명령:
   *   GPT   : codex exec --skip-git-repo-check --color never <prompt>
   *   Claude: claude -p <prompt> --output-format text
   *
   * 응답 스트리밍: stdout 데이터를 받는 즉시 'prompt-response-chunk' 채널로 전송
   * 완료 결과: 프로세스 종료 시 'prompt-response-done' 채널로 전송
   *
   * stderr 처리:
   *   Claude CLI는 진행 상태를 stderr에도 출력하므로 'error' 키워드가 있을 때만 전달
   */
  ipcMain.on(
    'run-prompt',
    (_event, { model, prompt }: { model: string; prompt: string }) => {
      console.log(`프롬프트 실행 시작: 모델=${model}`)

      let cmd: string
      let args: string[]

      if (model === 'gpt') {
        cmd = getCliCommand('codex')
        args = ['exec', '--skip-git-repo-check', '--color', 'never', prompt]
      } else {
        // claude CLI: ANTHROPIC_API_KEY 환경변수로 인증 (또는 claude login 세션)
        cmd = getCliCommand('claude')
        args = ['-p', prompt, '--output-format', 'text']
      }

      const child = spawnCommand(cmd, args, {
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe']
      })

      child.stdout.on('data', (data: Buffer) => {
        win.webContents.send('prompt-response-chunk', data.toString())
      })

      child.stderr.on('data', (data: Buffer) => {
        // Claude CLI는 stderr에 진행 정보를 출력하기도 함 — error 관련 메시지만 전달
        const text = data.toString()
        if (text.toLowerCase().includes('error')) {
          win.webContents.send('prompt-response-chunk', text)
        }
      })

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`프롬프트 실행 완료: 모델=${model}`)
          win.webContents.send('prompt-response-done', { success: true })
        } else {
          console.error(`프롬프트 실행 실패: 모델=${model} (exit code: ${code})`)
          win.webContents.send('prompt-response-done', {
            success: false,
            error: `CLI 실행 실패 (exit code: ${code})`
          })
        }
      })

      child.on('error', (err) => {
        win.webContents.send('prompt-response-done', {
          success: false,
          error: `CLI 실행 오류: ${err.message}`
        })
      })
    }
  )
}
