# Tạo topology lab RabbitMQ (Windows PowerShell)
# Chạy từ thư mục course_english sau: docker compose -f docker-compose.infra.yml up -d rabbitmq

$ErrorActionPreference = "Stop"
$Container = "course_english-rabbitmq-1"
$User = "courseenglish"
$Pass = "courseenglish"

function Invoke-RabbitAdmin {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    docker exec $Container rabbitmqadmin -u $User -p $Pass @Args
}

Write-Host "Waiting for RabbitMQ..."
do {
    Start-Sleep -Seconds 2
    $ping = docker exec $Container rabbitmq-diagnostics -q ping 2>$null
} while ($LASTEXITCODE -ne 0)

Invoke-RabbitAdmin declare exchange name=course.events type=topic durable=true
Invoke-RabbitAdmin declare queue name=notification.in-app durable=true
Invoke-RabbitAdmin declare queue name=notification.email durable=true
Invoke-RabbitAdmin declare queue name=notification.dlq durable=true
Invoke-RabbitAdmin declare binding source=course.events destination=notification.in-app routing_key=lesson.published
Invoke-RabbitAdmin declare binding source=course.events destination=notification.email routing_key=lesson.published

Write-Host "Done. UI: http://localhost:15672 ($User / $Pass)"
