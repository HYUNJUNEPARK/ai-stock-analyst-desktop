import { existsSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const TOKEN_EXPIRY_SKEW_MS = 60 * 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasTokenValue(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function getTokenValue(auth: Record<string, unknown>, key: string): string | null {
  const value = auth[key]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function getNestedTokens(auth: Record<string, unknown>): Record<string, unknown> {
  const tokens = auth['tokens']
  return isRecord(tokens) ? tokens : {}
}

function getTokenValues(auth: Record<string, unknown>, keys: string[]): string[] {
  return keys.map((key) => getTokenValue(auth, key)).filter((value): value is string => Boolean(value))
}

function decodeBase64UrlJson(value: string): unknown {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=')
  return JSON.parse(Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'))
}

function getJwtExpiryMs(token: string): number | null {
  const [, payload] = token.split('.')
  if (!payload) return null

  try {
    const decoded = decodeBase64UrlJson(payload)
    if (!isRecord(decoded) || typeof decoded['exp'] !== 'number') return null
    return decoded['exp'] * 1000
  } catch {
    return null
  }
}

function isUsableAccessToken(token: string, nowMs: number): boolean {
  const expiryMs = getJwtExpiryMs(token)
  if (expiryMs === null) return true
  return expiryMs > nowMs + TOKEN_EXPIRY_SKEW_MS
}

export function hasCodexAuthToken(auth: unknown): boolean {
  if (!isRecord(auth)) return false

  const apiKeyKeys = ['apiKey', 'openaiApiKey', 'OPENAI_API_KEY']
  if (apiKeyKeys.some((key) => hasTokenValue(auth[key]))) {
    return true
  }

  const tokens = getNestedTokens(auth)
  const refreshTokens = [
    ...getTokenValues(auth, ['refreshToken', 'refresh_token']),
    ...getTokenValues(tokens, ['refreshToken', 'refresh_token'])
  ]

  if (refreshTokens.length > 0) {
    return true
  }

  const accessTokens = [
    ...getTokenValues(auth, ['accessToken', 'oauthToken', 'idToken', 'access_token', 'id_token']),
    ...getTokenValues(tokens, [
      'accessToken',
      'oauthToken',
      'idToken',
      'access_token',
      'id_token'
    ])
  ]

  const nowMs = Date.now()
  return accessTokens.some((token) => isUsableAccessToken(token, nowMs))
}

export function isCodexAuthErrorOutput(output: string): boolean {
  const normalized = output.toLowerCase()
  return [
    'not logged in',
    'not authenticated',
    'authentication failed',
    'auth failed',
    'unauthorized',
    'invalid token',
    'expired token',
    'token expired',
    'please login',
    'please log in',
    'codex login',
    'login required',
    'requires authentication'
  ].some((pattern) => normalized.includes(pattern))
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
