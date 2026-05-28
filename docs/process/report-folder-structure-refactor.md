# 리포트 폴더 구조 개편 계획

## 목표

분석 중간 생성물(artifacts)을 임시 데이터가 아닌 사용자가 열람 가능한 데이터로 관리한다.
최종 JSON 리포트와 모든 에이전트 분석 파일을 하나의 폴더로 묶어 일관된 구조를 만든다.

---

## 구조 변경 전/후

### Before

```
reports/
├── 스피어_260528.json              ← 최종 리포트 (단일 파일)
└── .artifacts/
    └── 스피어_260528/             ← 중간 생성물 (숨김 폴더)
        ├── financial-analyst-kr.md
        ├── news-sentiment-analyst.md
        ├── sector-researcher.md
        ├── invest-type-classifier.md
        └── aggressive-investment-strategist.md
```

### After

```
reports/
└── 스피어_260528/                 ← 종목별 폴더 (최종 + 중간 생성물 통합)
    ├── 스피어_260528.json         ← 최종 리포트
    ├── financial-analyst-kr.md
    ├── news-sentiment-analyst.md
    ├── sector-researcher.md
    ├── invest-type-classifier.md
    └── aggressive-investment-strategist.md
```

---

## 변경 파일 목록 및 작업 내용

### Step 1 — `analyze-stock.mjs` (GPT 오케스트레이션 스크립트)

**변경 위치**: `src/main/ai/gpt/scripts/analyze-stock.mjs`

| 항목 | Before | After |
|------|--------|-------|
| `artifactDir` | `reports/.artifacts/{baseName}/` | `reports/{baseName}/` |
| `finalReportPath` | `reports/{baseName}.json` | `reports/{baseName}/{baseName}.json` |

- `artifactDir`에서 `.artifacts` 경로 제거
- `finalReportPath`를 `artifactDir` 안의 `{baseName}.json`으로 변경
- `mkdir(artifactDir)` 로직은 그대로 유지 (폴더 자동 생성)
- `resolveUniqueReportPath()` 함수 → 폴더 충돌 처리로 변경 (`{baseName}_1/`, `{baseName}_2/` 방식)

---

### Step 2 — `cli-stats.ts` IPC 핸들러 3개 수정

**변경 위치**: `src/main/ipc/cli-stats.ts`

#### 2-1. `LIST_GPT_REPORT_FILES`

- Before: `STOCK_GPT_REPORTS_DIR` 내 `.json` 파일 스캔
- After: `STOCK_GPT_REPORTS_DIR` 내 **디렉토리** 스캔 → 각 폴더 안의 `{folderName}.json` 읽기
- `.artifacts`, `.gitkeep` 등 숨김 파일/폴더 제외 필터 추가
- 반환 `name` 필드: `스피어_260528.json` → `스피어_260528` (폴더 이름)

#### 2-2. `READ_GPT_REPORT_FILE`

- Before: `join(STOCK_GPT_REPORTS_DIR, name)` — name = `스피어_260528.json`
- After: `join(STOCK_GPT_REPORTS_DIR, name, `${name}.json`)` — name = `스피어_260528`

#### 2-3. `READ_ARTIFACT_FILES`

- `artifactDir` 필드가 이제 리포트 폴더 자체를 가리키므로 **변경 없음**
- JSON 내 `artifactDir` 값이 새 경로로 저장되므로 자동으로 올바른 위치를 참조

---

### Step 3 — `ReportDetailPage.tsx` GPT 판별 방식 변경

**변경 위치**: `src/renderer/src/pages/report/ReportDetailPage.tsx`

- Before: `isGpt = name?.endsWith('.json')` — `.json` 확장자로 GPT 여부 판별
- After: URL 쿼리 파라미터 `?model=gpt` 로 판별
  - `isGpt = searchParams.get('model') === 'gpt'`
- `RecentReportPage`에서 상세 페이지로 이동할 때 `?model=gpt` 쿼리 파라미터 추가 필요

---

### Step 4 — `RecentReportPage.tsx` 이름 표시 정리

**변경 위치**: `src/renderer/src/pages/report/RecentReportPage.tsx`

- Before: `report.name.replace(/\.json$/, '')` — `.json` 확장자 제거 처리
- After: `report.name` 그대로 사용 (이미 폴더 이름 = 순수 이름)
- 삭제 기능(현재 TODO)은 향후 폴더 전체 삭제로 구현 예정

---

### Step 5 — `preload/index.d.ts` 타입 확인

**변경 위치**: `src/preload/index.d.ts`

- `listGptReportFiles` 반환 타입의 `name` 필드가 폴더 이름(확장자 없음)으로 바뀌므로 주석 업데이트
- 함수 시그니처 자체는 변경 없음

---

## 기존 리포트 처리

기존에 생성된 리포트는 **새 구조로 자동 마이그레이션하지 않는다**.

- `LIST_GPT_REPORT_FILES` 핸들러에서 **구형 `.json` 파일도 함께 스캔**해 반환
- 구형 리포트는 `artifactDir`이 `.artifacts/` 경로를 가리키므로 탭 열람은 그대로 동작
- 단, 구형 리포트 클릭 시 `?model=gpt` 쿼리 파라미터가 없으므로 `isGpt` 판별 로직에 하위 호환 처리 추가
  - 예: `searchParams.get('model') === 'gpt' || name?.endsWith('.json')`

---

## 작업 순서

1. `analyze-stock.mjs` — 새 경로 구조 적용
2. `cli-stats.ts` — 목록/읽기 핸들러 수정
3. `ReportDetailPage.tsx` — `isGpt` 판별 방식 변경 + 하위 호환 처리
4. `RecentReportPage.tsx` — 이름 표시 정리
5. `preload/index.d.ts` — 타입 주석 정리
6. 타입 체크 (`npm run typecheck`)

---

## 비고

- `resolveUniqueReportPath()` → `resolveUniqueFolderPath()` 로 리네이밍 권장
- 향후 삭제 기능 구현 시 `fs.rmSync(folderPath, { recursive: true })` 로 폴더 단위 삭제
