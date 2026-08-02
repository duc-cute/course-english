package com.courseenglish.api.repository;

import com.courseenglish.api.domain.InnovationIdeaComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InnovationIdeaCommentRepository extends JpaRepository<InnovationIdeaComment, UUID> {

    List<InnovationIdeaComment> findByIdeaIdAndVoidedFalseOrderByCreatedAtAsc(UUID ideaId);

    long countByIdeaIdAndVoidedFalse(UUID ideaId);
}
