package com.courseenglish.api.repository;

import com.courseenglish.api.domain.StudentNotebookEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface StudentNotebookEntryRepository
        extends JpaRepository<StudentNotebookEntry, UUID>, JpaSpecificationExecutor<StudentNotebookEntry> {

    Optional<StudentNotebookEntry> findByIdAndVoidedFalse(UUID id);

    Optional<StudentNotebookEntry> findByStudentIdAndWordIdAndStoryIdAndVoidedFalse(
            UUID studentId, UUID wordId, UUID storyId);
}
