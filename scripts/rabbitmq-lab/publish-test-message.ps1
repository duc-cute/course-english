# Lab: gửi 1 message lesson.published vào exchange course.events
# Yêu cầu: pip install pika   (hoặc dùng Management UI — xem docs/RABBITMQ_LAB.md)

$ErrorActionPreference = "Stop"

$body = @{
    eventType   = "LESSON_PUBLISHED"
    lessonId    = "11111111-1111-1111-1111-111111111111"
    classroomId = "22222222-2222-2222-2222-222222222222"
    subjectId   = "33333333-3333-3333-3333-333333333333"
    title       = "Lab: Tu vung 15A"
    actorUserId = "44444444-4444-4444-4444-444444444444"
} | ConvertTo-Json -Compress

$py = @"
import json, pika
props = pika.BasicProperties(content_type='application/json', delivery_mode=2)
conn = pika.BlockingConnection(pika.ConnectionParameters(
    host='localhost', port=5672,
    credentials=pika.PlainCredentials('courseenglish', 'courseenglish')))
ch = conn.channel()
ch.basic_publish(
    exchange='course.events',
    routing_key='lesson.published',
    body=json.dumps($body),
    properties=props)
print('Published lesson.published -> notification.in-app + notification.email')
conn.close()
"@

python -c $py
