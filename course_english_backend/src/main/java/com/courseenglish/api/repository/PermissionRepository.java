package com.courseenglish.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import com.courseenglish.api.domain.Permission;

import java.util.List;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID>, JpaSpecificationExecutor<Permission> {
    boolean existsByModuleAndApiPathAndMethodAndVoidedFalse(String module, String apiPath, String method);

    boolean existsByNameAndVoidedFalse(String name);

    List<Permission> findByIdInAndVoidedFalse(List<UUID> id);

    java.util.Optional<Permission> findByIdAndVoidedFalse(UUID id);
}
