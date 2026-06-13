package com.courseenglish.api.controller;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.Enrollment;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.request.ReqEnrollmentDTO;
import com.courseenglish.api.domain.request.ReqSearchEnrollmentDTO;
import com.courseenglish.api.domain.response.ResEnrollmentDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.EnrollmentService;
import com.courseenglish.api.service.StudentEnrollmentAccessService;
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
@RequestMapping("/api/v1/enrollments")
public class EnrollmentController {
    private final EnrollmentService enrollmentService;
    private final StudentEnrollmentAccessService studentEnrollmentAccessService;

    public EnrollmentController(
            EnrollmentService enrollmentService,
            StudentEnrollmentAccessService studentEnrollmentAccessService) {
        this.enrollmentService = enrollmentService;
        this.studentEnrollmentAccessService = studentEnrollmentAccessService;
    }

    @PostMapping("/search")
    @ApiMessage("Fetch all enrollments")
    public ResponseEntity<ResultPaginationDTO> paging(@RequestBody(required = false) ReqSearchEnrollmentDTO req)
            throws IdInvalidException {
        ReqSearchEnrollmentDTO payload = req == null ? new ReqSearchEnrollmentDTO() : req;
        if (Boolean.TRUE.equals(payload.getMine())) {
            UUID studentId = studentEnrollmentAccessService.currentStudentId()
                    .orElseThrow(() -> new IdInvalidException("Cần đăng nhập để xem ghi danh."));
            payload.setStudentId(studentId);
        }
        var spec = CatalogSearchSpecs.enrollmentSearch(payload);
        var pageable = PagingSearchUtil.toPageable(payload);
        return ResponseEntity.status(HttpStatus.OK).body(enrollmentService.getAll(spec, pageable));
    }

    @GetMapping("/{id}")
    @ApiMessage("Fetch enrollment by id")
    public ResponseEntity<ResEnrollmentDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        Optional<Enrollment> opt = enrollmentService.getById(id);
        if (opt.isEmpty()) throw new IdInvalidException("Enrollment không tồn tại!");
        return ResponseEntity.status(HttpStatus.OK).body(enrollmentService.toDto(opt.get()));
    }

    @PostMapping("")
    @ApiMessage("Create enrollment")
    public ResponseEntity<ResEnrollmentDTO> create(@Valid @RequestBody ReqEnrollmentDTO req) throws IdInvalidException {
        Classroom classroom = enrollmentService.getClassroomById(req.getClassroomId())
                .orElseThrow(() -> new IdInvalidException("Classroom không tồn tại!"));
        User student = enrollmentService.getStudentById(req.getStudentId())
                .orElseThrow(() -> new IdInvalidException("Student không tồn tại!"));
        if (!enrollmentService.isStudent(student)) {
            throw new IdInvalidException("User được chọn không phải STUDENT!");
        }
        if (enrollmentService.existsByClassroomAndStudent(req.getClassroomId(), req.getStudentId())) {
            throw new IdInvalidException("Học sinh đã thuộc lớp này!");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(enrollmentService.create(req, classroom, student));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update enrollment")
    public ResponseEntity<ResEnrollmentDTO> update(@PathVariable UUID id, @Valid @RequestBody ReqEnrollmentDTO req)
            throws IdInvalidException {
        Enrollment current = enrollmentService.getById(id)
                .orElseThrow(() -> new IdInvalidException("Enrollment không tồn tại!"));
        Classroom classroom = enrollmentService.getClassroomById(req.getClassroomId())
                .orElseThrow(() -> new IdInvalidException("Classroom không tồn tại!"));
        User student = enrollmentService.getStudentById(req.getStudentId())
                .orElseThrow(() -> new IdInvalidException("Student không tồn tại!"));
        if (!enrollmentService.isStudent(student)) {
            throw new IdInvalidException("User được chọn không phải STUDENT!");
        }

        UUID oldClassroomId = current.getClassroom() != null ? current.getClassroom().getId() : null;
        UUID oldStudentId = current.getStudent() != null ? current.getStudent().getId() : null;
        boolean changedPair = !(req.getClassroomId().equals(oldClassroomId) && req.getStudentId().equals(oldStudentId));
        if (changedPair && enrollmentService.existsByClassroomAndStudent(req.getClassroomId(), req.getStudentId())) {
            throw new IdInvalidException("Học sinh đã thuộc lớp này!");
        }

        ResEnrollmentDTO updated = enrollmentService.update(id, req, classroom, student);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete enrollment")
    public ResponseEntity<Void> delete(@PathVariable UUID id) throws IdInvalidException {
        if (enrollmentService.getById(id).isEmpty()) throw new IdInvalidException("Enrollment không tồn tại!");
        enrollmentService.delete(id);
        return ResponseEntity.ok(null);
    }
}
