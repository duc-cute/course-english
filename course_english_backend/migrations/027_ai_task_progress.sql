-- Progress for AI question-gen polling UI (stream / batch status)
ALTER TABLE ai_tasks
  ADD COLUMN progress_message VARCHAR(512) NULL AFTER error_message,
  ADD COLUMN progress_percent TINYINT UNSIGNED NULL AFTER progress_message;
