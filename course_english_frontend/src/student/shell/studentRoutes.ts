import { paths } from "../../shared/constants/paths";
import { isStudentLessonPlayerPath } from "./studentNavItems";

export type StudentLayoutMode = "app" | "player";

export function resolveStudentLayoutMode(pathname: string): StudentLayoutMode {
  if (isStudentLessonPlayerPath(pathname)) {
    return "player";
  }
  return "app";
}

export function studentLessonPlayerPattern(): string {
  return `${paths.STUDENT}/${paths.STUDENT_LESSON_READ}`;
}
