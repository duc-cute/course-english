import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { LessonPracticeAttemptBrief } from "../../shared/api/lessonPracticeAttempt";
import { useHomeDashboard } from "../home/useHomeDashboard";
import type { LessonProgressEntry } from "../lessonProgressStorage";
import { useStudentStats } from "../profile/useStudentStats";
import type { StudentStats } from "../profile/studentStats";
import type { WeeklyStudyDay } from "../home/getWeeklyStudyDays";

type StudentDashboardContextValue = {
  stats: StudentStats;
  practiceSummary: ReturnType<typeof useStudentStats>["practiceSummary"];
  continueProgress: LessonProgressEntry | null;
  continuePractice: LessonPracticeAttemptBrief | null;
  weeklyDays: WeeklyStudyDay[];
  weeklyStreakCount: number;
  loading: boolean;
  statsError: string;
};

const StudentDashboardContext = createContext<StudentDashboardContextValue | null>(null);

export function StudentDashboardProvider({ children }: { children: ReactNode }) {
  const home = useHomeDashboard();
  const studentStats = useStudentStats();

  const value = useMemo<StudentDashboardContextValue>(
    () => ({
      stats: studentStats.stats,
      practiceSummary: studentStats.practiceSummary,
      continueProgress: home.continueProgress,
      continuePractice: home.continuePractice,
      weeklyDays: home.weeklyDays,
      weeklyStreakCount: home.weeklyStreakCount,
      loading: home.loading || studentStats.loading,
      statsError: studentStats.error,
    }),
    [
      home.continueProgress,
      home.continuePractice,
      home.weeklyDays,
      home.weeklyStreakCount,
      home.loading,
      studentStats.stats,
      studentStats.practiceSummary,
      studentStats.loading,
      studentStats.error,
    ],
  );

  return (
    <StudentDashboardContext.Provider value={value}>{children}</StudentDashboardContext.Provider>
  );
}

/** Safe outside StudentAppShell (e.g. Lesson Player layout). */
export function useOptionalStudentDashboard(): StudentDashboardContextValue | null {
  return useContext(StudentDashboardContext);
}

export function useStudentDashboard(): StudentDashboardContextValue {
  const ctx = useOptionalStudentDashboard();
  if (!ctx) {
    throw new Error("useStudentDashboard must be used within StudentDashboardProvider");
  }
  return ctx;
}
