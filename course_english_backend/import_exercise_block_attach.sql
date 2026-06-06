-- =============================================================================
-- Gắn khối BÀI TẬP (EXERCISE_SET) vào lesson ĐÃ CÓ — theo tiêu đề bài
--
-- Dùng khi bạn tạo lesson trên Admin (UUID khác seed) nên editor hiện "0 khối".
--
-- Cách chạy (sửa @lesson_title nếu cần):
--   mysql -u root -p course_english < import_exercise_block_attach.sql
-- =============================================================================

USE `course_english`;

SET NAMES utf8mb4;

-- Fix lỗi 1265: ENUM cũ chưa có EXERCISE_SET (chạy an toàn nhiều lần)
ALTER TABLE `lesson_blocks`
  MODIFY COLUMN `block_type` VARCHAR(64) NOT NULL;

-- ▼ ĐỔI TÊN BÀI CHO KHỚP MÀN "Soạn bài học"
SET @lesson_title = 'Từ vựng demo — Daily words';

SET @lesson_id = (
  SELECT `id` FROM `lessons`
  WHERE `title` = @lesson_title AND `voided` = 0
  ORDER BY `created_at` DESC
  LIMIT 1
);

SET @now = NOW(6);

-- Xóa block EXERCISE_SET cũ của bài này (nếu import lại)
DELETE FROM `lesson_blocks`
WHERE `lesson_id` = @lesson_id
  AND `block_type` = 'EXERCISE_SET';

INSERT INTO `lesson_blocks` (
  `id`, `lesson_id`, `block_type`, `display_order`, `payload_json`,
  `created_at`, `created_by`, `updated_at`, `updated_by`, `voided`
)
SELECT
  UUID(),
  @lesson_id,
  'EXERCISE_SET',
  COALESCE((SELECT MAX(`display_order`) FROM `lesson_blocks` lb WHERE lb.`lesson_id` = @lesson_id), 0) + 1,
  '{"title":"Từ vựng demo","instruction":"Chọn đáp án đúng","presentation":"stepped","shuffleQuestions":false,"shuffleOptions":true,"passScorePercent":80,"questions":[{"id":"q1","type":"MULTIPLE_CHOICE","prompt":{"text":"apple","lang":"en"},"choices":[{"id":"a","text":"quả cam"},{"id":"b","text":"quả táo"},{"id":"c","text":"quả chuối"},{"id":"d","text":"quả nho"}],"correctChoiceId":"b","explanation":"Apple = quả táo."},{"id":"q2","type":"MULTIPLE_CHOICE","prompt":{"text":"book","lang":"en"},"choices":[{"id":"a","text":"cái bàn"},{"id":"b","text":"cuốn sách"},{"id":"c","text":"cái ghế"},{"id":"d","text":"cửa sổ"}],"correctChoiceId":"b","explanation":"Book = cuốn sách."},{"id":"q3","type":"MULTIPLE_CHOICE","prompt":{"text":"happy","lang":"en"},"choices":[{"id":"a","text":"buồn"},{"id":"b","text":"mệt"},{"id":"c","text":"vui"},{"id":"d","text":"đói"}],"correctChoiceId":"c","explanation":"Happy = vui."},{"id":"q4","type":"MULTIPLE_CHOICE","prompt":{"text":"school","lang":"en"},"choices":[{"id":"a","text":"bệnh viện"},{"id":"b","text":"trường học"},{"id":"c","text":"siêu thị"},{"id":"d","text":"công viên"}],"correctChoiceId":"b","explanation":"School = trường học."},{"id":"q5","type":"MULTIPLE_CHOICE","prompt":{"text":"water","lang":"en"},"choices":[{"id":"a","text":"nước"},{"id":"b","text":"sữa"},{"id":"c","text":"trà"},{"id":"d","text":"nước ngọt"}],"correctChoiceId":"a","explanation":"Water = nước."}]}',
  @now, 'import', NULL, NULL, 0
WHERE @lesson_id IS NOT NULL;

SELECT
  CASE
    WHEN @lesson_id IS NULL THEN CONCAT('KHÔNG TÌM THẤY lesson: "', @lesson_title, '" — kiểm tra title hoặc tạo bài trước.')
    ELSE CONCAT('OK — đã gắn EXERCISE_SET (5 câu MCQ) vào lesson id=', @lesson_id)
  END AS `import_result`;
