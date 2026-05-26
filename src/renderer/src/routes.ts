export const ROUTES = {
  ROOT: '/',
  LANDING: '/landing',
  DOWNLOAD: '/download',
  AUTH: '/auth',
  PROMPT: '/prompt',
  RESPONSE: '/response',
  SETTINGS: '/settings',
  REPORTS_LATEST: '/reports/latest',
  REPORT_DETAIL: (name: string) => `/reports/${name}`,
} as const
