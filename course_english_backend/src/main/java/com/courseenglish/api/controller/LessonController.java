package com.courseenglish.api.controller;

import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.request.ReqLessonAssetDTO;
import com.courseenglish.api.domain.request.ReqLessonBlockDTO;
import com.courseenglish.api.domain.request.ReqReorderLessonBlocksDTO;
import com.courseenglish.api.domain.request.ReqSearchLessonDTO;
import com.courseenglish.api.domain.response.ResLessonBlockDTO;
import com.courseenglish.api.domain.response.ResLessonDTO;
import com.courseenglish.api.domain.response.ResLessonDetailDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.LessonAssetService;
import com.courseenglish.api.service.LessonBlockService;
import com.courseenglish.api.service.LessonService;
import com.courseenglish.api.service.StudentEnrollmentAccessService;
import com.courseenglish.api.util.CatalogSearchSpecs;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lessons")
public class LessonController {
    private final LessonService lessonService;
    private final LessonBlockService lessonBlockService;
    private final LessonAssetService lessonAssetService;
    private final StudentEnrollmentAccessService studentEnrollmentAccessService;

    public LessonController(
            LessonService lessonService,
            LessonBlockService lessonBlockService,
            LessonAssetService lessonAssetService,
            StudentEnrollmentAccessService studentEnrollmentAccessService) {
        this.lessonService = lessonService;
        this.lessonBlockService = lessonBlockService;
        this.lessonAssetService = lessonAssetService;
        this.studentEnrollmentAccessService = studentEnrollmentAccessService;
    }

    @PostMapping("/search")
    @ApiMessage("Fetch all lessons")
    public ResponseEntity<ResultPaginationDTO> paging(@RequestBody(required = false) ReqSearchLessonDTO req)
            throws IdInvalidException {
        ReqSearchLessonDTO payload = req == null ? new ReqSearchLessonDTO() : req;
        Specification<Lesson> spec = CatalogSearchSpecs.lessonSearch(payload);
        if (Boolean.TRUE.equals(payload.getEnrolledOnly())) {
            List<UUID> subjectIds = studentEnrollmentAccessService.resolveEnrolledSubjectIds(payload.getClassroomId());
            Specification<Lesson> enrolledSpec = CatalogSearchSpecs.lessonSubjectIdsIn(subjectIds);
            spec = spec == null ? enrolledSpec : spec.and(enrolledSpec);
        }
        var pageable = PagingSearchUtil.toPageable(payload);
        return ResponseEntity.ok(lessonService.getAll(spec, pageable));
    }

    @GetMapping("/by-slug/{slug}")
    @ApiMessage("Fetch lesson by slug")
    public ResponseEntity<ResLessonDTO> getBySlug(@PathVariable String slug) throws IdInvalidException {
        return ResponseEntity.ok(lessonService.getBySlug(slug));
    }

    @GetMapping("/by-slug/{slug}/detail")
    @ApiMessage("Fetch lesson detail by slug")
    public ResponseEntity<ResLessonDetailDTO> getDetailBySlug(@PathVariable String slug) throws IdInvalidException {
        return ResponseEntity.ok(lessonService.getDetailBySlug(slug));
    }

    @GetMapping("/{id}")
    @ApiMessage("Fetch lesson by id")
    public ResponseEntity<ResLessonDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(lessonService.getById(id));
    }

    @GetMapping("/{id}/detail")
    @ApiMessage("Fetch lesson detail with blocks and assets")
    public ResponseEntity<ResLessonDetailDTO> getDetail(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(lessonService.getDetail(id));
    }

    @PostMapping("")
    @ApiMessage("Create lesson")
    public ResponseEntity<ResLessonDTO> create(@Valid @RequestBody Lesson request) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(lessonService.create(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update lesson")
    public ResponseEntity<ResLessonDTO> update(@PathVariable UUID id, @Valid @RequestBody Lesson request)
            throws IdInvalidException {
        return ResponseEntity.ok(lessonService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete lesson")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        lessonService.delete(id);
        return ResponseEntity.ok(null);
    }

    @PostMapping("/{id}/publish")
    @ApiMessage("Publish lesson")
    public ResponseEntity<ResLessonDTO> publish(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(lessonService.publish(id));
    }

    @PostMapping("/{id}/unpublish")
    @ApiMessage("Unpublish lesson")
    public ResponseEntity<ResLessonDTO> unpublish(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(lessonService.unpublish(id));
    }

    @GetMapping("/{lessonId}/blocks")
    @ApiMessage("List lesson blocks")
    public ResponseEntity<List<ResLessonBlockDTO>> listBlocks(@PathVariable UUID lessonId) {
        return ResponseEntity.ok(lessonBlockService.listByLessonId(lessonId));
    }

    @PostMapping("/{lessonId}/blocks")
    @ApiMessage("Create lesson block")
    public ResponseEntity<ResLessonBlockDTO> createBlock(
            @PathVariable UUID lessonId,
            @RequestBody ReqLessonBlockDTO request) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(lessonBlockService.create(lessonId, request));
    }

    @PutMapping("/lesson-blocks/{blockId}")
    @ApiMessage("Update lesson block")
    public ResponseEntity<ResLessonBlockDTO> updateBlock(
            @PathVariable UUID blockId,
            @RequestBody ReqLessonBlockDTO request) throws IdInvalidException {
        return ResponseEntity.ok(lessonBlockService.update(blockId, request));
    }

    @DeleteMapping("/lesson-blocks/{blockId}")
    @ApiMessage("Delete lesson block")
    public ResponseEntity<Void> deleteBlock(@PathVariable UUID blockId) {
        lessonBlockService.delete(blockId);
        return ResponseEntity.ok(null);
    }

    @PostMapping("/{lessonId}/blocks/reorder")
    @ApiMessage("Reorder lesson blocks")
    public ResponseEntity<List<ResLessonBlockDTO>> reorderBlocks(
            @PathVariable UUID lessonId,
            @RequestBody ReqReorderLessonBlocksDTO request) throws IdInvalidException {
        return ResponseEntity.ok(lessonBlockService.reorder(lessonId, request));
    }

    @GetMapping("/{lessonId}/assets")
    @ApiMessage("List lesson assets")
    public ResponseEntity<?> listAssets(@PathVariable UUID lessonId) {
        return ResponseEntity.ok(lessonAssetService.listByLessonId(lessonId));
    }

    @PostMapping("/{lessonId}/assets")
    @ApiMessage("Create lesson asset")
    public ResponseEntity<?> createAsset(
            @PathVariable UUID lessonId,
            @RequestBody ReqLessonAssetDTO request) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(lessonAssetService.create(lessonId, request));
    }

    @DeleteMapping("/lesson-assets/{assetId}")
    @ApiMessage("Delete lesson asset")
    public ResponseEntity<Void> deleteAsset(@PathVariable UUID assetId) {
        lessonAssetService.delete(assetId);
        return ResponseEntity.ok(null);
    }
}
