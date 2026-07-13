package com.courseenglish.api.repository;

import com.courseenglish.api.domain.VocabularyJourneyClassroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyJourneyClassroomRepository extends JpaRepository<VocabularyJourneyClassroom, UUID> {

    Optional<VocabularyJourneyClassroom> findByClassroom_IdAndVoidedFalse(UUID classroomId);

    List<VocabularyJourneyClassroom> findByJourney_IdAndVoidedFalse(UUID journeyId);

    @Query("""
            SELECT jc FROM VocabularyJourneyClassroom jc
            JOIN FETCH jc.journey j
            JOIN FETCH jc.classroom c
            WHERE jc.voided = false
              AND j.voided = false
              AND c.id IN :classroomIds
            """)
    List<VocabularyJourneyClassroom> findActiveByClassroomIds(
            @Param("classroomIds") Collection<UUID> classroomIds);

    @Query("""
            SELECT jc FROM VocabularyJourneyClassroom jc
            JOIN FETCH jc.classroom c
            LEFT JOIN FETCH c.teacher t
            WHERE jc.voided = false
              AND jc.journey.id = :journeyId
            ORDER BY c.name ASC
            """)
    List<VocabularyJourneyClassroom> findActiveWithClassroomByJourneyId(
            @Param("journeyId") UUID journeyId);
}
