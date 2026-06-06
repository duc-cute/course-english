package com.courseenglish.api.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.courseenglish.api.domain.Role;
import com.courseenglish.api.domain.response.ResRoleDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;

public interface RoleService {

    ResultPaginationDTO getAllRoles(Specification<Role> spec, Pageable pageable);

    Optional<Role> getRoleById(UUID id);

    ResRoleDTO createRole(Role role);

    ResRoleDTO updateRole(UUID id, Role req);

    boolean existsByName(String name);

    boolean existsByCode(String code);

    void deleteRole(UUID id);

    ResRoleDTO toDto(Role role);
}
