import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Box, Button, Chip, MenuItem, TextField, Typography } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { routingKeyOptions } from "./rabbitmqLabContent";

type FlowStep =
  | "idle"
  | "producer"
  | "exchange"
  | "route-in-app"
  | "route-email"
  | "worker-in-app"
  | "worker-email"
  | "done"
  | "dropped";

type QueueState = { inApp: number; email: number };

const DEFAULT_PAYLOAD = `{
  "eventType": "LESSON_PUBLISHED",
  "lessonId": "…",
  "title": "Từ vựng 15A"
}`;

export function RabbitMqFlowSimulator() {
  const [routingKey, setRoutingKey] = useState("lesson.published");
  const [step, setStep] = useState<FlowStep>("idle");
  const [queues, setQueues] = useState<QueueState>({ inApp: 0, email: 0 });
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const option = useMemo(
    () => routingKeyOptions.find((o) => o.key === routingKey) ?? routingKeyOptions[0],
    [routingKey],
  );

  const pushLog = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-8), line]);
  }, []);

  const reset = useCallback(() => {
    setStep("idle");
    setQueues({ inApp: 0, email: 0 });
    setLog([]);
    setRunning(false);
  }, []);

  const runSimulation = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setLog([]);
    setQueues({ inApp: 0, email: 0 });

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const binds = option.bindsTo;

    setStep("producer");
    pushLog("① Producer: LessonServiceImpl gửi 1 message → exchange course.events");
    await wait(700);

    setStep("exchange");
    pushLog(`② Exchange nhận routing_key = "${routingKey}"`);
    await wait(700);

    if (binds.length === 0) {
      setStep("dropped");
      pushLog("✗ Không có binding khớp → message bị drop (không vào queue)");
      setRunning(false);
      return;
    }

    if (binds.includes("in-app")) {
      setStep("route-in-app");
      pushLog("③ Binding → queue notification.in-app (+1)");
      setQueues((q) => ({ ...q, inApp: q.inApp + 1 }));
      await wait(600);
      setStep("worker-in-app");
      pushLog("④ Worker in-app: INSERT notifications + WebSocket push");
      await wait(700);
      setQueues((q) => ({ ...q, inApp: Math.max(0, q.inApp - 1) }));
    }

    if (binds.includes("email")) {
      setStep("route-email");
      pushLog("⑤ Binding → queue notification.email (+1)");
      setQueues((q) => ({ ...q, email: q.email + 1 }));
      await wait(600);
      setStep("worker-email");
      pushLog("⑥ Worker email: SMTP gửi từng HS (retry → DLQ nếu fail)");
      await wait(700);
      setQueues((q) => ({ ...q, email: Math.max(0, q.email - 1) }));
    }

    setStep("done");
    pushLog("✓ API đã trả 200 từ lâu — việc nền chạy song song");
    setRunning(false);
  }, [option.bindsTo, pushLog, routingKey, running]);

  const nodeClass = (id: string) => {
    const active = new Set<string>();
    if (step === "producer") active.add("producer");
    if (step === "exchange" || step === "dropped") active.add("exchange");
    if (step === "route-in-app" || step === "worker-in-app") {
      active.add("exchange");
      active.add("in-app");
    }
    if (step === "route-email" || step === "worker-email") {
      active.add("exchange");
      active.add("email");
    }
    if (step === "done") {
      active.add("producer");
      active.add("exchange");
      active.add("in-app");
      active.add("email");
    }
    return `rmq-sim__node ${active.has(id) ? "rmq-sim__node--active" : ""}`;
  };

  return (
    <Box className="rmq-sim">
      <Typography className="rmq-sim__lead">
        Bấm <strong>Chạy mô phỏng</strong> để xem message đi từ API publish lesson → exchange → queue → worker.
        Thử đổi routing key sang <code>lesson.wrong</code> để thấy message không vào queue.
      </Typography>

      <Box className="rmq-sim__controls">
        <TextField
          select
          size="small"
          label="Routing key"
          value={routingKey}
          onChange={(e) => {
            reset();
            setRoutingKey(e.target.value);
          }}
          sx={{ minWidth: 220 }}
        >
          {routingKeyOptions.map((o) => (
            <MenuItem key={o.key} value={o.key}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={runSimulation}
          disabled={running}
        >
          Chạy mô phỏng
        </Button>
        <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={reset}>
          Reset
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {option.description}
      </Typography>

      <Box className="rmq-sim__diagram">
        <Box className={nodeClass("producer")}>
          <span className="rmq-sim__node-tag">Producer</span>
          <strong>LessonServiceImpl</strong>
          <span className="rmq-sim__node-sub">convertAndSend()</span>
        </Box>
        <Box className="rmq-sim__arrow" aria-hidden>
          →
        </Box>
        <Box className={nodeClass("exchange")}>
          <span className="rmq-sim__node-tag">Exchange</span>
          <strong>course.events</strong>
          <span className="rmq-sim__node-sub">topic</span>
        </Box>

        <Box className="rmq-sim__branches">
          <Box className="rmq-sim__branch">
            <Box className="rmq-sim__arrow-down">↓</Box>
            <Box className={nodeClass("in-app")}>
              <span className="rmq-sim__node-tag">Queue</span>
              <strong>notification.in-app</strong>
              <Chip size="small" label={`Ready: ${queues.inApp}`} className="rmq-sim__chip" />
            </Box>
            <Box className="rmq-sim__arrow-down">↓</Box>
            <Box className={`rmq-sim__node rmq-sim__node--worker ${step === "worker-in-app" || step === "done" ? "rmq-sim__node--active" : ""}`}>
              <span className="rmq-sim__node-tag">Worker</span>
              <strong>NotificationWorker</strong>
              <span className="rmq-sim__node-sub">MySQL + WebSocket</span>
            </Box>
          </Box>

          <Box className="rmq-sim__branch">
            <Box className="rmq-sim__arrow-down">↓</Box>
            <Box className={nodeClass("email")}>
              <span className="rmq-sim__node-tag">Queue</span>
              <strong>notification.email</strong>
              <Chip size="small" label={`Ready: ${queues.email}`} className="rmq-sim__chip" />
            </Box>
            <Box className="rmq-sim__arrow-down">↓</Box>
            <Box className={`rmq-sim__node rmq-sim__node--worker ${step === "worker-email" || step === "done" ? "rmq-sim__node--active" : ""}`}>
              <span className="rmq-sim__node-tag">Worker</span>
              <strong>EmailWorker</strong>
              <span className="rmq-sim__node-sub">SMTP → DLQ</span>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className="rmq-sim__payload">
        <Typography variant="caption" color="text.secondary">
          Payload mẫu
        </Typography>
        <pre>{DEFAULT_PAYLOAD}</pre>
      </Box>

      {log.length > 0 ? (
        <Box className="rmq-sim__log" role="log" aria-live="polite">
          {log.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </Box>
      ) : null}

      {step === "dropped" ? (
        <Box className="rmq-sim__warn">
          Bài học: routing key phải khớp binding. Sai key = không có worker nào nhận.
        </Box>
      ) : null}
    </Box>
  );
}
