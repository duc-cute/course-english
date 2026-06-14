package com.courseenglish.api.repository;

import com.courseenglish.api.domain.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID>, JpaSpecificationExecutor<Enrollment> {
    Optional<Enrollment> findByIdAndVoidedFalse(UUID id);

    boolean existsByClassroom_IdAndStudent_IdAndVoidedFalse(UUID classroomId, UUID studentId);

    List<Enrollment> findByStudent_IdAndStatusIgnoreCaseAndVoidedFalse(UUID studentId, String status);

    List<Enrollment> findByClassroom_IdAndStatusIgnoreCaseAndVoidedFalse(UUID classroomId, String status);
}
