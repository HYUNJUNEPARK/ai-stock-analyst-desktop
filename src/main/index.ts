/**
 * src/main/index.ts — Electron 메인 프로세스 진입점
 *
 * 이 파일은 앱 생명주기 이벤트만 담당한다.
 * 창 생성과 IPC 핸들러 등록은 각각 window.ts와 ipc/ 디렉토리로 분리되어 있다.
 *
 * Electron 3-레이어 구조:
 *   renderer  : React UI (브라우저 환경, Node.js API 직접 사용 불가)
 *   preload   : contextBridge로 renderer ↔ main 사이의 안전한 통신 채널 정의
 *   main (여기): Node.js 환경. 파일 I/O, child_process, 시스템 API를 실제로 실행
 *
 * 전체 모듈 구조:
 *   index.ts          ← 앱 생명주기
 *   window.ts         ← BrowserWindow 생성
 *   constants.ts      ← 경로 상수
 *   utils/spawn.ts    ← spawnCommand, writeTerminalLine
 *   utils/cli.ts      ← getCliCommand, resolveCliCommand, streamLines
 *   ipc/index.ts      ← 핸들러 통합 등록
 *   ipc/cli-install.ts  ← CLI 설치 및 상태 확인
 *   ipc/cli-stats.ts    ← CLI 사용 통계, 보고서 목록
 *   ipc/cli-auth.ts     ← Claude/GPT 로그인
 *   ipc/prompt.ts       ← 단발 프롬프트 실행
 *   ipc/stock-analysis.ts ← 주식 멀티 에이전트 분석
 */

import { app, BrowserWindow } from 'electron'
import { createWindow, setupApp } from './window'

app.whenReady().then(() => {
  setupApp()    // 앱 ID 설정, 단축키 최적화 등 초기 설정
  createWindow()

  // macOS: Dock 아이콘 클릭 시 창이 없으면 새로 생성 (macOS 관례)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 모든 창이 닫히면 앱 종료 (macOS 제외 — macOS는 창 없이 백그라운드 유지가 관례)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
