export const ROUTES = {
  ROOT: '/',
  LANDING: '/landing',
  DOWNLOAD: '/download',
  AUTH: '/auth',
  PROMPT: '/prompt',
  RESPONSE: '/response',
  INFO: '/info',
  REPORTS_LATEST: '/reports/latest',
  REPORT_DETAIL: (name: string) => `/reports/${name}`,
  GUIDE_INVESTMENT: '/guide/investment',
} as const
