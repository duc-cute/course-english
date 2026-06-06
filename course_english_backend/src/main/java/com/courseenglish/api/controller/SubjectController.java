package com.courseenglish.api.controller;

import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.domain.request.ReqSearchSubjectDTO;
import com.courseenglish.api.domain.response.ResSubjectDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.SubjectService;
import com.courseenglish.api.util.CatalogSearchSpecs;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subjects")
public class SubjectController {
    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @PostMapping("/search")
    @ApiMessage("Fetch all subjects")
    public ResponseEntity<ResultPaginationDTO> paging(@RequestBody(required = false) ReqSearchSubjectDTO req) {
        ReqSearchSubjectDTO payload = req == null ? new ReqSearchSubjectDTO() : req;
        var spec = CatalogSearchSpecs.subjectSearch(payload);
        var pageable = PagingSearchUtil.toPageable(payload);
        return ResponseEntity.status(HttpStatus.OK).body(subjectService.getAll(spec, pageable));
    }

    @GetMapping("/{id}")
    @ApiMessage("Fetch subject by id")
    public ResponseEntity<ResSubjectDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        Optional<Subject> opt = subjectService.getById(id);
        if (opt.isEmpty()) throw new IdInvalidException("Subject không tồn tại!");
        return ResponseEntity.status(HttpStatus.OK).body(subjectService.toDto(opt.get()));
    }

    @PostMapping("")
    @ApiMessage("Create subject")
    public ResponseEntity<ResSubjectDTO> create(@Valid @RequestBody Subject request) throws IdInvalidException {
        if (request.getClassroomId() == null && (request.getClassroom() == null || request.getClassroom().getId() == null)) {
            throw new IdInvalidException("classroomId là bắt buộc!");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(subjectService.create(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update subject")
    public ResponseEntity<ResSubjectDTO> update(@PathVariable UUID id, @Valid @RequestBody Subject request)
            throws IdInvalidException {
        if (subjectService.getById(id).isEmpty()) throw new IdInvalidException("Subject không tồn tại!");
        ResSubjectDTO updated = subjectService.update(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete subject")
    public ResponseEntity<Void> delete(@PathVariable UUID id) throws IdInvalidException {
        if (subjectService.getById(id).isEmpty()) throw new IdInvalidException("Subject không tồn tại!");
        subjectService.delete(id);
        return ResponseEntity.ok(null);
    }
}
