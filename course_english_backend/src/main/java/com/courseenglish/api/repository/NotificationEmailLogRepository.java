package com.courseenglish.api.repository;

import com.courseenglish.api.domain.NotificationEmailLog;
import com.courseenglish.api.util.constant.NotificationEmailStatusEnum;
import com.courseenglish.api.util.constant.NotificationTypeEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationEmailLogRepository extends JpaRepository<NotificationEmailLog, UUID> {

    boolean existsByLessonIdAndUserIdAndTypeAndStatusAndVoidedFalse(
            UUID lessonId,
            UUID userId,
            NotificationTypeEnum type,
            NotificationEmailStatusEnum status);
}
