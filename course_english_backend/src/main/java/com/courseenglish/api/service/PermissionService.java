package com.courseenglish.api.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.courseenglish.api.domain.Permission;
import com.courseenglish.api.domain.response.ResultPaginationDTO;

public interface PermissionService {

    Permission handleCreate(Permission p);

    Optional<Permission> getAPermission(UUID id);

    boolean isPermissionExist(Permission p);

    boolean isSameName(Permission p);

    Permission update(Permission p, Permission permissionDb);

    ResultPaginationDTO getAllPermission(Specification<Permission> spec, Pageable pageable);

    void delete(UUID id);
}
