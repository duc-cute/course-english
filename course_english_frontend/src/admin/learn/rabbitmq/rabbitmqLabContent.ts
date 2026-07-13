import type { RabbitMqLabStep, RabbitMqLesson, RoutingKeyOption } from "./rabbitmqLabTypes";

export const RABBITMQ_MGMT_URL = "http://localhost:15672";
export const RABBITMQ_MGMT_USER = "courseenglish";

export const rabbitmqLessons: RabbitMqLesson[] = [
  {
    id: "problem",
    title: "Vấn đề: API không nên làm việc nặng",
    emoji: "⚡",
    essence:
      "Khi GV publish lesson, server phải notify hàng chục HS + gửi email. Nếu làm hết trong 1 HTTP request, GV chờ lâu hoặc timeout.",
    analogy: "Giống quầy tiếp đón: nhân viên chỉ ghi phiếu, phòng xử lý sau làm — không bắt khách đứng chờ 30 phút.",
    inCourseEnglish: "LessonServiceImpl.publish() hiện gọi LessonPublishedNotifierImpl → @Async.",
    quiz: {
      question: "API publish lesson nên trả 200 sau bao lâu?",
      answer: "Ngay sau khi lưu DB (+ gửi 1 message vào queue). Không chờ email/notify xong.",
    },
  },
  {
    id: "message",
    title: "Message = phiếu việc có nội dung",
    emoji: "📄",
    essence:
      "Message là JSON (hoặc text) mô tả sự kiện: lessonId, classroomId, title… Producer gửi; Consumer đọc và hành động.",
    analogy: "Phiếu yêu cầu: Loại việc + mã bài + lớp — nhân viên đọc phiếu biết phải làm gì.",
    inCourseEnglish: 'Payload mẫu: eventType LESSON_PUBLISHED, lessonId, actorUserId…',
  },
  {
    id: "exchange",
    title: "Exchange = bưu cục phân loại",
    emoji: "🏤",
    essence:
      "Producer không gửi thẳng vào queue. Gửi vào exchange kèm routing key; exchange quyết định message đi queue nào.",
    analogy: "Bưu điện: bạn ghi mã bưu chính (routing key), nhân viên xếp vào đúng xe (queue).",
    inCourseEnglish: "Exchange course.events (topic). Key lesson.published → 2 queue.",
    quiz: {
      question: "Gửi routing key lesson.wrong thì sao?",
      answer: "Không có binding khớp → message không vào queue nào (bị drop hoặc alternate exchange).",
    },
  },
  {
    id: "queue",
    title: "Queue = hàng chờ bền",
    emoji: "📬",
    essence:
      "Queue lưu message cho đến khi worker lấy ra (consume). Restart server RabbitMQ → message vẫn còn (durable).",
    analogy: "Hộp thư công ty: thư nằm đó cho đến khi có người đọc — kể cả đêm qua tắt đèn.",
    inCourseEnglish: "notification.in-app, notification.email, notification.dlq.",
  },
  {
    id: "consumer",
    title: "Consumer / Worker = người xử lý",
    emoji: "👷",
    essence:
      "Worker lắng nghe queue, nhận message, làm việc (INSERT notifications, SMTP), ack khi xong. Fail → retry → DLQ.",
    analogy: "Nhân viên kho: lấy phiếu → làm → đánh dấu xong. Lỗi 3 lần → chuyển hộp đỏ (DLQ).",
    inCourseEnglish: "Sẽ là @RabbitListener gọi lại LessonNotificationServiceImpl logic.",
  },
  {
    id: "vs-async",
    title: "Khác @Async trong Spring",
    emoji: "⚖️",
    essence:
      "@Async chạy thread trong cùng JVM — nhanh setup nhưng mất việc khi restart, khó scale nhiều instance, retry tự code.",
    analogy: "@Async = ghi nhớ việc trên giấy nhớ cá nhân. RabbitMQ = phiếu chính thức trong hệ thống công ty.",
    inCourseEnglish: "P1 dùng @Async đủ; V2 fan-out lớp + email + deploy an toàn → RabbitMQ.",
  },
];

export const routingKeyOptions: RoutingKeyOption[] = [
  {
    key: "lesson.published",
    label: "lesson.published",
    bindsTo: ["in-app", "email"],
    description: "GV publish bài → notify + email HS enroll",
  },
  {
    key: "assignment.created",
    label: "assignment.created",
    bindsTo: ["in-app", "email"],
    description: "Giao bài tập (module S9 — sau)",
  },
  {
    key: "assignment.due",
    label: "assignment.due",
    bindsTo: ["in-app", "email"],
    description: "Nhắc deadline 24h (cron → queue)",
  },
  {
    key: "lesson.wrong",
    label: "lesson.wrong (thử sai)",
    bindsTo: [],
    description: "Không có binding — message không vào queue",
  },
];

export const labSteps: RabbitMqLabStep[] = [
  {
    id: "docker-up",
    title: "Bật RabbitMQ local",
    description: "Chạy container từ docker-compose.infra.yml trong repo course_english.",
    command: "docker compose -f docker-compose.infra.yml up -d rabbitmq",
    hint: "Đợi healthy: docker compose -f docker-compose.infra.yml ps",
  },
  {
    id: "topology",
    title: "Tạo exchange + queues",
    description: "Exchange course.events (topic), 3 queue, binding lesson.published.",
    command: ".\\scripts\\rabbitmq-lab\\setup-topology.ps1",
    hint: "Hoặc làm tay trên Management UI tab Exchanges / Queues.",
  },
  {
    id: "publish-ui",
    title: "Publish message trên UI",
    description: "Exchanges → course.events → Publish message. Routing key: lesson.published.",
    hint: `Mở ${RABBITMQ_MGMT_URL} — user ${RABBITMQ_MGMT_USER}`,
  },
  {
    id: "verify-queues",
    title: "Kiểm tra 2 queue có message",
    description: "Queues → notification.in-app và notification.email mỗi cái Ready = 1.",
    command:
      'docker exec course_english-rabbitmq-1 rabbitmqadmin -u courseenglish -p courseenglish list queues name messages',
  },
  {
    id: "consume",
    title: "Consume (worker giả lập)",
    description: "Get messages trên queue → đọc JSON → Ack (xóa khỏi queue).",
    command:
      "docker exec course_english-rabbitmq-1 rabbitmqadmin -u courseenglish -p courseenglish get queue=notification.in-app ackmode=ack_requeue_false count=1",
  },
  {
    id: "read-doc",
    title: "Đọc tài liệu repo",
    description: "Chi tiết lệnh và payload: docs/RABBITMQ_LAB.md + REVIEW.html mục 15.",
  },
];

export const curriculumChecklist: { id: string; label: string }[] = [
  { id: "c1", label: "Hiểu vì sao API không loop gửi mail trong request" },
  { id: "c2", label: "Giải thích được Producer / Exchange / Queue / Consumer" },
  { id: "c3", label: "Biết routing key lesson.published vào 2 queue" },
  { id: "c4", label: "Thử routing key sai → không có message trong queue" },
  { id: "c5", label: "Publish + Get message trên Management UI" },
  { id: "c6", label: "So sánh được @Async vs RabbitMQ (bền, retry, scale)" },
  { id: "c7", label: "Vẽ được luồng publish lesson trong Course English" },
];
