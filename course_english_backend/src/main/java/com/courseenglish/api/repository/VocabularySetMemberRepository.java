package com.courseenglish.api.repository;

import com.courseenglish.api.domain.VocabularySetMember;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VocabularySetMemberRepository extends JpaRepository<VocabularySetMember, UUID> {

    @Query("""
            SELECT m FROM VocabularySetMember m
            JOIN FETCH m.vocabularyWord w
            WHERE m.vocabularySet.id = :setId
              AND m.voided = false
              AND w.voided = false
            ORDER BY m.displayOrder ASC
            """)
    List<VocabularySetMember> findResolvedBySetId(@Param("setId") UUID setId);

    List<VocabularySetMember> findByVocabularySet_IdAndVoidedFalseOrderByDisplayOrderAsc(UUID setId);

    List<VocabularySetMember> findByVocabularySet_Id(UUID setId);

    long countByVocabularySet_IdAndVoidedFalse(UUID setId);

    boolean existsByVocabularySet_IdAndVocabularyWord_IdAndVoidedFalse(UUID setId, UUID wordId);

    @Query("""
            SELECT w.wordEn FROM VocabularySetMember m
            JOIN m.vocabularyWord w
            WHERE m.vocabularySet.id = :setId
              AND m.voided = false
              AND w.voided = false
            ORDER BY m.displayOrder ASC
            """)
    List<String> findPreviewWordEnsBySetId(@Param("setId") UUID setId, Pageable pageable);
}
