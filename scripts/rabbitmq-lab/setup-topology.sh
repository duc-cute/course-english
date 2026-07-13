#!/usr/bin/env sh
# Lab: tạo exchange + queues giống kế hoạch REVIEW mục 15.3
# Chạy sau khi: docker compose -f docker-compose.infra.yml up -d rabbitmq

set -e

RABBIT_USER="${RABBIT_USER:-courseenglish}"
RABBIT_PASS="${RABBIT_PASS:-courseenglish}"
CONTAINER="${RABBIT_CONTAINER:-course_english-rabbitmq-1}"

rabbitmqctl() {
  docker exec "$CONTAINER" rabbitmqctl "$@"
}

echo "==> Waiting for RabbitMQ..."
until rabbitmqctl status >/dev/null 2>&1; do
  sleep 2
done

echo "==> Exchange course.events (topic)"
rabbitmqctl eval 'rabbit_exchange:declare({resource, <<"/">>, exchange, <<"course.events">>}, topic, true, false, false, []).'

echo "==> Queues"
for q in notification.in-app notification.email notification.dlq; do
  rabbitmqctl eval "rabbit_amqqueue:declare({resource, <<\"/\">>, queue, <<\"$q\">>}, true, false, [], none, <<\"courseenglish\">>)."
done

echo "==> Bindings (topic)"
# in-app + email nhận lesson.published
rabbitmqctl eval 'rabbit_binding:add({binding, {resource, <<"/">>, exchange, <<"course.events">>}, <<"lesson.published">>, {resource, <<"/">>, queue, <<"notification.in-app">>}, []}).'
rabbitmqctl eval 'rabbit_binding:add({binding, {resource, <<"/">>, exchange, <<"course.events">>}, <<"lesson.published">>, {resource, <<"/">>, queue, <<"notification.email">>}, []}).'

echo "==> Done. Management UI: http://localhost:15672 (courseenglish / courseenglish)"
