package com.courseenglish.api.controller;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.request.ReqSearchClassroomDTO;
import com.courseenglish.api.domain.response.ResClassroomDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.ClassroomService;
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
@RequestMapping("/api/v1/classrooms")
public class ClassroomController {
    private final ClassroomService classroomService;

    public ClassroomController(ClassroomService classroomService) {
        this.classroomService = classroomService;
    }

    @PostMapping("/search")
    @ApiMessage("Fetch all classrooms")
    public ResponseEntity<ResultPaginationDTO> paging(@RequestBody(required = false) ReqSearchClassroomDTO req) {
        ReqSearchClassroomDTO payload = req == null ? new ReqSearchClassroomDTO() : req;
        var spec = CatalogSearchSpecs.classroomSearch(payload);
        var pageable = PagingSearchUtil.toPageable(payload);
        return ResponseEntity.status(HttpStatus.OK).body(classroomService.getAll(spec, pageable));
    }

    @GetMapping("/{id}")
    @ApiMessage("Fetch classroom by id")
    public ResponseEntity<ResClassroomDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        Optional<Classroom> opt = classroomService.getById(id);
        if (opt.isEmpty()) throw new IdInvalidException("Classroom không tồn tại!");
        return ResponseEntity.status(HttpStatus.OK).body(classroomService.toDto(opt.get()));
    }

    @PostMapping("")
    @ApiMessage("Create classroom")
    public ResponseEntity<ResClassroomDTO> create(@Valid @RequestBody Classroom request) throws IdInvalidException {
        String code = request.getCode() == null ? "" : request.getCode().trim();
        if (classroomService.existsByCode(code)) {
            throw new IdInvalidException("Mã lớp đã tồn tại!");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(classroomService.create(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update classroom")
    public ResponseEntity<ResClassroomDTO> update(@PathVariable UUID id, @Valid @RequestBody Classroom request)
            throws IdInvalidException {
        Optional<Classroom> current = classroomService.getById(id);
        if (current.isEmpty()) throw new IdInvalidException("Classroom không tồn tại!");
        String nextCode = request.getCode() == null ? "" : request.getCode().trim();
        String currentCode = current.get().getCode() == null ? "" : current.get().getCode().trim();
        if (!nextCode.equals(currentCode) && classroomService.existsByCode(nextCode)) {
            throw new IdInvalidException("Mã lớp đã tồn tại!");
        }
        ResClassroomDTO updated = classroomService.update(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete classroom")
    public ResponseEntity<Void> delete(@PathVariable UUID id) throws IdInvalidException {
        if (classroomService.getById(id).isEmpty()) throw new IdInvalidException("Classroom không tồn tại!");
        classroomService.delete(id);
        return ResponseEntity.ok(null);
    }
}
