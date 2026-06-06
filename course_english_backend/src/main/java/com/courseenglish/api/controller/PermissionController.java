package com.courseenglish.api.controller;

import com.turkraft.springfilter.boot.Filter;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.courseenglish.api.domain.Permission;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.PermissionService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/permissions")
public class PermissionController {
    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @PostMapping("")
    @ApiMessage("create a permission")
    public ResponseEntity<Permission> create(@RequestBody Permission dto) throws IdInvalidException {
        boolean isExistPermission = this.permissionService.isPermissionExist(dto);
        if (isExistPermission) {
            if (this.permissionService.isSameName(dto)) {
                throw new IdInvalidException("Permission is exist!");
            }
        }
        Permission permission = this.permissionService.handleCreate(dto);
        return new ResponseEntity<>(permission, permission != null ? HttpStatus.OK : HttpStatus.BAD_REQUEST);
    }

    @PutMapping("")
    @ApiMessage("updated a permission")
    public ResponseEntity<Permission> update(@RequestBody Permission dto) throws IdInvalidException {
        Optional<Permission> permissionDb = this.permissionService.getAPermission(dto.getId());
        if (permissionDb.isEmpty()) {
            throw new IdInvalidException("Permission is not found");
        }
        boolean isExistPermission = this.permissionService.isPermissionExist(dto);
        if (isExistPermission) {
            throw new IdInvalidException("Permission is exist!");
        }
        return ResponseEntity.ok().body(this.permissionService.update(dto, permissionDb.get()));
    }

    @GetMapping("/{id}")
    @ApiMessage("Fetch a permission")
    public ResponseEntity<Permission> fetchPermission(@PathVariable UUID id) throws IdInvalidException {
        Optional<Permission> permission = this.permissionService.getAPermission(id);
        if (permission.isEmpty())
            throw new IdInvalidException("Permission is not found!");
        return new ResponseEntity<>(permission.get(), permission.isPresent() ? HttpStatus.OK : HttpStatus.BAD_REQUEST);
    }

    @GetMapping("")
    @ApiMessage("Fetch all permissions")
    public ResponseEntity<ResultPaginationDTO> pagingPermissions(@Filter Specification<Permission> spec, Pageable pageable) {
        ResultPaginationDTO result = this.permissionService.getAllPermission(spec, pageable);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete a permission")
    public ResponseEntity<Void> deletePermission(@PathVariable UUID id) throws IdInvalidException {
        Optional<Permission> p = this.permissionService.getAPermission(id);
        if (p.isEmpty()) {
            throw new IdInvalidException("Permission is not found");
        }
        this.permissionService.delete(id);
        return ResponseEntity.ok(null);
    }
}
