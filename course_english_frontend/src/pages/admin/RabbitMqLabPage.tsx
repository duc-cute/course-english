import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { RabbitMqFlowSimulator } from "../../admin/learn/rabbitmq/RabbitMqFlowSimulator";
import {
  RABBITMQ_MGMT_URL,
  RABBITMQ_MGMT_USER,
  curriculumChecklist,
  labSteps,
  rabbitmqLessons,
} from "../../admin/learn/rabbitmq/rabbitmqLabContent";
import "../../styles/admin-rabbitmq-lab.css";

const PROGRESS_KEY = "ce-rabbitmq-lab-progress";

type TabId = "essence" | "simulate" | "curriculum" | "lab" | "compare";

function loadProgress(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveProgress(next: Record<string, boolean>) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

export function RabbitMqLabPage() {
  const [tab, setTab] = useState<TabId>("essence");
  const [progress, setProgress] = useState<Record<string, boolean>>(loadProgress);
  const [revealedQuiz, setRevealedQuiz] = useState<Record<string, boolean>>({});

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const toggleCheck = useCallback((id: string) => {
    setProgress((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const doneCount = curriculumChecklist.filter((c) => progress[c.id]).length;
  const progressPct = Math.round((doneCount / curriculumChecklist.length) * 100);

  return (
    <div className="rmq-lab">
      <header className="rmq-lab__hero">
        <div>
          <p className="rmq-lab__eyebrow">Hạ tầng V2 · Học thực hành</p>
          <h1 className="rmq-lab__title">Học RabbitMQ</h1>
          <p className="rmq-lab__subtitle">
            Hiểu bản chất message queue qua Course English — từ khái niệm đến lab Docker local.
            Mục tiêu: tự tin tích hợp notify publish lesson (mục 15 REVIEW).
          </p>
        </div>
        <Box className="rmq-lab__hero-actions">
          <Button
            variant="contained"
            startIcon={<OpenInNewIcon />}
            href={RABBITMQ_MGMT_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Management UI
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 0.75, opacity: 0.75 }}>
            {RABBITMQ_MGMT_USER} / courseenglish · :15672
          </Typography>
        </Box>
      </header>

      <Box className="rmq-lab__progress-strip">
        <Typography variant="body2" fontWeight={600}>
          Tiến độ lộ trình: {doneCount}/{curriculumChecklist.length} ({progressPct}%)
        </Typography>
        <Box className="rmq-lab__progress-bar" role="progressbar" aria-valuenow={progressPct}>
          <span style={{ width: `${progressPct}%` }} />
        </Box>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v: TabId) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        className="rmq-lab__tabs"
      >
        <Tab value="essence" label="1. Bản chất" />
        <Tab value="simulate" label="2. Mô phỏng" />
        <Tab value="curriculum" label="3. Lộ trình" />
        <Tab value="lab" label="4. Lab local" />
        <Tab value="compare" label="5. @Async vs MQ" />
      </Tabs>

      {tab === "essence" ? (
        <section className="rmq-lab__panel">
          <Typography className="rmq-lab__panel-intro">
            Đọc lần lượt — mỗi thẻ là một khái niệm cốt lõi, gắn trực tiếp code Course English hiện tại.
          </Typography>
          <div className="rmq-lab__cards">
            {rabbitmqLessons.map((lesson, index) => (
              <article key={lesson.id} className="rmq-lab__card">
                <div className="rmq-lab__card-head">
                  <span className="rmq-lab__card-emoji" aria-hidden>
                    {lesson.emoji}
                  </span>
                  <div>
                    <span className="rmq-lab__card-num">Khái niệm {index + 1}</span>
                    <h2>{lesson.title}</h2>
                  </div>
                </div>
                <p className="rmq-lab__essence">{lesson.essence}</p>
                <aside className="rmq-lab__analogy">
                  <strong>Ẩn dụ:</strong> {lesson.analogy}
                </aside>
                <p className="rmq-lab__in-app">
                  <strong>Trong app:</strong> {lesson.inCourseEnglish}
                </p>
                {lesson.quiz ? (
                  <Box className="rmq-lab__quiz">
                    <Typography variant="body2" fontWeight={600}>
                      {lesson.quiz.question}
                    </Typography>
                    {revealedQuiz[lesson.id] ? (
                      <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                        → {lesson.quiz.answer}
                      </Typography>
                    ) : (
                      <Button
                        size="small"
                        sx={{ mt: 0.5 }}
                        onClick={() => setRevealedQuiz((p) => ({ ...p, [lesson.id]: true }))}
                      >
                        Xem đáp án
                      </Button>
                    )}
                  </Box>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "simulate" ? (
        <section className="rmq-lab__panel">
          <RabbitMqFlowSimulator />
        </section>
      ) : null}

      {tab === "curriculum" ? (
        <section className="rmq-lab__panel">
          <Typography className="rmq-lab__panel-intro">
            Tick khi bạn đã làm / hiểu. Lưu trên trình duyệt — quay lại sau vẫn giữ tiến độ.
          </Typography>
          <ul className="rmq-lab__checklist">
            {curriculumChecklist.map((item) => {
              const checked = Boolean(progress[item.id]);
              return (
                <li key={item.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleCheck(item.id)}
                        icon={<RadioButtonUncheckedIcon />}
                        checkedIcon={<CheckCircleOutlineIcon />}
                      />
                    }
                    label={item.label}
                  />
                </li>
              );
            })}
          </ul>
          <Box className="rmq-lab__tip">
            <strong>Gợi ý thứ tự học:</strong> Bản chất → Mô phỏng (thử lesson.wrong) → Lab local →
            tick lộ trình → đọc tab @Async vs MQ.
          </Box>
        </section>
      ) : null}

      {tab === "lab" ? (
        <section className="rmq-lab__panel">
          <Typography className="rmq-lab__panel-intro">
            Làm tay trên máy — cần Docker. Chi tiết: <code>docs/RABBITMQ_LAB.md</code> trong repo.
          </Typography>
          <ol className="rmq-lab__lab-steps">
            {labSteps.map((step, index) => (
              <li key={step.id} className="rmq-lab__lab-step">
                <span className="rmq-lab__lab-step-num">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  {step.hint ? (
                    <Typography variant="body2" color="text.secondary">
                      {step.hint}
                    </Typography>
                  ) : null}
                  {step.command ? (
                    <Box className="rmq-lab__cmd">
                      <code>{step.command}</code>
                      <Button
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        onClick={() => copyText(step.command!)}
                      >
                        Copy
                      </Button>
                    </Box>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {tab === "compare" ? (
        <section className="rmq-lab__panel">
          <div className="rmq-lab__compare-grid">
            <article className="rmq-lab__compare-col">
              <h3>@Async (P1 — đang dùng)</h3>
              <ul>
                <li>
                  <code>LessonPublishedNotifierImpl</code> → 2 method @Async
                </li>
                <li>Setup nhanh, không cần Docker</li>
                <li>Restart BE → việc đang chạy có thể mất</li>
                <li>Retry email phải tự code</li>
                <li>2 instance BE → 2 lần @Async (cần cẩn thận)</li>
              </ul>
              <p className="rmq-lab__when">Dùng khi: pilot &lt; 50 HS, 1 server.</p>
            </article>
            <article className="rmq-lab__compare-col rmq-lab__compare-col--mq">
              <h3>RabbitMQ (V2 — kế hoạch)</h3>
              <ul>
                <li>API chỉ <code>convertAndSend</code> 1 message</li>
                <li>Message durable — survive restart</li>
                <li>Retry + DLQ cho email</li>
                <li>Nhiều worker / nhiều BE instance chia queue</li>
                <li>WebSocket + MySQL giữ nguyên</li>
              </ul>
              <p className="rmq-lab__when">Dùng khi: fan-out cả lớp, cần bền &amp; scale.</p>
            </article>
          </div>

          <pre className="rmq-lab__ascii">{`HIỆN TẠI                          SAU RABBITMQ
─────────                          ────────────
POST publish                       POST publish
  → MySQL                            → MySQL
  → @Async notify                    → RabbitMQ (1 msg)
  → @Async email                     → 200 OK ngay
  → 200 OK
                                   Worker → INSERT + WS
                                   Worker → SMTP`}</pre>

          <Box className="rmq-lab__three-layers">
            <h3>Ba lớp trong Course English (không thay nhau)</h3>
            <table>
              <thead>
                <tr>
                  <th>Lớp</th>
                  <th>Làm gì</th>
                  <th>Ví dụ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Redis</td>
                  <td>Cache đọc nhanh</td>
                  <td>lesson:detail</td>
                </tr>
                <tr>
                  <td>RabbitMQ</td>
                  <td>Việc nền bền</td>
                  <td>notify + email</td>
                </tr>
                <tr>
                  <td>WebSocket</td>
                  <td>Push realtime</td>
                  <td>chuông HS online</td>
                </tr>
                <tr>
                  <td>MySQL</td>
                  <td>Nguồn sự thật</td>
                  <td>bảng notifications</td>
                </tr>
              </tbody>
            </table>
          </Box>
        </section>
      ) : null}
    </div>
  );
}
