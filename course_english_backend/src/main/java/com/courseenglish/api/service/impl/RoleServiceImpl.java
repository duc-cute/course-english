package com.courseenglish.api.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import com.courseenglish.api.service.RoleService;
import com.courseenglish.api.domain.Role;
import com.courseenglish.api.domain.response.ResRoleDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.RoleRepository;

import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RoleServiceImpl implements RoleService {
    private final RoleRepository roleRepository;

    public RoleServiceImpl(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public ResultPaginationDTO getAllRoles(Specification<Role> spec, Pageable pageable) {
        Specification<Role> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<Role> finalSpec = spec == null ? notVoidedSpec : spec.and(notVoidedSpec);

        Page<Role> page = roleRepository.findAll(finalSpec, pageable);

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setTotal(page.getTotalElements());
        meta.setPages(page.getTotalPages());

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(page.getContent().stream().map(this::toDto).collect(Collectors.toList()));
        return dto;
    }

    public Optional<Role> getRoleById(UUID id) {
        return roleRepository.findByIdAndVoidedFalse(id);
    }

    public ResRoleDTO createRole(Role role) {
        String normalizedName = role.getName() == null ? "" : role.getName().trim();
        String normalizedCode = role.getCode() == null ? "" : role.getCode().trim();

        role.setName(normalizedName);
        role.setCode(normalizedCode.isEmpty() ? normalizedName : normalizedCode);

        Role created = roleRepository.save(role);
        return toDto(created);
    }

    public ResRoleDTO updateRole(UUID id, Role req) {
        Optional<Role> roleOpt = roleRepository.findByIdAndVoidedFalse(id);
        if (roleOpt.isEmpty()) {
            return null;
        }

        Role role = roleOpt.get();
        String normalizedName = req.getName() == null ? "" : req.getName().trim();
        String normalizedCode = req.getCode() == null ? "" : req.getCode().trim();

        role.setName(normalizedName);
        role.setCode(normalizedCode.isEmpty() ? normalizedName : normalizedCode);

        Role updated = roleRepository.save(role);
        return toDto(updated);
    }

    public boolean existsByName(String name) {
        return roleRepository.existsByNameAndVoidedFalse(name);
    }

    public boolean existsByCode(String code) {
        return roleRepository.existsByCodeAndVoidedFalse(code);
    }

    public void deleteRole(UUID id) {
        Optional<Role> roleOpt = roleRepository.findByIdAndVoidedFalse(id);
        roleOpt.ifPresent(role -> {
            role.setVoided(true);
            roleRepository.save(role);
        });
    }

    public ResRoleDTO toDto(Role role) {
        ResRoleDTO dto = new ResRoleDTO();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setCode(role.getCode());
        return dto;
    }
}
