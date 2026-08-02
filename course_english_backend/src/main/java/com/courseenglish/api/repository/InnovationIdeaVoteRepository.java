package com.courseenglish.api.repository;

import com.courseenglish.api.domain.InnovationIdeaVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InnovationIdeaVoteRepository extends JpaRepository<InnovationIdeaVote, UUID> {

    Optional<InnovationIdeaVote> findByIdeaIdAndUserId(UUID ideaId, UUID userId);

    boolean existsByIdeaIdAndUserId(UUID ideaId, UUID userId);

    long countByIdeaId(UUID ideaId);

    List<InnovationIdeaVote> findByCreatedAtGreaterThanEqualAndVoidedFalse(Instant from);
}
