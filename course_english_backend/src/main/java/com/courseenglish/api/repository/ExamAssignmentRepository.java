package com.courseenglish.api.repository;

import com.courseenglish.api.domain.ExamAssignment;
import com.courseenglish.api.util.constant.ExamAssignmentStatusEnum;
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
public interface ExamAssignmentRepository
        extends JpaRepository<ExamAssignment, UUID>, JpaSpecificationExecutor<ExamAssignment> {

    Optional<ExamAssignment> findByIdAndVoidedFalse(UUID id);

    @Query("""
            SELECT a FROM ExamAssignment a
            JOIN FETCH a.examPaper p
            JOIN FETCH a.classroom c
            LEFT JOIN FETCH a.assignedBy u
            WHERE a.voided = false
              AND a.id = :id
            """)
    Optional<ExamAssignment> findByIdWithDetails(@Param("id") UUID id);

    @Query("""
            SELECT a FROM ExamAssignment a
            JOIN FETCH a.examPaper p
            JOIN FETCH a.classroom c
            LEFT JOIN FETCH a.assignedBy u
            WHERE a.voided = false
              AND a.status = com.courseenglish.api.util.constant.ExamAssignmentStatusEnum.ACTIVE
              AND c.id IN :classroomIds
            ORDER BY a.assignedAt DESC
            """)
    List<ExamAssignment> findActiveByClassroomIds(
            @Param("classroomIds") Collection<UUID> classroomIds);

    Optional<ExamAssignment>
            findFirstByExamPaper_IdAndClassroom_IdAndStatusAndVoidedFalse(
                    UUID examPaperId, UUID classroomId, ExamAssignmentStatusEnum status);
}
