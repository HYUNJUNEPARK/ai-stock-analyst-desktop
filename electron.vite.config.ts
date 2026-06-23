import { resolve } from 'path'
import { existsSync } from 'fs'
import { defineConfig } from 'electron-vite'
import { config as loadDotenv } from 'dotenv'
import react from '@vitejs/plugin-react'
import { version } from './package.json'

// 빌드 타임에 .env.local → .env 순서로 환경변수를 읽어 main process에 주입
const buildEnv: Record<string, string> = {}
for (const f of ['.env', '.env.local']) {
  if (existsSync(f)) loadDotenv({ path: f, processEnv: buildEnv, override: true })
}

const envKeys = ['DATA_GO_KR_SERVICE_KEY', 'FINNHUB_API_KEY', 'FMP_API_KEY'] as const
const mainDefine: Record<string, string> = {}
for (const key of envKeys) {
  mainDefine[`__ENV_${key}__`] = JSON.stringify(buildEnv[key] ?? '')
}

export default defineConfig({
  main: {
    define: mainDefine
  },
  preload: {},
  renderer: {
    define: {
      __APP_VERSION__: JSON.stringify(version)
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
