import { existsSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasTokenValue(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function hasCodexAuthToken(auth: unknown): boolean {
  if (!isRecord(auth)) return false

  const topLevelTokenKeys = [
    'accessToken',
    'oauthToken',
    'apiKey',
    'openaiApiKey',
    'OPENAI_API_KEY'
  ]

  if (topLevelTokenKeys.some((key) => hasTokenValue(auth[key]))) {
    return true
  }

  const tokens = auth['tokens']
  if (!isRecord(tokens)) return false

  return [
    'access_token',
    'id_token',
    'refresh_token',
    'accessToken',
    'idToken',
    'refreshToken'
  ].some((key) => hasTokenValue(tokens[key]))
}

export function isCodexAuthenticated(): boolean {
  const authPath = join(homedir(), '.codex', 'auth.json')
  if (!existsSync(authPath)) return false

  try {
    return hasCodexAuthToken(JSON.parse(readFileSync(authPath, 'utf-8')))
  } catch {
    return false
  }
}
