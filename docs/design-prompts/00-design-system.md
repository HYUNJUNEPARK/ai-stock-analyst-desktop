# 디자인 시스템 — AI CLI Launcher

## 디자인 철학

**"iOS Native처럼 느껴지는 데스크탑 앱"**

- 여백이 숨 쉬는 레이아웃 — 빽빽하지 않게, 콘텐츠가 떠 있는 느낌
- 색상은 절제 — 포인트 컬러는 한 가지만 사용
- 상태 변화는 부드럽게 — transition 0.2s ease 기본
- 그림자는 얇고 가볍게 — iOS의 카드처럼

---

## 색상 팔레트

```css
:root {
  /* Background */
  --bg-primary: #F2F2F7;        /* iOS systemGroupedBackground */
  --bg-secondary: #FFFFFF;      /* 카드, 입력 박스 배경 */
  --bg-tertiary: #E5E5EA;       /* 구분선, 비활성 영역 */

  /* Text */
  --text-primary: #1C1C1E;      /* iOS label */
  --text-secondary: #6C6C70;    /* iOS secondaryLabel */
  --text-tertiary: #AEAEB2;     /* placeholder, 힌트 */

  /* Accent (단 하나의 포인트 컬러) */
  --accent: #007AFF;            /* iOS systemBlue */
  --accent-hover: #0062CC;
  --accent-light: rgba(0, 122, 255, 0.12);

  /* Semantic */
  --success: #34C759;           /* iOS systemGreen */
  --danger: #FF3B30;            /* iOS systemRed */
  --warning: #FF9500;           /* iOS systemOrange */

  /* Border */
  --border: rgba(0, 0, 0, 0.08);
  --border-focused: #007AFF;
}
```

---

## 타이포그래피

```css
/* 폰트: SF Pro (macOS 자동 제공) → Windows fallback: -apple-system 체인 */
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
             'Segoe UI', 'Helvetica Neue', Arial, sans-serif;

/* 스케일 */
--text-xs:   11px;   /* 캡션, 라벨 */
--text-sm:   13px;   /* 보조 설명, 힌트 */
--text-base: 15px;   /* 본문 기본 */
--text-md:   17px;   /* 강조 본문, 버튼 */
--text-lg:   20px;   /* 소제목 */
--text-xl:   24px;   /* 제목 */
--text-2xl:  28px;   /* 대제목 */

/* 줄간격 */
line-height: 1.5;     /* 본문 */
line-height: 1.2;     /* 제목류 */

/* 굵기 */
font-weight: 400;  /* 일반 */
font-weight: 500;  /* 중간 강조 */
font-weight: 600;  /* semibold — 버튼, 제목 */
font-weight: 700;  /* bold — 대제목 */
```

---

## 공간 / 레이아웃

```
앱 창 최소 크기: 480 × 640 px
기본 권장 창: 520 × 720 px

패딩 단위:
  --space-1: 4px
  --space-2: 8px
  --space-3: 12px
  --space-4: 16px
  --space-5: 20px
  --space-6: 24px
  --space-8: 32px
  --space-10: 40px

섹션 간 여백: 32px ~ 40px
카드 내부 패딩: 20px ~ 24px
```

---

## 공통 컴포넌트 스타일

### 카드 (Card)
```css
.card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
  border: 1px solid var(--border);
}
```

### 기본 버튼 (Primary Button)
```css
.btn-primary {
  background: var(--accent);
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  padding: 14px 28px;
  font-size: var(--text-md);
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: background 0.15s ease, transform 0.1s ease, opacity 0.15s;
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}
```

### 보조 버튼 (Ghost Button)
```css
.btn-ghost {
  background: transparent;
  color: var(--accent);
  border: 1.5px solid var(--accent);
  border-radius: 12px;
  padding: 14px 28px;
  font-size: var(--text-md);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-ghost:hover { background: var(--accent-light); }
```

### 입력 필드 (Input)
```css
.input {
  background: var(--bg-secondary);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  font-size: var(--text-base);
  color: var(--text-primary);
  width: 100%;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.input:focus {
  border-color: var(--border-focused);
  box-shadow: 0 0 0 3px var(--accent-light);
}
.input::placeholder { color: var(--text-tertiary); }
```

### 터미널 박스 (Terminal / Log)
```css
.terminal {
  background: #1C1C1E;
  border-radius: 12px;
  padding: 16px;
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  color: #98FB98;
  line-height: 1.6;
  overflow-y: auto;
  max-height: 240px;
}
```

### 로딩 스피너
```css
/* 얇은 원형 스피너 — iOS activity indicator 스타일 */
.spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--bg-tertiary);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

---

## 전체 레이아웃 패턴

모든 페이지는 아래 구조를 따른다:

```
┌─────────────────────────────────┐
│  [선택적] 상단 내비게이션 바        │  height: 52px, bg: rgba(255,255,255,0.8)
│         backdrop-filter: blur   │  하단에 0.5px border
├─────────────────────────────────┤
│                                 │
│         페이지 콘텐츠              │  flex-grow: 1, overflow-y: auto
│         (중앙 정렬 컨테이너)       │  max-width: 400px, margin: 0 auto
│                                 │
├─────────────────────────────────┤
│  [선택적] 하단 액션 영역            │  padding: 20px 24px
│         고정 버튼 등               │  border-top 0.5px
└─────────────────────────────────┘
```

---

## 애니메이션 원칙

- 페이지 전환: `fade + slide-up` (translateY: 8px → 0, opacity: 0→1, 200ms ease-out)
- 버튼 hover: 150ms
- 입력 focus: 150ms
- 카드 선택: scale(1.02) + 그림자 강조, 150ms
- 오류 shake: `@keyframes shake` — 좌우 3px × 3회, 300ms
