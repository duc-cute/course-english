# 04 - User Flow

## 1. Teacher flow

```mermaid
flowchart TD
    A[Login] --> B[Dashboard Teacher]
    B --> C[Create Classroom]
    C --> D[Create Subject]
    D --> E[Create Lesson]
    E --> F[Add Content / Image / Question]
    F --> G[Publish Lesson]
    G --> H[Create Assignment]
    H --> I[Review Submission]
    I --> J[Grade & Feedback]
```

## 2. Student flow

```mermaid
flowchart TD
    A[Login] --> B[Dashboard Student]
    B --> C[Join Classroom]
    C --> D[Open Subject]
    D --> E[Read Lesson]
    E --> F[Do Assignment]
    F --> G[Submit]
    G --> H[View Score / Feedback]
```

## 3. Màn hình cần có (v1)

- Teacher
  - Danh sách lớp
  - Chi tiết lớp + danh sách môn
  - Danh sách bài theo môn
  - Soạn bài học + quản lý câu hỏi
  - Danh sách bài nộp

- Student
  - Lớp của tôi
  - Danh sách môn và bài học
  - Màn làm bài
  - Lịch sử bài nộp

## 4. Điểm cần chú ý UX

- Autosave khi làm bài
- Hiển thị deadline rõ ràng
- Cảnh báo chưa nộp khi sắp hết hạn
- Teacher có filter theo lớp/môn/học sinh
