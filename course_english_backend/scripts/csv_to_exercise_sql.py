#!/usr/bin/env python3
"""
Đọc CSV câu hỏi MCQ → sinh file SQL gắn EXERCISE_SET vào lesson theo lesson_title.

CSV mẫu: docs/import/vocab_daily_words_questions.csv
Mở bằng Excel, sửa dòng, lưu CSV UTF-8, rồi chạy:

  python scripts/csv_to_exercise_sql.py docs/import/vocab_daily_words_questions.csv > import_generated.sql
  mysql -u root -p course_english < import_generated.sql
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    if len(sys.argv) < 2:
        print("Usage: python csv_to_exercise_sql.py <path.csv>", file=sys.stderr)
        sys.exit(1)

    path = Path(sys.argv[1])
    rows = list(csv.DictReader(path.open(encoding="utf-8-sig")))
    if not rows:
        print("-- CSV trống", file=sys.stderr)
        sys.exit(1)

    lesson_title = rows[0]["lesson_title"].strip()
    block_title = rows[0].get("block_title", "Bài tập").strip()
    instruction = rows[0].get("instruction", "Chọn đáp án đúng").strip()

    questions = []
    for r in rows:
        qid = r["question_id"].strip()
        questions.append(
            {
                "id": qid,
                "type": "MULTIPLE_CHOICE",
                "prompt": {"text": r["prompt_en"].strip(), "lang": "en"},
                "choices": [
                    {"id": "a", "text": r["choice_a"].strip()},
                    {"id": "b", "text": r["choice_b"].strip()},
                    {"id": "c", "text": r["choice_c"].strip()},
                    {"id": "d", "text": r["choice_d"].strip()},
                ],
                "correctChoiceId": r["correct_choice_id"].strip(),
                "explanation": r.get("explanation", "").strip(),
            }
        )

    payload = {
        "title": block_title,
        "instruction": instruction,
        "presentation": "stepped",
        "shuffleQuestions": False,
        "shuffleOptions": True,
        "passScorePercent": 80,
        "questions": questions,
    }
    payload_json = json.dumps(payload, ensure_ascii=False).replace("'", "''")

    print("-- Generated from", path.name)
    print("USE `course_english`;")
    print("ALTER TABLE `lesson_blocks` MODIFY COLUMN `block_type` VARCHAR(64) NOT NULL;")
    print(f"SET @lesson_title = '{lesson_title.replace(chr(39), chr(39)+chr(39))}';")
    print(
        "SET @lesson_id = (SELECT `id` FROM `lessons` WHERE `title` = @lesson_title AND `voided` = 0 ORDER BY `created_at` DESC LIMIT 1);"
    )
    print("DELETE FROM `lesson_blocks` WHERE `lesson_id` = @lesson_id AND `block_type` = 'EXERCISE_SET';")
    print("INSERT INTO `lesson_blocks` (`id`, `lesson_id`, `block_type`, `display_order`, `payload_json`, `created_at`, `created_by`, `voided`)")
    print(
        "SELECT UUID(), @lesson_id, 'EXERCISE_SET', COALESCE((SELECT MAX(`display_order`) FROM `lesson_blocks` lb WHERE lb.`lesson_id` = @lesson_id), 0) + 1,"
    )
    print(f"  '{payload_json}', NOW(6), 'csv-import', 0")
    print("WHERE @lesson_id IS NOT NULL;")


if __name__ == "__main__":
    main()
