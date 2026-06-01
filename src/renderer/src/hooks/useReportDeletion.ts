import { useState } from 'react'
import type { ReportFile } from './useReportList'

interface UseReportDeletionOptions {
  // 삭제 성공 후 호출되는 콜백 — useReportList의 removeReport를 넘겨 목록을 동기화한다
  onSuccess: (name: string) => void
}

interface UseReportDeletionReturn {
  deleteTarget: ReportFile | null
  deleteTargetLabel: string
  handleDeleteRequest: (report: ReportFile) => void
  handleDeleteCancel: () => void
  handleDeleteConfirm: () => void
}

// 보고서 삭제 흐름(선택 → 확인 → IPC 호출 → 목록 동기화)을 관리하는 훅
export function useReportDeletion({ onSuccess }: UseReportDeletionOptions): UseReportDeletionReturn {
  const [deleteTarget, setDeleteTarget] = useState<ReportFile | null>(null)

  // ConfirmDialog에 표시할 레이블: ticker가 있으면 "회사명(ticker)", 없으면 회사명 또는 파일명
  const deleteTargetLabel = deleteTarget
    ? deleteTarget.ticker && deleteTarget.ticker !== 'unknown'
      ? `${deleteTarget.company}(${deleteTarget.ticker})`
      : deleteTarget.company || deleteTarget.name
    : ''

  function handleDeleteRequest(report: ReportFile): void {
    setDeleteTarget(report)
  }

  function handleDeleteCancel(): void {
    setDeleteTarget(null)
  }

  // IPC로 삭제 요청 후 성공 시 onSuccess 콜백을 통해 목록에서 제거한다
  function handleDeleteConfirm(): void {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)

    window.api
      .deleteGptReportFile(target.name)
      .then((result) => {
        if (result.success) {
          onSuccess(target.name)
        } else {
          console.error('[delete] 삭제 실패:', result.error)
        }
      })
      .catch((err: Error) => {
        console.error('[delete] IPC 오류 (main 프로세스 재시작 필요):', err.message)
      })
  }

  return { deleteTarget, deleteTargetLabel, handleDeleteRequest, handleDeleteCancel, handleDeleteConfirm }
}
