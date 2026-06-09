package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqCheckSystemConfigKeyDTO;
import com.courseenglish.api.domain.request.ReqSearchSystemConfigDTO;
import com.courseenglish.api.domain.request.ReqSystemConfigDTO;
import com.courseenglish.api.domain.response.ResFeatureFlagsDTO;
import com.courseenglish.api.domain.response.ResSystemConfigDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.SystemConfigService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/system-configs")
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    public SystemConfigController(SystemConfigService systemConfigService) {
        this.systemConfigService = systemConfigService;
    }

    @GetMapping("/feature-flags")
    @ApiMessage("Public feature flags")
    public ResponseEntity<ResFeatureFlagsDTO> getFeatureFlags() {
        return ResponseEntity.ok(systemConfigService.getFeatureFlags());
    }

    @PostMapping("/search")
    @ApiMessage("Search system configs")
    public ResponseEntity<ResultPaginationDTO> search(@RequestBody(required = false) ReqSearchSystemConfigDTO req) {
        return ResponseEntity.ok(systemConfigService.search(req));
    }

    @GetMapping("/{id}")
    @ApiMessage("Get system config by id")
    public ResponseEntity<ResSystemConfigDTO> getById(@PathVariable UUID id) throws IdInvalidException {
        return ResponseEntity.ok(systemConfigService.getById(id));
    }

    @PostMapping("")
    @ApiMessage("Create system config")
    public ResponseEntity<ResSystemConfigDTO> create(@Valid @RequestBody ReqSystemConfigDTO request)
            throws IdInvalidException {
        request.setId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(systemConfigService.saveOrUpdate(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update system config")
    public ResponseEntity<ResSystemConfigDTO> update(@PathVariable UUID id, @Valid @RequestBody ReqSystemConfigDTO request)
            throws IdInvalidException {
        request.setId(id);
        return ResponseEntity.ok(systemConfigService.saveOrUpdate(request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete system config")
    public ResponseEntity<Void> delete(@PathVariable UUID id) throws IdInvalidException {
        systemConfigService.delete(id);
        return ResponseEntity.ok(null);
    }

    @PostMapping("/check-key")
    @ApiMessage("Check duplicate config key")
    public ResponseEntity<Map<String, Boolean>> checkKey(@RequestBody ReqCheckSystemConfigKeyDTO request) {
        return ResponseEntity.ok(Map.of("exists", systemConfigService.isConfigKeyTaken(request)));
    }
}
