package com.courseenglish.api.repository;

import com.courseenglish.api.domain.Enrollment;
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
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID>, JpaSpecificationExecutor<Enrollment> {
    Optional<Enrollment> findByIdAndVoidedFalse(UUID id);

    boolean existsByClassroom_IdAndStudent_IdAndVoidedFalse(UUID classroomId, UUID studentId);

    List<Enrollment> findByStudent_IdAndStatusIgnoreCaseAndVoidedFalse(UUID studentId, String status);

    List<Enrollment> findByClassroom_IdAndStatusIgnoreCaseAndVoidedFalse(UUID classroomId, String status);

    long countByClassroom_IdAndStatusIgnoreCaseAndVoidedFalse(UUID classroomId, String status);

    @Query("""
            SELECT e FROM Enrollment e
            JOIN FETCH e.student s
            JOIN FETCH e.classroom c
            WHERE e.voided = false
              AND UPPER(e.status) = 'ACTIVE'
              AND c.id IN :classroomIds
            """)
    List<Enrollment> findActiveByClassroomIdsWithStudent(@Param("classroomIds") Collection<UUID> classroomIds);

    @Query("""
            SELECT e FROM Enrollment e
            JOIN FETCH e.student s
            JOIN FETCH e.classroom c
            WHERE e.voided = false
              AND UPPER(e.status) = 'ACTIVE'
            """)
    List<Enrollment> findAllActiveWithStudent();

    @Query("""
            SELECT e FROM Enrollment e
            JOIN FETCH e.student s
            JOIN FETCH e.classroom c
            WHERE e.voided = false
              AND UPPER(e.status) = 'ACTIVE'
              AND c.id = :classroomId
              AND s.id = :studentId
            """)
    Optional<Enrollment> findActiveByClassroomAndStudent(
            @Param("classroomId") UUID classroomId,
            @Param("studentId") UUID studentId);
}