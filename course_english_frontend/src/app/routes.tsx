import { lazy } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
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
import { ManageVocabularySetsPage } from "../pages/admin/ManageVocabularySetsPage";
import { ManageVocabularyWordsPage } from "../pages/admin/ManageVocabularyWordsPage";
import { ManageSystemConfigPage } from "../pages/admin/ManageSystemConfigPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { StudentHomePage } from "../pages/student/StudentHomePage";
import { StudentLessonListPage } from "../pages/student/StudentLessonListPage";
import { StudentUsageGuidePage } from "../pages/student/StudentUsageGuidePage";
import { LessonReaderPage } from "../pages/student/LessonReaderPage";
import { StudentPathPage } from "../pages/student/StudentPathPage";
import { StudentVocabPage } from "../pages/student/StudentVocabPage";
import { StudentVocabSetPage } from "../pages/student/StudentVocabSetPage";
import { StudentProfilePage } from "../pages/student/StudentProfilePage";
import { StudentLeaderboardPage } from "../pages/student/StudentLeaderboardPage";
import { TeacherUsageGuidePage } from "../pages/admin/TeacherUsageGuidePage";

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

export const appRouter = createBrowserRouter([
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
    path: paths.STUDENT,
    element: (
      <RequireAuth>
        <Outlet />
      </RequireAuth>
    ),
    children: [
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
            path: `${paths.STUDENT_VOCAB}/:setId`,
            element: <StudentVocabSetPage />,
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
      <RequireAuth>
        <LazyAdminLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
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
        path: paths.MANAGE_VOCABULARY_WORDS,
        element: <ManageVocabularyWordsPage />,
      },
      {
        path: paths.MANAGE_VOCABULARY_SETS,
        element: <ManageVocabularySetsPage />,
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
        path: paths.USAGE_GUIDE,
        element: <TeacherUsageGuidePage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={studentHome} replace />,
  },
]);
