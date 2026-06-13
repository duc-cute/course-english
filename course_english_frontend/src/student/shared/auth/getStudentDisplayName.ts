import { getStudentAccountInfo } from "./getStudentAccountInfo";

/** Display name for student greeting — JWT claim or fallback. */
export function getStudentDisplayName(): string {
  return getStudentAccountInfo().displayName;
}
