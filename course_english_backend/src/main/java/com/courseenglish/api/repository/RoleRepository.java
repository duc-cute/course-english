package com.courseenglish.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import com.courseenglish.api.domain.Role;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID>, JpaSpecificationExecutor<Role> {
    Optional<Role> findByIdAndVoidedFalse(UUID id);

    Optional<Role> findByNameAndVoidedFalse(String name);

    Optional<Role> findByCodeAndVoidedFalse(String code);

    boolean existsByNameAndVoidedFalse(String name);

    boolean existsByCodeAndVoidedFalse(String code);

    List<Role> findByIdInAndVoidedFalse(List<UUID> id);
}

