package com.courseenglish.api.repository;

import com.courseenglish.api.domain.AiDocument;
import com.courseenglish.api.util.constant.AiDocumentStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AiDocumentRepository extends JpaRepository<AiDocument, UUID> {

  Optional<AiDocument> findByIdAndUserIdAndVoidedFalse(UUID id, UUID userId);

  Optional<AiDocument> findByIdAndUserIdAndStatusAndVoidedFalse(
      UUID id, UUID userId, AiDocumentStatusEnum status);
}
