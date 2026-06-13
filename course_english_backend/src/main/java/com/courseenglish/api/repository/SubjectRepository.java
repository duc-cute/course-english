package com.courseenglish.api.repository;

import com.courseenglish.api.domain.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, UUID>, JpaSpecificationExecutor<Subject> {
    Optional<Subject> findByIdAndVoidedFalse(UUID id);

    List<Subject> findByClassroom_IdInAndVoidedFalse(Collection<UUID> classroomIds);
}
