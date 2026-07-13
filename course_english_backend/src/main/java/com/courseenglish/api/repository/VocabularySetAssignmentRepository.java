package com.courseenglish.api.repository;

import com.courseenglish.api.domain.VocabularySetAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularySetAssignmentRepository
        extends JpaRepository<VocabularySetAssignment, UUID>, JpaSpecificationExecutor<VocabularySetAssignment> {

    Optional<VocabularySetAssignment> findByIdAndVoidedFalse(UUID id);

    @Query("""
            SELECT a FROM VocabularySetAssignment a
            JOIN FETCH a.vocabularySet s
            JOIN FETCH a.classroom c
            LEFT JOIN FETCH a.assignedBy u
            WHERE a.voided = false
              AND a.id = :id
            """)
    Optional<VocabularySetAssignment> findByIdWithDetails(@Param("id") UUID id);

    @Query("""
            SELECT a FROM VocabularySetAssignment a
            JOIN FETCH a.vocabularySet s
            JOIN FETCH a.classroom c
            LEFT JOIN FETCH a.assignedBy u
            WHERE a.voided = false
              AND UPPER(a.status) = 'ACTIVE'
              AND c.id IN :classroomIds
            ORDER BY a.assignedAt DESC
            """)
    List<VocabularySetAssignment> findActiveByClassroomIds(
            @Param("classroomIds") Collection<UUID> classroomIds);

    Optional<VocabularySetAssignment>
            findFirstByVocabularySet_IdAndClassroom_IdAndStatusIgnoreCaseAndVoidedFalse(
                    UUID vocabularySetId, UUID classroomId, String status);
}
