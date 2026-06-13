# Student FE — Cấu trúc folder & quy ước

> Cập nhật: 13/06/2026 · Phase **S0–S4** đã triển khai

## Nguyên tắc

| Layer | Path | Vai trò |
|-------|------|---------|
| Route adapter | `pages/student/*` | File mỏng, map route → page/feature |
| Domain HS | `student/` | Logic + UI theo màn |
| Shell | `student/shell/` | 2 layout: app vs player |
| UI kit | `student/ui/` | Vibrant Scholar primitives |
| Layout entry | `layouts/student/` | Import CSS + bọc shell |
| Styles | `styles/student/` | Token + shell CSS |
| Shared app | `shared/` | API, auth, `paths.ts` |

## Hai shell

| Shell | Component | Route | Chrome |
|-------|-----------|-------|--------|
| **App** | `StudentAppShell` | `/student`, `/student/lessons`, … | Sidebar + top bar + bottom nav |
| **Player** | `StudentPlayerShell` | `/student/lessons/:slug` | Close + progress, không nav app |

Cấu hình nav: `student/shell/studentNavItems.ts` (single source).

## Routes (`app/routes.tsx`)

```text
/student                    RequireAuth → Outlet
  ├─ StudentAppLayout       (shell app)
  │    ├─ index             Home
  │    ├─ lessons           List
  │    ├─ path|vocab|profile|leaderboard  Placeholder
  │    └─ huong-dan         Usage guide
  └─ StudentPlayerLayout    (shell player)
       └─ lessons/:slug     LessonReaderPage
```

## Paths

- Hằng số segment: `shared/constants/paths.ts`
- URL đầy đủ: `studentRoutePaths.*`

## Login

- Mặc định sau đăng nhập: `/student` (`resolvePostLoginRedirect`)
- Nếu bị redirect từ route protected: quay lại `state.from`

## UI kit (S1)

| Component | File |
|-----------|------|
| `VqButton` | `student/ui/VqButton.tsx` |
| `VqCard` | `student/ui/VqCard.tsx` |
| `VqProgressBar` | `student/ui/VqProgressBar.tsx` |
| `VqSpeechBubble` | `student/ui/VqSpeechBubble.tsx` |
| `VqBadge` | `student/ui/VqBadge.tsx` |

Token CSS: `styles/student/vibrant-theme.css` (class gốc `.student-zone-root`).

Legacy `--eng-*` alias sang `--vq-*` trong migration.

## Phase tiếp theo

- Gamification API (XP/streak server)
- Vocab / Profile / Leaderboard pages
- `TRUE_FALSE` question type

### S4 (done)

- `student/lessonPlayer/LessonReaderPage.tsx` — domain page + chrome wiring
- `LessonPlayerChromeContext` — progress/title → `StudentPlayerShell`
- Bỏ nút back trùng (shell có close)
- `LessonReaderToolbar` — focus mode (VqButton)
- `styles/student/lesson-player-vq.css` — reskin study + exercise trong player shell
- `PlayerMascotTip` — gợi ý theo block đang đọc
- `ExerciseFeedbackTray` — tray đúng/sai sau KIỂM TRA
- `MascotAvatar` shared component

### S2 (done)

- `student/home/HomePage.tsx` — bento dashboard
- Hero mascot + speech bubble, continue card (Vq), daily goals, weekly streak (localStorage), badges preview, quick links
- `styles/student/home.css`

### S3 (done)

- `student/lessons/` — list + learning path
- `usePublishedLessons` hook (shared fetch/progress)
- `LessonListPage` — Vq cards, search, tabs
- `LearningPathPage` — group theo môn, path nodes zigzag, lock tuần tự
- `styles/student/lessons.css`

## Tài liệu liên quan

- `docs/STUDENT_PROGRESS.md` — snapshot chức năng
- `docs/REVIEW.html` — tab Student UI
- `Design/stitch_quest_english_learning_platform/vibrant_scholar/DESIGN.md`
