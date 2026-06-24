package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.MeetingStateEnum;
import com.courseenglish.api.util.constant.ScheduledStateEnum;
import com.courseenglish.api.util.constant.SessionStatusEnum;
import com.courseenglish.api.util.constant.SessionTypeEnum;
import com.courseenglish.api.util.constant.SessionUiStateEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ResClassSessionDTO {

    private UUID id;
    private UUID classroomId;
    private String classroomName;
    private String classroomCode;
    private UUID teacherId;
    private String title;
    private SessionTypeEnum sessionType;
    private Instant startAt;
    private Instant endAt;
    private Instant startedAt;
    private String meetLink;
    private String locationLabel;
    private UUID lessonId;
    private String lessonTitle;
    private long activeStudentCount;
    private SessionStatusEnum status;
    private ScheduledStateEnum scheduledState;
    private MeetingStateEnum meetingState;
    private SessionUiStateEnum uiState;
    private boolean canJoinMeet;
    private boolean canStartOnlineClass;
    private boolean canOpenLesson;
    private boolean needsSetup;
    private boolean usePreSavedLink;
    private String notes;
    private UUID recurrenceGroupId;
    private String recurrenceRule;
    private boolean recurring;
}
