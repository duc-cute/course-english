import { paths } from "../../shared/constants/paths";

const adminRoot = `/${paths.ADMIN}`;

/** Tiêu đề header theo route admin */
export function getAdminPageTitle(pathname: string): string {
  if (pathname === adminRoot || pathname === `${adminRoot}/`) {
    return "Tổng quan";
  }
  if (/^\/admin\/manage-lesson\/[^/]+\/edit$/.test(pathname)) {
    return "Soạn bài học";
  }
  const map: Record<string, string> = {
    [`${adminRoot}/${paths.MANAGE_USER}`]: "Quản lý người dùng",
    [`${adminRoot}/${paths.MANAGE_ROLE}`]: "Quản lý vai trò",
    [`${adminRoot}/${paths.MANAGE_CLASSROOM}`]: "Quản lý lớp học",
    [`${adminRoot}/${paths.MANAGE_SUBJECT}`]: "Quản lý môn học",
    [`${adminRoot}/${paths.MANAGE_LESSON}`]: "Quản lý bài học",
    [`${adminRoot}/manage-lesson`]: "Quản lý bài học",
    [`${adminRoot}/${paths.MANAGE_ENROLLMENT}`]: "Quản lý phân lớp",
    [`${adminRoot}/${paths.REVIEW_DOC}`]: "Review & định hướng",
    [`${adminRoot}/${paths.MANAGE_QUESTIONS}`]: "Thư viện câu hỏi",
    [`${adminRoot}/${paths.MANAGE_VOCABULARY_SETS}`]: "Bộ từ vựng",
    [`${adminRoot}/${paths.USAGE_GUIDE}`]: "Hướng dẫn sử dụng",
  };
  return map[pathname] ?? "Course English Admin";
}
