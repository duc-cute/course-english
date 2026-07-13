import { lazy } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { AiChatWidgetHost } from "../shared/ai/AiChatWidgetHost";
import { RequireAuth } from "../shared/auth/RequireAuth";
import { paths } from "../shared/constants/paths";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { ManageClassroomPage } from "../pages/admin/ManageClassroomPage";
import { ManageEnrollmentPage } from "../pages/admin/ManageEnrollmentPage";
import { ManageRolePage } from "../pages/admin/ManageRolePage";
import { ManageSubjectPage } from "../pages/admin/ManageSubjectPage";
import { ManageLessonPage } from "../pages/admin/ManageLessonPage";
import { LessonEditorPage } from "../pages/admin/LessonEditorPage";
import { ManageUserPage } from "../pages/admin/ManageUserPage";
import { ReviewDocPage } from "../pages/admin/ReviewDocPage";
import { ManageQuestionsPage } from "../pages/admin/ManageQuestionsPage";
import { ManageExamPapersPage } from "../pages/admin/ManageExamPapersPage";
import { ExamPaperEditorPage } from "../pages/admin/ExamPaperEditorPage";
import { ManageVocabularySetsPage } from "../pages/admin/ManageVocabularySetsPage";
import { ManageVocabularyJourneysPage } from "../pages/admin/ManageVocabularyJourneysPage";
import { ManageVocabularyJourneyDetailPage } from "../pages/admin/ManageVocabularyJourneyDetailPage";
import { ManageStoriesPage } from "../pages/admin/ManageStoriesPage";
import { ManageVocabularyWordsPage } from "../pages/admin/ManageVocabularyWordsPage";
import { ManageSystemConfigPage } from "../pages/admin/ManageSystemConfigPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { StudentHomePage } from "../pages/student/StudentHomePage";
import { StudentLessonListPage } from "../pages/student/StudentLessonListPage";
import { StudentUsageGuidePage } from "../pages/student/StudentUsageGuidePage";
import { LessonReaderPage } from "../pages/student/LessonReaderPage";
import { StudentPathPage } from "../pages/student/StudentPathPage";
import { StudentVocabPage } from "../pages/student/StudentVocabPage";
import { StudentVocabSetPage } from "../pages/student/StudentVocabSetPage";
import { VocabExploreJourneyPage } from "../student/vocab/VocabExploreJourneyPage";
import { VocabTopicSetsPage } from "../student/vocab/VocabTopicSetsPage";
import { StudentProfilePage } from "../pages/student/StudentProfilePage";
import { StudentLeaderboardPage } from "../pages/student/StudentLeaderboardPage";
import { StudentStoryListPage } from "../pages/student/StudentStoryListPage";
import { StudentNotebookPage } from "../pages/student/StudentNotebookPage";
import { StoryReaderPage } from "../pages/student/StoryReaderPage";
import { TeacherUsageGuidePage } from "../pages/admin/TeacherUsageGuidePage";
import { TeacherSchedulePage } from "../pages/admin/TeacherSchedulePage";
import { TeacherStudentSupportPage } from "../pages/admin/TeacherStudentSupportPage";
import { AiAssistantPage } from "../pages/admin/AiAssistantPage";
import { ActivityLogsPage } from "../pages/admin/ActivityLogsPage";
import { RabbitMqLabPage } from "../pages/admin/RabbitMqLabPage";

const LazyAdminLayout = lazy(async () => {
  const module = await import("../layouts/admin/AdminLayout");
  return { default: module.AdminLayout };
});

const LazyStudentAppLayout = lazy(async () => {
  const module = await import("../layouts/student/StudentAppLayout");
  return { default: module.StudentAppLayout };
});

const LazyStudentPlayerLayout = lazy(async () => {
  const module = await import("../layouts/student/StudentPlayerLayout");
  return { default: module.StudentPlayerLayout };
});

const studentHome = `/${paths.STUDENT}`;

function AppRoot() {
  return (
    <>
      <Outlet />
      <AiChatWidgetHost />
    </>
  );
}

export const appRouter = createBrowserRouter([
  {
    element: <AppRoot />,
    children: [
  {
    path: "/",
    element: <Navigate to={studentHome} replace />,
  },
  {
    path: paths.LOGIN,
    element: <LoginPage />,
  },
  {
    path: paths.REGISTER,
    element: <RegisterPage />,
  },
  {
    path: paths.FORGOT_PASSWORD,
    element: <ForgotPasswordPage />,
  },
  {
    path: paths.RESET_PASSWORD,
    element: <ResetPasswordPage />,
  },
  {
    path: paths.STUDENT,
    element: (
      <RequireAuth>
        <Outlet />
      </RequireAuth>
    ),
    children: [
      {
        path: paths.STUDENT_STORY_READ,
        element: <StoryReaderPage />,
      },
      {
        element: <LazyStudentAppLayout />,
        children: [
          {
            index: true,
            element: <StudentHomePage />,
          },
          {
            path: paths.STUDENT_LESSONS,
            element: <StudentLessonListPage />,
          },
          {
            path: paths.STUDENT_PATH,
            element: <StudentPathPage />,
          },
          {
            path: paths.STUDENT_VOCAB,
            element: <StudentVocabPage />,
          },
          {
            path: `${paths.STUDENT_VOCAB}/journeys/:journeyId`,
            element: <VocabExploreJourneyPage />,
          },
          {
            path: `${paths.STUDENT_VOCAB}/topics/:topicId`,
            element: <VocabTopicSetsPage />,
          },
          {
            path: `${paths.STUDENT_VOCAB}/:setId`,
            element: <StudentVocabSetPage />,
          },
          {
            path: paths.STUDENT_STORIES,
            element: <StudentStoryListPage />,
          },
          {
            path: `${paths.STUDENT_STORIES}/notebook`,
            element: <StudentNotebookPage />,
          },
          {
            path: paths.STUDENT_PROFILE,
            element: <StudentProfilePage />,
          },
          {
            path: paths.STUDENT_LEADERBOARD,
            element: <StudentLeaderboardPage />,
          },
          {
            path: paths.USAGE_GUIDE,
            element: <StudentUsageGuidePage />,
          },
        ],
      },
      {
        element: <LazyStudentPlayerLayout />,
        children: [
          {
            path: paths.STUDENT_LESSON_READ,
            element: <LessonReaderPage />,
          },
        ],
      },
    ],
  },
  {
    path: paths.ADMIN,
    element: (
      <RequireAuth adminOnly>
        <LazyAdminLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: paths.SCHEDULE,
        element: <TeacherSchedulePage />,
      },
      {
        path: paths.STUDENTS_NEED_SUPPORT,
        element: <TeacherStudentSupportPage />,
      },
      {
        path: paths.MANAGE_USER,
        element: <ManageUserPage />,
      },
      {
        path: paths.MANAGE_ROLE,
        element: <ManageRolePage />,
      },
      {
        path: paths.MANAGE_CLASSROOM,
        element: <ManageClassroomPage />,
      },
      {
        path: paths.MANAGE_SUBJECT,
        element: <ManageSubjectPage />,
      },
      {
        path: paths.MANAGE_ENROLLMENT,
        element: <ManageEnrollmentPage />,
      },
      {
        path: paths.MANAGE_LESSON,
        element: <ManageLessonPage />,
      },
      {
        path: paths.MANAGE_QUESTIONS,
        element: <ManageQuestionsPage />,
      },
      {
        path: paths.MANAGE_EXAM_PAPERS,
        element: <ManageExamPapersPage />,
      },
      {
        path: paths.EXAM_PAPER_EDITOR,
        element: <ExamPaperEditorPage />,
      },
      {
        path: paths.MANAGE_VOCABULARY_WORDS,
        element: <ManageVocabularyWordsPage />,
      },
      {
        path: paths.MANAGE_VOCABULARY_SETS,
        element: <ManageVocabularySetsPage />,
      },
      {
        path: paths.MANAGE_VOCABULARY_JOURNEYS,
        element: <ManageVocabularyJourneysPage />,
      },
      {
        path: `${paths.MANAGE_VOCABULARY_JOURNEYS}/:journeyId`,
        element: <ManageVocabularyJourneyDetailPage />,
      },
      {
        path: paths.MANAGE_STORIES,
        element: <ManageStoriesPage />,
      },
      {
        path: paths.MANAGE_SYSTEM_CONFIG,
        element: <ManageSystemConfigPage />,
      },
      {
        path: "manage-lesson/:lessonId/edit",
        element: <LessonEditorPage />,
      },
      {
        path: paths.REVIEW_DOC,
        element: <ReviewDocPage />,
      },
      {
        path: paths.AI_ASSISTANT,
        element: <AiAssistantPage />,
      },
      {
        path: paths.ACTIVITY_LOGS,
        element: <ActivityLogsPage />,
      },
      {
        path: paths.USAGE_GUIDE,
        element: <TeacherUsageGuidePage />,
      },
      {
        path: paths.RABBITMQ_LAB,
        element: <RabbitMqLabPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={studentHome} replace />,
  },
    ],
  },
]);
