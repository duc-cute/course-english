package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqClassSessionDTO;
import com.courseenglish.api.domain.request.ReqRecurringClassSessionDTO;
import com.courseenglish.api.domain.response.ResClassSessionDTO;
import com.courseenglish.api.domain.response.ResRecurringCreateDTO;
import com.courseenglish.api.service.ClassSessionService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.constant.RecurrenceScopeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/class-sessions")
public class ClassSessionController {

    private final ClassSessionService classSessionService;

    public ClassSessionController(ClassSessionService classSessionService) {
        this.classSessionService = classSessionService;
    }

    @GetMapping("/{id}")
    @ApiMessage("Fetch class session by id")
    public ResponseEntity<ResClassSessionDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(classSessionService.getById(id));
    }

    @PostMapping("/recurring")
    @ApiMessage("Create recurring class sessions")
    public ResponseEntity<ResRecurringCreateDTO> createRecurring(
            @Valid @RequestBody ReqRecurringClassSessionDTO request) throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(classSessionService.createRecurring(request));
    }

    @PostMapping("")
    @ApiMessage("Create class session")
    public ResponseEntity<ResClassSessionDTO> create(@Valid @RequestBody ReqClassSessionDTO request)
            throws IdInvalidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(classSessionService.create(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update class session")
    public ResponseEntity<ResClassSessionDTO> update(
            @PathVariable UUID id,
            @RequestParam(required = false) RecurrenceScopeEnum scope,
            @Valid @RequestBody ReqClassSessionDTO request) throws IdInvalidException {
        return ResponseEntity.ok(classSessionService.update(id, request, scope));
    }

    @PatchMapping("/{id}/cancel")
    @ApiMessage("Cancel class session")
    public ResponseEntity<ResClassSessionDTO> cancel(
            @PathVariable UUID id, @RequestParam(required = false) RecurrenceScopeEnum scope)
            throws IdInvalidException {
        return ResponseEntity.ok(classSessionService.cancel(id, scope));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete class session")
    public ResponseEntity<Void> delete(@PathVariable UUID id) throws IdInvalidException {
        classSessionService.delete(id);
        return ResponseEntity.ok(null);
    }
}
