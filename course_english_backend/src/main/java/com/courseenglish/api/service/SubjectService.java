package com.courseenglish.api.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.domain.response.ResSubjectDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;

public interface SubjectService {

    ResultPaginationDTO getAll(Specification<Subject> spec, Pageable pageable);

    Optional<Subject> getById(UUID id);

    ResSubjectDTO create(Subject request);

    ResSubjectDTO update(UUID id, Subject request);

    void delete(UUID id);

    ResSubjectDTO toDto(Subject subject);
}
