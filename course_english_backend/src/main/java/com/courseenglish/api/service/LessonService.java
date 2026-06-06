package com.courseenglish.api.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.response.ResLessonDTO;
import com.courseenglish.api.domain.response.ResLessonDetailDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;

public interface LessonService {

    ResultPaginationDTO getAll(Specification<Lesson> spec, Pageable pageable);

    Optional<Lesson> getEntityById(UUID id);

    ResLessonDTO getById(UUID id) throws IdInvalidException;

    ResLessonDetailDTO getDetail(UUID id) throws IdInvalidException;

    ResLessonDTO create(Lesson request) throws IdInvalidException;

    ResLessonDTO update(UUID id, Lesson request) throws IdInvalidException;

    void delete(UUID id);

    ResLessonDTO publish(UUID id) throws IdInvalidException;

    ResLessonDTO unpublish(UUID id) throws IdInvalidException;
}
