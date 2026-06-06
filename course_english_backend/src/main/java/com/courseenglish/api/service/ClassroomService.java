package com.courseenglish.api.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.response.ResClassroomDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;

public interface ClassroomService {

    ResultPaginationDTO getAll(Specification<Classroom> spec, Pageable pageable);

    Optional<Classroom> getById(UUID id);

    ResClassroomDTO create(Classroom request);

    ResClassroomDTO update(UUID id, Classroom request);

    void delete(UUID id);

    boolean existsByCode(String code);

    ResClassroomDTO toDto(Classroom classroom);
}
