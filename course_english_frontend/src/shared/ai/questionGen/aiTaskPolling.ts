/** Poll interval while waiting for async question-generation task. */
export const AI_TASK_POLL_INTERVAL_MS = 2_000;

/**
 * Max wait before UI shows timeout. Align with BE `app.ai.client-poll-timeout-ms` (default 300_000).
 * Formula: 2 × question-gen OpenRouter timeout (180s) + buffer.
 */
export const AI_TASK_POLL_MAX_MS = 300_000;

/**
 * Exam paper generation — align with BE `app.ai.exam-paper-max-task-sec` (default 600s) + buffer.
 */
export const AI_EXAM_PAPER_POLL_MAX_MS = 660_000;

export const AI_TASK_PROCESSING_HINT =
  "Có thể mất 1–3 phút tùy độ dài file và số câu. Vui lòng không đóng cửa sổ.";

export const AI_EXAM_PAPER_PROCESSING_HINT =
  "Sinh đề nhiều phần có thể mất tới 10 phút. Vui lòng không đóng cửa sổ.";

export const AI_GEN_PROCESSING_TIP =
  "Bạn có thể tiếp tục làm việc khác, chúng tôi sẽ thông báo khi hoàn thành!";
