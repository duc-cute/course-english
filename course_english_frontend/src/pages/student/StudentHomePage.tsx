import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import { Box, Button, CardContent, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGetLatestLessonPracticeAttempt, type LessonPracticeAttemptBrief } from "../../shared/api/lessonPracticeAttempt";
import { ContinueLearningCard } from "../../student/components/ContinueLearningCard";
import { resolveContinueLearning } from "../../student/lessonProgressSync";
import type { LessonProgressEntry } from "../../student/lessonProgressStorage";
import { paths } from "../../shared/constants/paths";
import "../../styles/student-lessons.css";

export function StudentHomePage() {
  const [continueProgress, setContinueProgress] = useState<LessonProgressEntry | null>(null);
  const [continuePractice, setContinuePractice] = useState<LessonPracticeAttemptBrief | null>(null);

  useEffect(() => {
    void resolveContinueLearning().then(setContinueProgress);
  }, []);

  useEffect(() => {
    if (!continueProgress?.lessonId || continueProgress.lastTab !== "practice") {
      setContinuePractice(null);
      return;
    }
    void apiGetLatestLessonPracticeAttempt(continueProgress.lessonId).then(setContinuePractice);
  }, [continueProgress?.lessonId, continueProgress?.lastTab]);

  return (
    <div className="student-page">
      <h1 className="student-page-title">Chào bạn!</h1>
      <p className="student-page-subtitle">
        Course English — học đọc, nghe và làm bài tiếng Anh theo từng chủ đề.
      </p>

      {continueProgress ? (
        <ContinueLearningCard progress={continueProgress} practiceLatest={continuePractice} />
      ) : null}

      <div className="student-home-grid">
        <Box className="student-glass-card student-glass-card--primary">
          <CardContent>
            <div className="student-glass-card-icon student-glass-card-icon--teal">
              <ArticleOutlinedIcon />
            </div>
            <Typography fontWeight={700} gutterBottom sx={{ color: "var(--eng-teal-dark, #3730a3)" }}>
              Bài học
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "var(--eng-on-surface-variant)" }}>
              Danh sách bài đã publish theo môn — có mục lục và tiến độ đọc.
            </Typography>
            <Button
              className="student-btn-teal"
              component={Link}
              to={`/${paths.STUDENT}/${paths.STUDENT_LESSONS}`}
              variant="contained"
              size="small"
            >
              Xem bài học
            </Button>
          </CardContent>
        </Box>

        <Box className="student-glass-card">
          <CardContent>
            <div className="student-glass-card-icon student-glass-card-icon--purple">
              <QuizOutlinedIcon />
            </div>
            <Typography fontWeight={700} gutterBottom>
              Quiz & luyện tập
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "var(--eng-on-surface-variant)" }}>
              Làm bài trắc nghiệm và ôn tập — sắp có ở Phase P2.
            </Typography>
            <Button className="student-btn-teal-outlined" variant="outlined" size="small" disabled>
              Sắp ra mắt
            </Button>
          </CardContent>
        </Box>
      </div>
    </div>
  );
}
