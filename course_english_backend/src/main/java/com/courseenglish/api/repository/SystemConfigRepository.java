package com.courseenglish.api.repository;

import com.courseenglish.api.domain.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SystemConfigRepository extends JpaRepository<SystemConfig, UUID>, JpaSpecificationExecutor<SystemConfig> {

    Optional<SystemConfig> findByIdAndVoidedFalse(UUID id);

    Optional<SystemConfig> findByConfigKeyAndVoidedFalse(String configKey);

    boolean existsByConfigKeyAndVoidedFalseAndIdNot(String configKey, UUID id);

    boolean existsByConfigKeyAndVoidedFalse(String configKey);

    List<SystemConfig> findByVoidedFalseOrderByConfigKeyAsc();
}
