/**
 * shared/public-data-api.mjs — 공공데이터포털 API 공통 유틸리티 (AI 모델 공통)
 *
 * 공공데이터포털(data.go.kr) API 호출에 필요한 공통 함수를 모아놓은 모듈이다.
 * 현재는 local-symbols.mjs에서 종목 마스터를 가져올 때 사용하지만,
 * 향후 주가 조회 등 다른 공공데이터포털 API를 추가할 때도 재사용할 수 있다.
 *
 * 주요 기능:
 *   - buildPublicDataUrl()    : 서비스키 인코딩을 처리한 API URL 조립
 *   - fetchPublicDataPage()   : API 호출 + 에러 응답 검증
 *   - formatPublicDataError() : 에러 body에서 사유 메시지 추출
 */

// =====================================================================
//  API 호출
// =====================================================================

/**
 * 공공데이터포털 API 단일 페이지를 호출하고 응답을 검증한다.
 *
 * 공공데이터포털의 에러 응답 패턴 두 가지를 모두 처리한다:
 *   1. HTTP 4xx/5xx + XML/텍스트 body (인증 실패 등)
 *   2. HTTP 200이지만 JSON body 내 resultCode ≠ '00'
 *      (예: SERVICE_KEY_IS_NOT_REGISTERED_ERROR)
 *
 * @param {string} url - buildPublicDataUrl()로 조립된 전체 URL
 * @returns {{ header: object, body: object }}
 * @throws {Error} HTTP 에러 또는 resultCode 비정상 시
 */
export async function fetchPublicDataPage(url) {
  const response = await fetch(url)
  const contentType = response.headers.get('content-type') || ''

  // 패턴 1: HTTP 에러 또는 JSON이 아닌 응답 (XML 에러 등)
  if (!response.ok || !contentType.includes('json')) {
    const responseText = await response.text().catch(() => '')
    throw new Error(
      `공공데이터 API 실패: HTTP ${response.status}${formatPublicDataError(responseText)}`
    )
  }

  const payload = await response.json()
  const header = payload?.response?.header
  const resultCode = String(header?.resultCode || '')

  // 패턴 2: HTTP 200이지만 API 레벨 에러
  if (resultCode && resultCode !== '00') {
    throw new Error(
      `공공데이터 API 에러: ${header?.resultMsg || resultCode}`
    )
  }

  return { header, body: payload?.response?.body }
}

// =====================================================================
//  URL 조립
// =====================================================================

/**
 * 공공데이터포털 API URL을 조립한다.
 *
 * 서비스키 인코딩 처리:
 *   공공데이터포털은 서비스키를 두 가지 형태로 제공한다.
 *   - "인코딩 키": URL 인코딩된 형태 (예: abc%2Fdef%3D)
 *   - "디코딩 키": 원문 형태 (예: abc/def=)
 *   사용자가 .env에 어떤 형태를 넣든, 한 번 디코딩 → 다시 인코딩하면 올바른 URL이 된다.
 *
 * @param {string} baseUrl    - API 엔드포인트 URL
 * @param {string} serviceKey - 공공데이터포털 서비스키 (인코딩/디코딩 모두 가능)
 * @param {object} params     - 쿼리 파라미터 객체 (예: { pageNo: 1, numOfRows: 100 })
 * @returns {string} 완성된 URL 문자열
 */
export function buildPublicDataUrl(baseUrl, serviceKey, params) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    query.set(key, String(value))
  }

  const decodedKey = safeDecodeServiceKey(serviceKey)
  const encodedKey = encodeURIComponent(decodedKey)
  return `${baseUrl}?serviceKey=${encodedKey}&${query.toString()}`
}

// =====================================================================
//  에러 파싱
// =====================================================================

/**
 * 공공데이터포털 에러 응답에서 사람이 읽을 수 있는 사유 메시지를 추출한다.
 * API가 XML로 응답하는 경우와 JSON으로 응답하는 경우 모두 처리한다.
 *
 * 예: "<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>"
 *   → " (SERVICE_KEY_IS_NOT_REGISTERED_ERROR)"
 *
 * @param {string} text - 에러 응답 body 텍스트 (XML 또는 JSON)
 * @returns {string} 괄호로 감싼 사유 문자열. 빈 입력이면 빈 문자열.
 */
export function formatPublicDataError(text) {
  const safeText = String(text || '').replace(/\s+/g, ' ').trim()
  if (!safeText) return ''

  const reasonMatch = safeText.match(
    /<returnReasonCode>([^<]+)<\/returnReasonCode>|<returnAuthMsg>([^<]+)<\/returnAuthMsg>|"resultMsg"\s*:\s*"([^"]+)"/i
  )
  const reason =
    reasonMatch?.[1] ||
    reasonMatch?.[2] ||
    reasonMatch?.[3] ||
    safeText.slice(0, 160)
  return ` (${reason})`
}

// =====================================================================
//  유틸리티
// =====================================================================

/**
 * 공공데이터포털 응답에서 items가 단일 객체로 올 수 있어 항상 배열로 변환한다.
 * 예: { item: { ... } } → [{ ... }],  { item: [{ ... }, { ... }] } → [{ ... }, { ... }]
 */
export function toArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * decodeURIComponent의 안전한 래퍼.
 * 잘못된 퍼센트 시퀀스(%XX)가 포함된 경우 원문을 그대로 반환한다.
 */
function safeDecodeServiceKey(key) {
  try {
    return decodeURIComponent(key)
  } catch {
    return key
  }
}
