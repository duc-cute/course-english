package com.courseenglish.api.repository;

import com.courseenglish.api.domain.InnovationIdea;
import com.courseenglish.api.util.constant.InnovationIdeaStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InnovationIdeaRepository extends JpaRepository<InnovationIdea, UUID>, JpaSpecificationExecutor<InnovationIdea> {

    Optional<InnovationIdea> findByIdAndVoidedFalse(UUID id);

    long countByCreatedByUserIdAndStatusAndVoidedFalse(UUID createdByUserId, InnovationIdeaStatusEnum status);

    Optional<InnovationIdea> findFirstByStatusAndVoidedFalseOrderByVoteCountDescCreatedAtDesc(InnovationIdeaStatusEnum status);
}
