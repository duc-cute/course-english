import { paths, studentRoutePaths } from "../../shared/constants/paths";

export function getStudentPageTitle(pathname: string): string {
  if (/^\/student\/lessons\/[^/]+$/.test(pathname)) {
    return "Bài học";
  }
  if (/^\/student\/vocab\/[^/]+$/.test(pathname)) {
    return "Ôn từ vựng";
  }

  const map: Record<string, string> = {
    [studentRoutePaths.home]: "Trang chủ",
    [studentRoutePaths.lessons]: "Bài học",
    [studentRoutePaths.path]: "Lộ trình",
    [studentRoutePaths.vocab]: "Từ vựng",
    [studentRoutePaths.profile]: "Hồ sơ",
    [studentRoutePaths.leaderboard]: "Xếp hạng",
    [studentRoutePaths.usageGuide]: "Hướng dẫn",
  };

  return map[pathname] ?? "Học tập";
}

/** @deprecated use studentRoutePaths */
export const studentRoot = `/${paths.STUDENT}`;
