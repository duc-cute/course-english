# course_english_backend

Spring Boot API — `com.courseenglish.api`

## Chạy

```bash
copy .env.example .env
.\gradlew.bat bootRun
```

- Port: **7070**
- Context API: `/api` (xem `SecurityConfiguration`)
- DB mặc định: `course_english` @ localhost:3306

## Seed (tùy chọn)

```bash
# Nếu có file SQL trong thư mục backend
mysql -u root -p course_english < seed_lms_demo.sql
```
