import { lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
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
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { StudentHomePage } from "../pages/student/StudentHomePage";
import { StudentLessonListPage } from "../pages/student/StudentLessonListPage";
import { LessonReaderPage } from "../pages/student/LessonReaderPage";

const LazyAdminLayout = lazy(async () => {
  const module = await import("../layouts/admin/AdminLayout");
  return { default: module.AdminLayout };
});

const LazyStudentLayout = lazy(async () => {
  const module = await import("../layouts/student/StudentLayout");
  return { default: module.StudentLayout };
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
        <LazyStudentLayout />
      </RequireAuth>
    ),
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
        path: `${paths.STUDENT_LESSONS}/:lessonId`,
        element: <LessonReaderPage />,
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
        path: "manage-lesson/:lessonId/edit",
        element: <LessonEditorPage />,
      },
      {
        path: paths.REVIEW_DOC,
        element: <ReviewDocPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={studentHome} replace />,
  },
]);
