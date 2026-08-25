package com.courseenglish.api.repository;

import com.courseenglish.api.domain.ClassSession;
import com.courseenglish.api.util.constant.SessionStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassSessionRepository extends JpaRepository<ClassSession, UUID> {

    Optional<ClassSession> findByIdAndVoidedFalse(UUID id);

    @Query("""
            SELECT s FROM ClassSession s
            LEFT JOIN FETCH s.classroom c
            LEFT JOIN FETCH s.lesson l
            WHERE s.id = :id
              AND s.voided = false
            """)
    Optional<ClassSession> findByIdAndVoidedFalseWithClassroomAndLesson(@Param("id") UUID id);

    @Query("""
            SELECT s FROM ClassSession s
            WHERE s.teacher.id = :teacherId
              AND s.voided = false
              AND s.status <> :cancelled
              AND s.startAt >= :dayStart
              AND s.startAt < :dayEnd
            ORDER BY s.startAt ASC
            """)
    List<ClassSession> findTeacherSessionsForDay(
            @Param("teacherId") UUID teacherId,
            @Param("dayStart") Instant dayStart,
            @Param("dayEnd") Instant dayEnd,
            @Param("cancelled") SessionStatusEnum cancelled);

    @Query("""
            SELECT s FROM ClassSession s
            WHERE s.teacher.id = :teacherId
              AND s.voided = false
              AND s.status <> :cancelled
              AND s.startAt >= :from
              AND s.startAt < :to
            ORDER BY s.startAt ASC
            """)
    List<ClassSession> findTeacherSessionsInRange(
            @Param("teacherId") UUID teacherId,
            @Param("from") Instant from,
            @Param("to") Instant to,
            @Param("cancelled") SessionStatusEnum cancelled);

    @Query("""
            SELECT s FROM ClassSession s
            WHERE s.voided = false
              AND s.status <> :cancelled
              AND s.startAt >= :dayStart
              AND s.startAt < :dayEnd
            ORDER BY s.startAt ASC
            """)
    List<ClassSession> findSessionsForDay(
            @Param("dayStart") Instant dayStart,
            @Param("dayEnd") Instant dayEnd,
            @Param("cancelled") SessionStatusEnum cancelled);

    @Query("""
            SELECT s FROM ClassSession s
            WHERE s.voided = false
              AND s.status <> :cancelled
              AND s.startAt >= :from
              AND s.startAt < :to
            ORDER BY s.startAt ASC
            """)
    List<ClassSession> findSessionsInRange(
            @Param("from") Instant from,
            @Param("to") Instant to,
            @Param("cancelled") SessionStatusEnum cancelled);

    @Query("""
            SELECT COUNT(s) > 0 FROM ClassSession s
            WHERE s.teacher.id = :teacherId
              AND s.voided = false
              AND s.status <> :cancelled
              AND (:excludeId IS NULL OR s.id <> :excludeId)
              AND s.startAt < :endAt
              AND s.endAt > :startAt
            """)
    boolean existsOverlappingSession(
            @Param("teacherId") UUID teacherId,
            @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt,
            @Param("excludeId") UUID excludeId,
            @Param("cancelled") SessionStatusEnum cancelled);

    List<ClassSession> findByRecurrenceGroupIdAndVoidedFalseAndStatusNotOrderByStartAtAsc(
            UUID recurrenceGroupId, SessionStatusEnum status);

    List<ClassSession> findByRecurrenceGroupIdAndVoidedFalseAndStatusNotAndStartAtGreaterThanEqualOrderByStartAtAsc(
            UUID recurrenceGroupId, SessionStatusEnum status, Instant fromStart);
}
