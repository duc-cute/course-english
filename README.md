# Course English

Nền học tiếng Anh (đọc/nghe bài + quiz — đang phát triển), fork từ [cell_architecture](../cell_architecture).

## Cấu trúc

| Thư mục | Mô tả |
|---------|--------|
| `course_english_backend/` | Spring Boot API — port **7070** |
| `course_english_frontend/` | React + Vite — admin + student |
| `docs/` | Kế hoạch & checklist fork |

## Trạng thái P0

- [x] Copy code từ Cell Studio
- [x] Đổi package `com.courseenglish.api`
- [x] DB `course_english`, storage riêng
- [x] Gỡ biology / Three.js
- [x] Routes mặc định → `/student`

## Chạy local

**1. MySQL** — tạo DB `course_english` (hoặc để `createDatabaseIfNotExist=true` trong `.env`).

**2. Backend**

```bash
cd course_english_backend
copy .env.example .env
.\gradlew.bat bootRun
```

**3. Frontend**

```bash
cd course_english_frontend
copy .env.example .env
npm install
npm run dev
```

Mở http://localhost:5173 → redirect `/student` (cần đăng nhập).

API: http://localhost:7070/api

## Tài liệu

- **[REVIEW.html](./course_english_frontend/public/docs/REVIEW.html)** — khung lớn (5 trụ cột), chia phase, phần quan trọng; hoặc Admin → **Review tài liệu**
- [ENGLISH_LEARNING_CLONE_PLAN.md](./docs/ENGLISH_LEARNING_CLONE_PLAN.md)
- [FORK_FROM_CELL_ARCHITECTURE.md](./docs/FORK_FROM_CELL_ARCHITECTURE.md)

## Phase tiếp theo

- **P1:** Block AUDIO, CALLOUT, enrollment filter, progress API
- **P2:** Question bank + Quiz player
