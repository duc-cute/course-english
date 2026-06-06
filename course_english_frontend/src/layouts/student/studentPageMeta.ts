import { paths } from "../../shared/constants/paths";

const studentRoot = `/${paths.STUDENT}`;

export function getStudentPageTitle(pathname: string): string {
  if (/^\/student\/lessons\/[^/]+$/.test(pathname)) {
    return "Đọc bài học";
  }
  const map: Record<string, string> = {
    [studentRoot]: "Trang chủ học tập",
    [`${studentRoot}/${paths.STUDENT_LESSONS}`]: "Bài học",
  };
  return map[pathname] ?? "Học tập";
}
