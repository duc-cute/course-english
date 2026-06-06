package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqSearchRoleDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.courseenglish.api.domain.Role;
import com.courseenglish.api.domain.response.ResRoleDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.RoleService;
import com.courseenglish.api.util.CatalogSearchSpecs;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roles")
public class RoleController {
    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @PostMapping("/search")
    @ApiMessage("Fetch all roles")
    public ResponseEntity<ResultPaginationDTO> pagingRoles(@RequestBody(required = false) ReqSearchRoleDTO req) {
        ReqSearchRoleDTO payload = req == null ? new ReqSearchRoleDTO() : req;
        var spec = CatalogSearchSpecs.roleSearch(payload);
        var pageable = PagingSearchUtil.toPageable(payload);
        ResultPaginationDTO result = roleService.getAllRoles(spec, pageable);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    @GetMapping("/{id}")
    @ApiMessage("Fetch role by id")
    public ResponseEntity<ResRoleDTO> getRoleById(@PathVariable UUID id) throws IdInvalidException {
        Optional<Role> roleOpt = roleService.getRoleById(id);
        if (roleOpt.isEmpty()) {
            throw new IdInvalidException("Role không tồn tại!");
        }
        return ResponseEntity.status(HttpStatus.OK).body(roleService.toDto(roleOpt.get()));
    }

    @PostMapping("")
    @ApiMessage("Create role")
    public ResponseEntity<ResRoleDTO> createRole(@Valid @RequestBody Role role) throws IdInvalidException {
        String normalizedName = role.getName() == null ? "" : role.getName().trim();
        String normalizedCode = role.getCode() == null ? "" : role.getCode().trim();
        String finalCode = normalizedCode.isEmpty() ? normalizedName : normalizedCode;

        if (roleService.existsByName(normalizedName)) {
            throw new IdInvalidException("Tên role đã tồn tại!");
        }
        if (roleService.existsByCode(finalCode)) {
            throw new IdInvalidException("Mã role đã tồn tại!");
        }
        ResRoleDTO created = roleService.createRole(role);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @ApiMessage("Update role")
    public ResponseEntity<ResRoleDTO> updateRole(@PathVariable UUID id, @Valid @RequestBody Role role)
            throws IdInvalidException {
        Optional<Role> currentRoleOpt = roleService.getRoleById(id);
        if (currentRoleOpt.isEmpty()) {
            throw new IdInvalidException("Role không tồn tại!");
        }

        Role currentRole = currentRoleOpt.get();
        String normalizedName = role.getName() == null ? "" : role.getName().trim();
        String normalizedCode = role.getCode() == null ? "" : role.getCode().trim();
        String finalCode = normalizedCode.isEmpty() ? normalizedName : normalizedCode;

        if (!normalizedName.equals(currentRole.getName()) && roleService.existsByName(normalizedName)) {
            throw new IdInvalidException("Tên role đã tồn tại!");
        }
        if (!finalCode.equals(currentRole.getCode()) && roleService.existsByCode(finalCode)) {
            throw new IdInvalidException("Mã role đã tồn tại!");
        }

        ResRoleDTO updated = roleService.updateRole(id, role);
        if (updated == null) {
            throw new IdInvalidException("Role không tồn tại!");
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete role")
    public ResponseEntity<Void> deleteRole(@PathVariable UUID id) throws IdInvalidException {
        Optional<Role> currentRole = roleService.getRoleById(id);
        if (currentRole.isEmpty()) {
            throw new IdInvalidException("Role không tồn tại!");
        }
        roleService.deleteRole(id);
        return ResponseEntity.ok(null);
    }
}
