package com.courseenglish.api.util;

import com.courseenglish.api.domain.*;
import com.courseenglish.api.domain.request.*;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.UUID;

public final class CatalogSearchSpecs {
    private CatalogSearchSpecs() {
    }

    public static Specification<User> userSearch(ReqSearchUserDTO req) {
        return and(
                keywordLike(req.getKeyword(), "name", "email"),
                roleNameEquals(req.getRoleName())
        );
    }

    public static Specification<Role> roleSearch(ReqSearchRoleDTO req) {
        return keywordLike(req.getKeyword(), "name", "code");
    }

    public static Specification<Classroom> classroomSearch(ReqSearchClassroomDTO req) {
        return keywordLike(req.getKeyword(), "name", "code");
    }

    public static Specification<Subject> subjectSearch(ReqSearchSubjectDTO req) {
        return and(
                subjectKeywordLike(req.getKeyword()),
                classroomIdEquals(req.getClassroomId())
        );
    }

    public static Specification<Enrollment> enrollmentSearch(ReqSearchEnrollmentDTO req) {
        return and(
                enrollmentKeywordLike(req.getKeyword()),
                enrollmentClassroomIdEquals(req.getClassroomId()),
                enrollmentStudentIdEquals(req.getStudentId()),
                statusEquals(req.getStatus())
        );
    }

    public static Specification<Lesson> lessonSearch(ReqSearchLessonDTO req) {
        return and(
                lessonKeywordLike(req.getKeyword()),
                lessonSubjectIdEquals(req.getSubjectId()),
                lessonStatusEquals(req.getStatus())
        );
    }

    public static Specification<Question> questionSearch(ReqSearchQuestionDTO req) {
        return and(
                questionKeywordLike(req.getKeyword()),
                questionCategoryIdEquals(req.getCategoryId()),
                questionTypeEquals(req.getQuestionType()),
                questionStatusEquals(req.getStatus())
        );
    }

    public static Specification<VocabularySet> vocabularySetSearch(ReqSearchVocabularySetDTO req) {
        return and(
                vocabularySetKeywordLike(req.getKeyword()),
                vocabularySetStatusEquals(req.getStatus()),
                vocabularySetSubjectIdEquals(req.getSubjectId())
        );
    }

    public static Specification<VocabularySet> vocabularySetSubjectIdsIn(List<UUID> subjectIds) {
        if (subjectIds == null || subjectIds.isEmpty()) {
            return (root, query, cb) -> cb.disjunction();
        }
        return (root, query, cb) -> {
            Join<VocabularySet, Subject> subjectJoin = root.join("subject", JoinType.INNER);
            return subjectJoin.get("id").in(subjectIds);
        };
    }

    public static Specification<VocabularyWord> vocabularyWordSearch(ReqSearchVocabularyWordDTO req) {
        return vocabularyWordKeywordLike(req.getKeyword());
    }

    public static Specification<SystemConfig> systemConfigSearch(ReqSearchSystemConfigDTO req) {
        return systemConfigKeywordLike(req.getKeyword());
    }

    private static Specification<SystemConfig> systemConfigKeywordLike(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        String pattern = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("configKey")), pattern),
                cb.like(cb.lower(root.get("configValue")), pattern),
                cb.like(cb.lower(root.get("note")), pattern)
        );
    }

    private static Specification<VocabularyWord> vocabularyWordKeywordLike(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        String pattern = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("wordEn")), pattern),
                cb.like(cb.lower(root.get("wordKey")), pattern),
                cb.like(cb.lower(root.get("meaningVi")), pattern)
        );
    }

    private static Specification<VocabularySet> vocabularySetKeywordLike(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        String pattern = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), pattern),
                cb.like(cb.lower(root.get("description")), pattern)
        );
    }

    private static Specification<VocabularySet> vocabularySetStatusEquals(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String normalized = status.trim().toUpperCase();
        return (root, query, cb) -> cb.equal(cb.upper(root.get("status")), normalized);
    }

    private static Specification<VocabularySet> vocabularySetSubjectIdEquals(java.util.UUID subjectId) {
        if (subjectId == null) {
            return null;
        }
        return (root, query, cb) -> {
            Join<VocabularySet, Subject> subjectJoin = root.join("subject", JoinType.INNER);
            return cb.equal(subjectJoin.get("id"), subjectId);
        };
    }

    private static Specification<Question> questionKeywordLike(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        String pattern = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("promptText")), pattern),
                cb.like(cb.lower(root.get("explanation")), pattern)
        );
    }

    private static Specification<Question> questionCategoryIdEquals(java.util.UUID categoryId) {
        if (categoryId == null) {
            return null;
        }
        return (root, query, cb) -> {
            Join<Question, QuestionCategory> categoryJoin = root.join("category", JoinType.INNER);
            return cb.equal(categoryJoin.get("id"), categoryId);
        };
    }

    private static Specification<Question> questionTypeEquals(String questionType) {
        if (questionType == null || questionType.isBlank()) {
            return null;
        }
        String normalized = questionType.trim().toUpperCase();
        return (root, query, cb) -> cb.equal(cb.upper(root.get("questionType")), normalized);
    }

    private static Specification<Question> questionStatusEquals(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String normalized = status.trim().toUpperCase();
        return (root, query, cb) -> cb.equal(cb.upper(root.get("status")), normalized);
    }

    private static Specification<Lesson> lessonKeywordLike(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        String pattern = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> {
            Join<Lesson, Subject> subjectJoin = root.join("subject", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("summary")), pattern),
                    cb.like(cb.lower(subjectJoin.get("name")), pattern)
            );
        };
    }

    private static Specification<Lesson> lessonSubjectIdEquals(java.util.UUID subjectId) {
        if (subjectId == null) {
            return null;
        }
        return (root, query, cb) -> {
            Join<Lesson, Subject> subjectJoin = root.join("subject", JoinType.INNER);
            return cb.equal(subjectJoin.get("id"), subjectId);
        };
    }

    /** Lọc lesson theo danh sách subject — list rỗng → không trả kết quả. */
    public static Specification<Lesson> lessonSubjectIdsIn(List<UUID> subjectIds) {
        if (subjectIds == null || subjectIds.isEmpty()) {
            return (root, query, cb) -> cb.disjunction();
        }
        return (root, query, cb) -> {
            Join<Lesson, Subject> subjectJoin = root.join("subject", JoinType.INNER);
            return subjectJoin.get("id").in(subjectIds);
        };
    }

    private static Specification<Lesson> lessonStatusEquals(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String normalized = status.trim().toUpperCase();
        return (root, query, cb) -> cb.equal(cb.upper(root.get("status")), normalized);
    }

    private static Specification<User> roleNameEquals(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return null;
        }
        String normalized = roleName.trim();
        return (root, query, cb) -> {
            query.distinct(true);
            Join<User, Role> rolesJoin = root.join("roles", JoinType.INNER);
            return cb.equal(rolesJoin.get("name"), normalized);
        };
    }

    private static Specification<Subject> subjectKeywordLike(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        String pattern = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> {
            Join<Subject, Classroom> classroomJoin = root.join("classroom", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(classroomJoin.get("name")), pattern)
            );
        };
    }

    private static Specification<Subject> classroomIdEquals(java.util.UUID classroomId) {
        if (classroomId == null) {
            return null;
        }
        return (root, query, cb) -> {
            Join<Subject, Classroom> classroomJoin = root.join("classroom", JoinType.INNER);
            return cb.equal(classroomJoin.get("id"), classroomId);
        };
    }

    private static Specification<Enrollment> enrollmentKeywordLike(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        String pattern = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> {
            query.distinct(true);
            Join<Enrollment, Classroom> classroomJoin = root.join("classroom", JoinType.LEFT);
            Join<Enrollment, User> studentJoin = root.join("student", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(classroomJoin.get("name")), pattern),
                    cb.like(cb.lower(studentJoin.get("name")), pattern),
                    cb.like(cb.lower(studentJoin.get("email")), pattern)
            );
        };
    }

    private static Specification<Enrollment> enrollmentClassroomIdEquals(java.util.UUID classroomId) {
        if (classroomId == null) {
            return null;
        }
        return (root, query, cb) -> {
            Join<Enrollment, Classroom> classroomJoin = root.join("classroom", JoinType.INNER);
            return cb.equal(classroomJoin.get("id"), classroomId);
        };
    }

    private static Specification<Enrollment> enrollmentStudentIdEquals(java.util.UUID studentId) {
        if (studentId == null) {
            return null;
        }
        return (root, query, cb) -> {
            Join<Enrollment, User> studentJoin = root.join("student", JoinType.INNER);
            return cb.equal(studentJoin.get("id"), studentId);
        };
    }

    private static Specification<Enrollment> statusEquals(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String normalized = status.trim().toUpperCase();
        return (root, query, cb) -> cb.equal(cb.upper(root.get("status")), normalized);
    }

    private static <T> Specification<T> keywordLike(String keyword, String... fields) {
        if (keyword == null || keyword.isBlank() || fields == null || fields.length == 0) {
            return null;
        }
        String pattern = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> {
            var predicates = new jakarta.persistence.criteria.Predicate[fields.length];
            for (int i = 0; i < fields.length; i++) {
                predicates[i] = cb.like(cb.lower(root.get(fields[i])), pattern);
            }
            return cb.or(predicates);
        };
    }

    @SafeVarargs
    private static <T> Specification<T> and(Specification<T>... specs) {
        Specification<T> combined = null;
        if (specs == null) {
            return null;
        }
        for (Specification<T> spec : specs) {
            if (spec == null) {
                continue;
            }
            combined = combined == null ? spec : combined.and(spec);
        }
        return combined;
    }
}
