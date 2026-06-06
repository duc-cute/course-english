package com.courseenglish.api.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.Enrollment;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.request.ReqEnrollmentDTO;
import com.courseenglish.api.domain.response.ResEnrollmentDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;

public interface EnrollmentService {

    ResultPaginationDTO getAll(Specification<Enrollment> spec, Pageable pageable);

    Optional<Enrollment> getById(UUID id);

    Optional<Classroom> getClassroomById(UUID id);

    Optional<User> getStudentById(UUID id);

    boolean isStudent(User user);

    boolean existsByClassroomAndStudent(UUID classroomId, UUID studentId);

    ResEnrollmentDTO create(ReqEnrollmentDTO req, Classroom classroom, User student);

    ResEnrollmentDTO update(UUID id, ReqEnrollmentDTO req, Classroom classroom, User student);

    void delete(UUID id);

    ResEnrollmentDTO toDto(Enrollment item);
}
