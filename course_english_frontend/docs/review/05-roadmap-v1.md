# 05 - Roadmap v1

## Phase 1 - Foundation

- Auth + RBAC (`Teacher`, `Student`)
- Classroom CRUD
- Enrollment (tham gia lớp)
- Subject CRUD

**Deliverable:** Teacher tạo được lớp/môn, Student thấy lớp đã tham gia.

## Phase 2 - Learning Content

- Lesson CRUD
- Lesson assets (text/image/file)
- Publish/unpublish bài học

**Deliverable:** Teacher biên soạn bài học hoàn chỉnh.

## Phase 3 - Assignment

- Question CRUD (MCQ + essay)
- Assignment create/config
- Submission flow cho student

**Deliverable:** Student làm và nộp bài.

## Phase 4 - Grading & Report

- Teacher chấm điểm + feedback
- Student xem điểm
- Report cơ bản theo lớp/môn

**Deliverable:** Hoàn tất vòng đời dạy-học.

## Rủi ro chính

- Thiếu chuẩn dữ liệu câu hỏi ngay từ đầu
- Upload file ảnh chưa có quy tắc dung lượng
- Chưa rõ policy nộp lại bài nhiều lần

## Checklist chốt trước khi code lớn

- [ ] Chốt ERD bản đầu
- [ ] Chốt API contract cho assignment/submission
- [ ] Chốt rule chấm điểm (auto + manual)
- [ ] Chốt trải nghiệm mobile tối thiểu
