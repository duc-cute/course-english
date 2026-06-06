package com.courseenglish.api.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import com.courseenglish.api.service.PermissionService;
import com.courseenglish.api.domain.Permission;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.PermissionRepository;

import java.util.Optional;
import java.util.UUID;

@Service
public class PermissionServiceImpl implements PermissionService {
    private final PermissionRepository permissionRepository;

    public PermissionServiceImpl(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    public Permission handleCreate(Permission p) {
        return this.permissionRepository.save(p);
    }

    public Optional<Permission> getAPermission(UUID id) {
        return this.permissionRepository.findByIdAndVoidedFalse(id);
    }

    public boolean isPermissionExist(Permission p) {
        return this.permissionRepository.existsByModuleAndApiPathAndMethodAndVoidedFalse(
                p.getModule(),
                p.getApiPath(),
                p.getMethod()
        );
    }

    public boolean isSameName(Permission p) {
        return this.permissionRepository.existsByNameAndVoidedFalse(p.getName());
    }

    public Permission update(Permission p, Permission permissionDb) {
        permissionDb.setName(p.getName());
        permissionDb.setMethod(p.getMethod());
        permissionDb.setModule(p.getModule());
        return this.permissionRepository.save(permissionDb);
    }

    public ResultPaginationDTO getAllPermission(Specification<Permission> spec, Pageable pageable) {
        ResultPaginationDTO dto = new ResultPaginationDTO();
        Specification<Permission> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<Permission> finalSpec = spec == null
                ? notVoidedSpec
                : spec.and(notVoidedSpec);
        Page<Permission> pPermission = this.permissionRepository.findAll(finalSpec, pageable);
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setTotal(pPermission.getTotalElements());
        meta.setPages(pPermission.getTotalPages());
        dto.setMeta(meta);
        dto.setResult(pPermission.getContent());
        return dto;
    }

    public void delete(UUID id) {
        Optional<Permission> permission = this.permissionRepository.findByIdAndVoidedFalse(id);
        permission.ifPresent(item -> {
            item.setVoided(true);
            this.permissionRepository.save(item);
        });
    }
}
