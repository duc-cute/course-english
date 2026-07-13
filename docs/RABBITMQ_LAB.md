# RabbitMQ — Lab local (Course English)

Topology theo `course_english_frontend/docs/REVIEW.html` mục 15.3.

## 1. Bật RabbitMQ

```bash
cd course_english
docker compose -f docker-compose.infra.yml up -d rabbitmq
```

| Dịch vụ | URL / port |
|---------|------------|
| AMQP | `localhost:5672` |
| Management UI | http://localhost:15672 |
| User / pass | `courseenglish` / `courseenglish` |

Đợi healthcheck xanh: `docker compose -f docker-compose.infra.yml ps`

## 2. Tạo topology (Management UI — khuyên dùng lần đầu)

### Exchange

1. **Admin → Exchanges → Add exchange**
2. Name: `course.events`, Type: `topic`, Durable: ✓

### Queues

Tạo 3 queue durable:

- `notification.in-app`
- `notification.email`
- `notification.dlq`

### Bindings

Từ exchange `course.events`:

| To queue | Routing key |
|----------|-------------|
| `notification.in-app` | `lesson.published` |
| `notification.email` | `lesson.published` |

(DLQ gắn sau khi có worker + dead-letter policy.)

## 3. Gửi message thử

**Admin → Exchanges → `course.events` → Publish message**

- Routing key: `lesson.published`
- Payload:

```json
{
  "eventType": "LESSON_PUBLISHED",
  "lessonId": "11111111-1111-1111-1111-111111111111",
  "classroomId": "22222222-2222-2222-2222-222222222222",
  "subjectId": "33333333-3333-3333-3333-333333333333",
  "title": "Lab: Từ vựng 15A",
  "actorUserId": "44444444-4444-4444-4444-444444444444"
}
```

**Kiểm tra:** **Queues** → `notification.in-app` và `notification.email` mỗi queue **Ready = 1**.

**Get messages** trên từng queue → xem JSON → **Ack** (xóa khỏi queue).

## 4. Script (tuỳ chọn)

```powershell
# Tạo exchange + queues (Windows)
.\scripts\rabbitmq-lab\setup-topology.ps1

# Gửi message thử (cần Python + pika: pip install pika)
.\scripts\rabbitmq-lab\publish-test-message.ps1

# Hoặc một lệnh docker (không cần Python):
docker exec course_english-rabbitmq-1 sh -c "rabbitmqadmin -u courseenglish -p courseenglish publish exchange=course.events routing_key=lesson.published payload='{\"eventType\":\"LESSON_PUBLISHED\",\"lessonId\":\"11111111-1111-1111-1111-111111111111\",\"title\":\"Lab test\"}'"
docker exec course_english-rabbitmq-1 rabbitmqadmin -u courseenglish -p courseenglish list queues name messages
```

## 5. Bước tiếp (tích hợp BE)

Khi sẵn sàng code Spring:

- `spring-boot-starter-amqp`
- `app.rabbitmq.enabled=true`
- `CourseEventPublisher` thay hook trong `LessonPublishedNotifierImpl`
- `@RabbitListener` trên `notification.in-app` / `notification.email`

FE **không đổi** — vẫn STOMP `/ws/notifications` + `GET /notifications`.
