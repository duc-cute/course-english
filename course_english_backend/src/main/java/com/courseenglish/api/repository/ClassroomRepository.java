package com.courseenglish.api.repository;

import com.courseenglish.api.domain.Classroom;
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
public interface ClassroomRepository extends JpaRepository<Classroom, UUID>, JpaSpecificationExecutor<Classroom> {
    Optional<Classroom> findByIdAndVoidedFalse(UUID id);

    boolean existsByCodeAndVoidedFalse(String code);

    Optional<Classroom> findByCodeAndVoidedFalse(String code);

    List<Classroom> findByTeacher_IdAndVoidedFalse(UUID teacherId);

    List<Classroom> findByVoidedFalse();
}
