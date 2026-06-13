import { Alert, CircularProgress } from "@mui/material";
import { useState } from "react";
import { ProfileBadgesTab } from "./ProfileBadgesTab";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileHistoryTab } from "./ProfileHistoryTab";
import { ProfileOverviewTab } from "./ProfileOverviewTab";
import { ProfileTabs, type ProfileTabId } from "./ProfileTabs";
import { useStudentStats } from "./useStudentStats";

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTabId>("overview");
  const { stats, lessons, practiceSummary, lessonTitleById, loading, error } = useStudentStats();

  return (
    <div className="vq-page vq-profile-page">
      <ProfileHeader stats={stats} />

      {error ? (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : null}

      <ProfileTabs active={activeTab} onChange={setActiveTab} />

      {loading ? (
        <div className="vq-profile-loading">
          <CircularProgress size={32} />
        </div>
      ) : (
        <>
          {activeTab === "overview" ? <ProfileOverviewTab stats={stats} /> : null}
          {activeTab === "badges" ? <ProfileBadgesTab stats={stats} /> : null}
          {activeTab === "history" ? (
            <ProfileHistoryTab
              lessons={lessons}
              practiceSummary={practiceSummary}
              lessonTitleById={lessonTitleById}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
