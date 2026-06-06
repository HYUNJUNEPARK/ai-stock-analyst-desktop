/**
 * src/main/ipc/windows.ts — 보조 창(BrowserWindow) 열기 및 외부 URL IPC 핸들러
 *
 * 담당 채널:
 *   - open-external-url        : 시스템 기본 브라우저로 URL 열기 (양방향)
 *   - open-reports-window      : 보고서 목록 새 창 열기 (양방향)
 *   - open-report-detail-window: 보고서 상세 새 창 열기 (양방향)
 *   - open-guide-window        : 투자 가이드 새 창 열기 (양방향)
 */

import { ipcMain, BrowserWindow, shell } from 'electron'
import { IPC } from '../../shared/ipcChannels'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { writeTerminalError, writeTerminalLog } from '../utils/spawn'
import icon from '../../../resources/icon.png?asset'

function createPrerequisitesWindow(): void {
  const win = new BrowserWindow({
    width: 520,
    height: 460,
    minWidth: 400,
    minHeight: 360,
    show: false,
    autoHideMenuBar: true,
    title: '사용 전 준비사항',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>사용 전 준비사항</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f2f2f7; color: #1c1c1e;
    padding: 32px 28px; line-height: 1.7;
    -webkit-app-region: drag;
  }
  h1 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
  .card {
    background: #fff; border-radius: 12px; padding: 20px 22px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    -webkit-app-region: no-drag;
  }
  .card h2 { font-size: 15px; font-weight: 600; margin-bottom: 10px; color: #007aff; }
  .card p { font-size: 13.5px; color: #3a3a3c; margin-bottom: 12px; }
  code {
    display: inline-block; background: #e8e8ed; padding: 2px 8px;
    border-radius: 6px; font-size: 13px; font-family: 'SF Mono', Menlo, Consolas, monospace;
  }
  .link {
    display: inline-block; margin-top: 8px; color: #007aff;
    font-size: 13.5px; text-decoration: none; cursor: pointer;
    -webkit-app-region: no-drag;
  }
  .link:hover { text-decoration: underline; }
  .check { margin-top: 14px; font-size: 13px; color: #6c6c70; }
  .check code { font-size: 12.5px; }
</style>
</head>
<body>
  <h1>사용 전 준비사항</h1>
  <div class="card">
    <h2>Node.js 설치</h2>
    <p>AI 분석에 필요한 CLI 도구(Claude Code, Codex)가 npm을 통해 설치되므로 <b>Node.js</b>가 사전에 설치되어 있어야 합니다.</p>
    <a class="link" href="https://nodejs.org/ko/download" target="_blank">https://nodejs.org/ko/download</a>
    <p style="margin-top:6px;">위 주소에서 <b>LTS 버전</b>을 다운로드하여 설치해 주세요.</p>
    <div class="check">설치 확인: <code>node -v</code> &nbsp; <code>npm -v</code></div>
  </div>
</body>
</html>`

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  win.on('ready-to-show', () => { win.show() })
}

function createReportsWindow(): void {
  const reportsWindow = new BrowserWindow({
    width: 560,
    height: 720,
    minWidth: 480,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    title: '이전 보고서',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  reportsWindow.on('ready-to-show', () => {
    reportsWindow.show()
  })

  const hash = `/reports/latest?mode=window`

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    reportsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
  } else {
    reportsWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }
}

function createGuideWindow(guide: string): void {
  const guideWindow = new BrowserWindow({
    width: 860,
    height: 940,
    minWidth: 700,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: '투자 가이드',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  guideWindow.on('ready-to-show', () => {
    guideWindow.show()
  })

  const hash = `/guide/${guide}?mode=window`

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    guideWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
  } else {
    guideWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }
}

function createReportDetailWindow(name: string, model: string): void {
  const reportWindow = new BrowserWindow({
    width: 860,
    height: 940,
    minWidth: 840,
    minHeight: 800,
    show: false,
    autoHideMenuBar: true,
    title: '보고서',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  reportWindow.on('ready-to-show', () => {
    reportWindow.show()
  })

  const hash = `/reports/${encodeURIComponent(name)}?mode=window&model=${encodeURIComponent(model)}`

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    reportWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
  } else {
    reportWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }
}

function createErrorLogWindow(errorLog: string): void {
  const errorWindow = new BrowserWindow({
    width: 680,
    height: 520,
    minWidth: 480,
    minHeight: 360,
    show: false,
    autoHideMenuBar: true,
    title: '에러 로그',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const escapedLog = errorLog
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>에러 로그</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #1a1a2e; color: #e0e0e0;
    display: flex; flex-direction: column; height: 100vh;
  }
  header {
    padding: 16px 20px; border-bottom: 1px solid #2a2a3e;
    display: flex; align-items: center; justify-content: space-between;
    background: #16162a; -webkit-app-region: drag;
  }
  header h1 { font-size: 14px; font-weight: 600; color: #f87171; }
  .header-actions {
    display: flex; gap: 6px; -webkit-app-region: no-drag;
  }
  .header-actions button {
    background: #2a2a3e; border: 1px solid #3a3a4e; border-radius: 6px;
    color: #a0a0b0; font-size: 12px; padding: 4px 12px; cursor: pointer;
    font-family: inherit;
  }
  .header-actions button:hover { background: #3a3a4e; color: #e0e0e0; }
  main { flex: 1; overflow-y: auto; padding: 16px 20px; }
  pre {
    font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace;
    font-size: 12px; line-height: 1.7; white-space: pre-wrap;
    word-break: break-all; user-select: text;
  }
  .line { padding: 1px 0; }
  .line-error { color: #f87171; }
  .line-warn { color: #fbbf24; }
  .line-info { color: #60a5fa; }
  .line-env { color: #818cf8; }
  .line-stderr { color: #fb923c; }
  .line-section { color: #475569; font-weight: 600; }
  .line-normal { color: #94a3b8; }
  .toast {
    position: fixed; left: 50%; bottom: 20px; z-index: 20;
    transform: translate(-50%, 16px); opacity: 0; pointer-events: none;
    background: #f8fafc; color: #0f172a; border: 1px solid rgba(255,255,255,0.16);
    border-radius: 8px; padding: 8px 14px; font-size: 12px; font-weight: 600;
    box-shadow: 0 12px 28px rgba(0,0,0,0.28);
    transition: opacity 140ms ease, transform 140ms ease;
  }
  .toast.show { opacity: 1; transform: translate(-50%, 0); }
  .toast.error { background: #fee2e2; color: #991b1b; }
</style>
</head>
<body>
<header>
  <h1>에러 로그</h1>
  <div class="header-actions">
    <button id="copy-button" type="button">복사</button>
  </div>
</header>
<main>
<pre id="log">${escapedLog.split('\n').map(line => {
    if (/^\[(실패|error|stderr:error)\]/.test(line)) return `<span class="line line-error">${line}</span>`
    if (/^\[(경고|warn)\]/.test(line)) return `<span class="line line-warn">${line}</span>`
    if (/^\[info\]/.test(line)) return `<span class="line line-info">${line}</span>`
    if (/^\[env\]/.test(line)) return `<span class="line line-env">${line}</span>`
    if (/^\[stderr\]/.test(line)) return `<span class="line line-stderr">${line}</span>`
    if (/^---/.test(line)) return `<span class="line line-section">${line}</span>`
    return `<span class="line line-normal">${line}</span>`
  }).join('\n')}</pre>
</main>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<script>
  var toastTimer = null;

  function showToast(message, isError) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.toggle('error', Boolean(isError));
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      toast.classList.remove('show');
    }, 1800);
  }

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  async function copyLog() {
    var log = document.getElementById('log');
    var text = log ? log.innerText : '';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (!fallbackCopy(text)) {
        throw new Error('copy command failed');
      }
      showToast('에러 로그를 복사했습니다.');
    } catch (error) {
      try {
        if (!fallbackCopy(text)) throw error;
        showToast('에러 로그를 복사했습니다.');
      } catch (_) {
        showToast('복사하지 못했습니다.', true);
      }
    }
  }

  document.getElementById('copy-button').addEventListener('click', copyLog);
</script>
</body>
</html>`

  errorWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  errorWindow.on('ready-to-show', () => { errorWindow.show() })
}

/**
 * 보조 창 열기 및 외부 URL IPC 핸들러를 등록한다.
 */
export function registerWindowsHandlers(): void {

  /**
   * IPC 채널: 'open-external-url'
   * 방향: renderer → main (handle = 양방향)
   * 용도: 보고서 내 웹 링크를 시스템 기본 브라우저로 열기
   *
   * http:// 또는 https:// URL만 허용하며, 그 외 스킴은 무시한다.
   */
  ipcMain.handle(IPC.OPEN_EXTERNAL_URL, (_event, url: string) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      shell.openExternal(url)
    }
  })

  ipcMain.handle(IPC.OPEN_PREREQUISITES_WINDOW, () => {
    try {
      createPrerequisitesWindow()
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC.OPEN_REPORTS_WINDOW, () => {
    writeTerminalLog('[open-reports-window] 보고서 목록 새 창 열기')
    try {
      createReportsWindow()
      return { success: true }
    } catch (error) {
      writeTerminalError('[open-reports-window] 보고서 목록 새 창 열기 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC.OPEN_REPORT_DETAIL_WINDOW, (_event, name: string, model: string) => {
    writeTerminalLog(`[open-report-detail-window] 보고서 새 창 열기: ${name}`)
    try {
      createReportDetailWindow(name, model)
      return { success: true }
    } catch (error) {
      writeTerminalError('[open-report-detail-window] 보고서 새 창 열기 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC.OPEN_ERROR_LOG_WINDOW, (_event, errorLog: string) => {
    try {
      createErrorLogWindow(errorLog)
      return { success: true }
    } catch (error) {
      writeTerminalError('[open-error-log-window] 에러 로그 창 열기 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC.OPEN_GUIDE_WINDOW, (_event, guide: string) => {
    writeTerminalLog(`[open-guide-window] 가이드 새 창 열기: ${guide}`)
    try {
      createGuideWindow(guide)
      return { success: true }
    } catch (error) {
      writeTerminalError('[open-guide-window] 가이드 새 창 열기 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
