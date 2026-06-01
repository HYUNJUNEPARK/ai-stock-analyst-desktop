import { useEffect, useState } from 'react'

export type ReportFile = {
  name: string
  company: string
  ticker: string
  asOfDate: string
  model: string
  createdAt: string
  updatedAt: string
}

export type ReportSection = {
  date: string
  reports: ReportFile[]
}

interface UseReportListOptions {
  // false이면 로드를 지연시킨다 (예: 패널이 열릴 때만 로드)
  enabled?: boolean
}

interface UseReportListReturn {
  reports: ReportFile[]
  loading: boolean
  sections: ReportSection[]
  // 삭제 성공 후 목록에서 특정 항목을 제거할 때 사용
  removeReport: (name: string) => void
  // 패널 닫힘 시 로딩 상태를 초기화해 다음 열림 시 재로드를 보장
  resetLoading: () => void
}

// 날짜 문자열을 한국어 형식으로 변환한다
function formatSectionDate(asOfDate: string): string {
  if (!asOfDate) return '날짜 미상'
  const d = new Date(asOfDate)
  if (isNaN(d.getTime())) return asOfDate
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d)
}

// 보고서 배열을 기준 날짜(asOfDate) 기준으로 내림차순 그룹화한다
function groupReportsByDate(reports: ReportFile[]): ReportSection[] {
  const grouped = new Map<string, ReportFile[]>()

  for (const report of reports) {
    const key = report.asOfDate || report.createdAt.slice(0, 10)
    const section = grouped.get(key)
    if (section) {
      section.push(report)
    } else {
      grouped.set(key, [report])
    }
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, sectionReports]) => ({
      date: formatSectionDate(date),
      reports: sectionReports
    }))
}

// 보고서 목록 로드 및 상태 관리 훅.
// enabled가 false이면 IPC 호출을 건너뛰어 조건부 로드(패널 등)를 지원한다.
export function useReportList({ enabled = true }: UseReportListOptions = {}): UseReportListReturn {
  const [reports, setReports] = useState<ReportFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    window.api
      .listGptReportFiles()
      .then((files) => {
        if (!cancelled) {
          setReports(files)
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          console.error('[reports] 목록 조회 실패:', err.message)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  function removeReport(name: string): void {
    setReports((prev) => prev.filter((r) => r.name !== name))
  }

  function resetLoading(): void {
    setLoading(true)
  }

  return { reports, loading, sections: groupReportsByDate(reports), removeReport, resetLoading }
}
