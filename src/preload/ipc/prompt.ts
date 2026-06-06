/**
 * prompt.ts — 단발성 프롬프트 실행 관련 preload 브릿지
 *
 * 담당 IPC 채널:
 *   renderer → main : run-prompt (프롬프트 실행 요청)
 *   main → renderer : prompt-response-chunk (응답 텍스트 스트리밍), prompt-response-done (응답 완료/실패)
 */

import { ipcRenderer } from 'electron'
import { IPC } from '../../shared/ipcChannels'

// main → renderer 이벤트를 받아 실행할 콜백 함수 보관소
// renderer에서 onResponseChunk / onResponseDone을 호출해 콜백을 등록하면 여기에 저장된다
let responseChunkCb: ((chunk: string) => void) | null = null
let responseDoneCb: ((result: { success: boolean; error?: string; authRequired?: boolean }) => void) | null = null

/**
 * main → renderer 방향 IPC 이벤트를 리스닝한다.
 * index.ts 최상단에서 한 번만 호출되며, 이후 콜백이 등록되면 자동으로 실행된다.
 */
export function registerPromptListeners(): void {
  // 응답 텍스트를 청크 단위로 스트리밍 수신
  ipcRenderer.on(IPC.PROMPT_RESPONSE_CHUNK, (_e, chunk: string) => responseChunkCb?.(chunk))
  // 응답 스트리밍 종료(성공 또는 오류) 신호 수신
  ipcRenderer.on(IPC.PROMPT_RESPONSE_DONE, (_e, result: { success: boolean; error?: string; authRequired?: boolean }) =>
    responseDoneCb?.(result)
  )
}

/**
 * renderer(React)에서 window.api.xxx() 형태로 호출할 수 있는 프롬프트 실행 관련 함수 모음.
 * index.ts에서 contextBridge를 통해 window.api에 병합된다.
 */
export const promptApi = {
  /** 선택한 model로 프롬프트를 실행한다 (단방향, 응답은 chunk 이벤트로 수신) */
  runPrompt: (params: { model: string; prompt: string }) =>
    ipcRenderer.send(IPC.RUN_PROMPT, params),

  /** 응답 텍스트 청크가 도착할 때마다 실행할 콜백을 등록한다 */
  onResponseChunk: (cb: (chunk: string) => void) => {
    responseChunkCb = cb
  },

  /** 응답 스트리밍이 완료(성공/실패)됐을 때 실행할 콜백을 등록한다 */
  onResponseDone: (cb: (result: { success: boolean; error?: string; authRequired?: boolean }) => void) => {
    responseDoneCb = cb
  },
}
