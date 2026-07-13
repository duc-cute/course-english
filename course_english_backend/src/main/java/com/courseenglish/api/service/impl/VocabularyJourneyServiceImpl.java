package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.VocabularyJourney;
import com.courseenglish.api.domain.VocabularyJourneyClassroom;
import com.courseenglish.api.domain.VocabularySet;
import com.courseenglish.api.domain.VocabularyTopic;
import com.courseenglish.api.domain.VocabularyTopicMember;
import com.courseenglish.api.domain.request.ReqSearchVocabularyJourneyDTO;
import com.courseenglish.api.domain.request.ReqVocabularyJourneyClassroomsDTO;
import com.courseenglish.api.domain.request.ReqVocabularyJourneyDTO;
import com.courseenglish.api.domain.request.ReqVocabularyTopicDTO;
import com.courseenglish.api.domain.request.ReqVocabularyTopicMembersDTO;
import com.courseenglish.api.domain.response.ResVocabularyJourneyClassroomDTO;
import com.courseenglish.api.domain.response.ResVocabularyJourneyDTO;
import com.courseenglish.api.domain.response.ResVocabularyTopicDTO;
import com.courseenglish.api.domain.response.ResVocabularyTopicMemberDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.ClassroomRepository;
import com.courseenglish.api.repository.VocabularyJourneyClassroomRepository;
import com.courseenglish.api.repository.VocabularyJourneyRepository;
import com.courseenglish.api.repository.VocabularySetMemberRepository;
import com.courseenglish.api.repository.VocabularySetRepository;
import com.courseenglish.api.repository.VocabularyTopicMemberRepository;
import com.courseenglish.api.repository.VocabularyTopicRepository;
import com.courseenglish.api.service.StudentEnrollmentAccessService;
import com.courseenglish.api.service.VocabularyJourneyService;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.constant.VocabularyJourneyStatusEnum;
import com.courseenglish.api.util.constant.VocabularySetStatusEnum;
import com.courseenglish.api.util.constant.VocabularyTopicStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VocabularyJourneyServiceImpl implements VocabularyJourneyService {

    private final VocabularyJourneyRepository journeyRepository;
    private final VocabularyJourneyClassroomRepository journeyClassroomRepository;
    private final VocabularyTopicRepository topicRepository;
    private final VocabularyTopicMemberRepository topicMemberRepository;
    private final VocabularySetRepository vocabularySetRepository;
    private final VocabularySetMemberRepository setMemberRepository;
    private final ClassroomRepository classroomRepository;
    private final StudentEnrollmentAccessService enrollmentAccessService;

    public VocabularyJourneyServiceImpl(
            VocabularyJourneyRepository journeyRepository,
            VocabularyJourneyClassroomRepository journeyClassroomRepository,
            VocabularyTopicRepository topicRepository,
            VocabularyTopicMemberRepository topicMemberRepository,
            VocabularySetRepository vocabularySetRepository,
            VocabularySetMemberRepository setMemberRepository,
            ClassroomRepository classroomRepository,
            StudentEnrollmentAccessService enrollmentAccessService) {
        this.journeyRepository = journeyRepository;
        this.journeyClassroomRepository = journeyClassroomRepository;
        this.topicRepository = topicRepository;
        this.topicMemberRepository = topicMemberRepository;
        this.vocabularySetRepository = vocabularySetRepository;
        this.setMemberRepository = setMemberRepository;
        this.classroomRepository = classroomRepository;
        this.enrollmentAccessService = enrollmentAccessService;
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO search(ReqSearchVocabularyJourneyDTO request) throws IdInvalidException {
        requireStaff();
        ReqSearchVocabularyJourneyDTO req = request == null ? new ReqSearchVocabularyJourneyDTO() : request;
        int page = req.getPage() == null || req.getPage() < 0 ? 0 : req.getPage();
        int size = req.getSize() == null || req.getSize() < 1 ? 20 : Math.min(req.getSize(), 100);
        Pageable pageable = PageRequest.of(page, size, parseSort(req.getSort()));

        Page<VocabularyJourney> result = journeyRepository.findAll(buildSearchSpec(req), pageable);

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(result.getNumber());
        meta.setPageSize(result.getSize());
        meta.setPages(result.getTotalPages());
        meta.setTotal(result.getTotalElements());

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(result.getContent().stream().map(j -> toJourneyDto(j, false)).toList());
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public ResVocabularyJourneyDTO getById(UUID id) throws IdInvalidException {
        requireStaff();
        VocabularyJourney journey = requireJourney(id);
        requireTeacherCanAccessJourney(journey);
        return toJourneyDto(journey, true);
    }

    @Override
    @Transactional
    public ResVocabularyJourneyDTO create(ReqVocabularyJourneyDTO request) throws IdInvalidException {
        requireStaff();
        VocabularyJourney journey = new VocabularyJourney();
        applyJourneyFields(journey, request);
        journey = journeyRepository.save(journey);
        return toJourneyDto(journey, true);
    }

    @Override
    @Transactional
    public ResVocabularyJourneyDTO update(UUID id, ReqVocabularyJourneyDTO request) throws IdInvalidException {
        requireStaff();
        VocabularyJourney journey = requireJourney(id);
        requireTeacherCanAccessJourney(journey);
        applyJourneyFields(journey, request);
        journey = journeyRepository.save(journey);
        return toJourneyDto(journey, true);
    }

    @Override
    @Transactional
    public void delete(UUID id) throws IdInvalidException {
        requireStaff();
        VocabularyJourney journey = requireJourney(id);
        requireTeacherCanAccessJourney(journey);
        journey.setVoided(true);
        journeyRepository.save(journey);
        for (VocabularyJourneyClassroom link : journeyClassroomRepository.findByJourney_IdAndVoidedFalse(id)) {
            journeyClassroomRepository.delete(link);
        }
        for (VocabularyTopic topic : topicRepository.findByJourney_IdAndVoidedFalseOrderByDisplayOrderAscTitleAsc(id)) {
            topic.setVoided(true);
            topicRepository.save(topic);
        }
    }

    @Override
    @Transactional
    public ResVocabularyJourneyDTO replaceClassrooms(UUID journeyId, ReqVocabularyJourneyClassroomsDTO request)
            throws IdInvalidException {
        requireStaff();
        VocabularyJourney journey = requireJourney(journeyId);
        requireTeacherCanAccessJourney(journey);

        List<UUID> requestedIds = request.getClassroomIds() == null
                ? Collections.emptyList()
                : request.getClassroomIds().stream().filter(Objects::nonNull).distinct().toList();

        List<Classroom> classrooms = new ArrayList<>();
        for (UUID classroomId : requestedIds) {
            Classroom classroom = classroomRepository
                    .findByIdAndVoidedFalse(classroomId)
                    .orElseThrow(() -> new IdInvalidException("Lớp học không tồn tại: " + classroomId));
            requireTeacherCanAssignClassroom(classroom);
            classrooms.add(classroom);
        }

        Set<UUID> keepIds = classrooms.stream().map(Classroom::getId).collect(Collectors.toSet());
        for (VocabularyJourneyClassroom existing :
                journeyClassroomRepository.findByJourney_IdAndVoidedFalse(journeyId)) {
            if (!keepIds.contains(existing.getClassroom().getId())) {
                journeyClassroomRepository.delete(existing);
            }
        }

        for (Classroom classroom : classrooms) {
            VocabularyJourneyClassroom link = journeyClassroomRepository
                    .findByClassroom_IdAndVoidedFalse(classroom.getId())
                    .orElse(null);
            if (link == null) {
                link = new VocabularyJourneyClassroom();
                link.setClassroom(classroom);
                link.setJourney(journey);
                journeyClassroomRepository.save(link);
            } else if (!journey.getId().equals(link.getJourney().getId())) {
                // 1 class = 1 journey: replace
                link.setJourney(journey);
                journeyClassroomRepository.save(link);
            }
        }

        return toJourneyDto(journey, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResVocabularyTopicDTO> listTopics(UUID journeyId) throws IdInvalidException {
        requireStaff();
        VocabularyJourney journey = requireJourney(journeyId);
        requireTeacherCanAccessJourney(journey);
        return topicRepository.findByJourney_IdAndVoidedFalseOrderByDisplayOrderAscTitleAsc(journeyId).stream()
                .map(t -> toTopicDto(t, false))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ResVocabularyTopicDTO getTopic(UUID topicId) throws IdInvalidException {
        requireStaff();
        VocabularyTopic topic = requireTopic(topicId);
        requireTeacherCanAccessJourney(topic.getJourney());
        return toTopicDto(topic, true);
    }

    @Override
    @Transactional
    public ResVocabularyTopicDTO createTopic(ReqVocabularyTopicDTO request) throws IdInvalidException {
        requireStaff();
        VocabularyJourney journey = requireJourney(request.getJourneyId());
        requireTeacherCanAccessJourney(journey);
        VocabularyTopic topic = new VocabularyTopic();
        topic.setJourney(journey);
        applyTopicFields(topic, request);
        topic = topicRepository.save(topic);
        // New topic has no members yet — skip JOIN FETCH sets (avoids empty-join cost).
        return toTopicDto(topic, false);
    }

    @Override
    @Transactional
    public ResVocabularyTopicDTO updateTopic(UUID topicId, ReqVocabularyTopicDTO request)
            throws IdInvalidException {
        requireStaff();
        VocabularyTopic topic = requireTopic(topicId);
        requireTeacherCanAccessJourney(topic.getJourney());
        if (request.getJourneyId() != null
                && !request.getJourneyId().equals(topic.getJourney().getId())) {
            throw new IdInvalidException("Không được đổi journey của topic.");
        }
        applyTopicFields(topic, request);
        topic = topicRepository.save(topic);
        return toTopicDto(topic, true);
    }

    @Override
    @Transactional
    public void deleteTopic(UUID topicId) throws IdInvalidException {
        requireStaff();
        VocabularyTopic topic = requireTopic(topicId);
        requireTeacherCanAccessJourney(topic.getJourney());
        topic.setVoided(true);
        topicRepository.save(topic);
        for (VocabularyTopicMember member :
                topicMemberRepository.findByTopic_IdAndVoidedFalseOrderByDisplayOrderAsc(topicId)) {
            member.setVoided(true);
            topicMemberRepository.save(member);
        }
    }

    @Override
    @Transactional
    public ResVocabularyTopicDTO replaceTopicMembers(UUID topicId, ReqVocabularyTopicMembersDTO request)
            throws IdInvalidException {
        requireStaff();
        VocabularyTopic topic = requireTopic(topicId);
        requireTeacherCanAccessJourney(topic.getJourney());

        List<UUID> setIds = request.getVocabularySetIds() == null
                ? Collections.emptyList()
                : request.getVocabularySetIds().stream().filter(Objects::nonNull).distinct().toList();

        List<VocabularySet> sets = new ArrayList<>();
        for (UUID setId : setIds) {
            VocabularySet set = vocabularySetRepository
                    .findByIdAndVoidedFalse(setId)
                    .orElseThrow(() -> new IdInvalidException("Bộ từ không tồn tại: " + setId));
            sets.add(set);
        }

        Set<UUID> keepIds = sets.stream().map(VocabularySet::getId).collect(Collectors.toSet());
        for (VocabularyTopicMember existing :
                topicMemberRepository.findByTopic_IdAndVoidedFalseOrderByDisplayOrderAsc(topicId)) {
            if (!keepIds.contains(existing.getVocabularySet().getId())) {
                existing.setVoided(true);
                topicMemberRepository.save(existing);
            }
        }

        int order = 0;
        for (VocabularySet set : sets) {
            VocabularyTopicMember member = topicMemberRepository
                    .findByTopic_IdAndVocabularySet_Id(topicId, set.getId())
                    .orElse(null);
            if (member == null) {
                member = new VocabularyTopicMember();
                member.setTopic(topic);
                member.setVocabularySet(set);
            }
            member.setDisplayOrder(order++);
            member.setVoided(false);
            topicMemberRepository.save(member);
        }

        return toTopicDto(topic, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResVocabularyJourneyDTO> listForCurrentStudent() throws IdInvalidException {
        List<UUID> classroomIds = enrollmentAccessService.resolveEnrolledClassroomIds(null);
        if (classroomIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<VocabularyJourneyClassroom> links =
                journeyClassroomRepository.findActiveByClassroomIds(classroomIds);

        Map<UUID, VocabularyJourney> deduped = new LinkedHashMap<>();
        for (VocabularyJourneyClassroom link : links) {
            VocabularyJourney journey = link.getJourney();
            if (journey == null || journey.isVoided()) {
                continue;
            }
            if (journey.getStatus() != VocabularyJourneyStatusEnum.PUBLISHED) {
                continue;
            }
            deduped.putIfAbsent(journey.getId(), journey);
        }

        return deduped.values().stream()
                .sorted(Comparator
                        .comparingInt(VocabularyJourney::getDisplayOrder)
                        .thenComparing(VocabularyJourney::getTitle, String.CASE_INSENSITIVE_ORDER))
                .map(j -> toJourneyDto(j, false))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ResVocabularyJourneyDTO getForCurrentStudent(UUID journeyId) throws IdInvalidException {
        ensureStudentCanAccessJourney(journeyId);
        VocabularyJourney journey = journeyRepository
                .findByIdAndStatusAndVoidedFalse(journeyId, VocabularyJourneyStatusEnum.PUBLISHED)
                .orElseThrow(() -> new IdInvalidException("Journey không tồn tại hoặc chưa xuất bản."));

        ResVocabularyJourneyDTO dto = toJourneyDto(journey, false);
        List<ResVocabularyTopicDTO> topics = topicRepository
                .findPublishedByJourneyId(journeyId, VocabularyTopicStatusEnum.PUBLISHED)
                .stream()
                .map(t -> {
                    ResVocabularyTopicDTO topicDto = toTopicDto(t, true);
                    List<ResVocabularyTopicMemberDTO> publishedOnly = topicDto.getMembers().stream()
                            .filter(m -> VocabularySetStatusEnum.PUBLISHED.name()
                                    .equalsIgnoreCase(m.getStatus()))
                            .toList();
                    topicDto.setMembers(publishedOnly);
                    topicDto.setSetCount(publishedOnly.size());
                    return topicDto;
                })
                .toList();
        return enrichStudentJourney(dto, topics);
    }

    @Override
    @Transactional(readOnly = true)
    public ResVocabularyTopicDTO getTopicSetsForCurrentStudent(UUID topicId) throws IdInvalidException {
        VocabularyTopic topic = requireTopic(topicId);
        if (topic.getStatus() != VocabularyTopicStatusEnum.PUBLISHED) {
            throw new IdInvalidException("Topic chưa được xuất bản.");
        }
        ensureStudentCanAccessJourney(topic.getJourney().getId());

        ResVocabularyTopicDTO dto = toTopicDto(topic, true);
        List<ResVocabularyTopicMemberDTO> publishedOnly = dto.getMembers().stream()
                .filter(m -> VocabularySetStatusEnum.PUBLISHED.name().equalsIgnoreCase(m.getStatus()))
                .toList();
        dto.setMembers(publishedOnly);
        dto.setSetCount(publishedOnly.size());
        return dto;
    }

    private ResVocabularyJourneyDTO enrichStudentJourney(
            ResVocabularyJourneyDTO dto, List<ResVocabularyTopicDTO> topics) {
        dto.setTopicCount(topics.size());
        // Store published topics in classrooms list is wrong. Add field topics to DTO.
        dto.setTopics(topics);
        return dto;
    }

    private void ensureStudentCanAccessJourney(UUID journeyId) throws IdInvalidException {
        List<UUID> classroomIds = enrollmentAccessService.resolveEnrolledClassroomIds(null);
        if (classroomIds.isEmpty()) {
            throw new IdInvalidException("Bạn chưa được ghi danh lớp nào.");
        }
        boolean allowed = journeyClassroomRepository.findActiveByClassroomIds(classroomIds).stream()
                .anyMatch(link -> link.getJourney() != null && journeyId.equals(link.getJourney().getId()));
        if (!allowed) {
            throw new IdInvalidException("Journey không thuộc lớp của bạn.");
        }
    }

    private void applyJourneyFields(VocabularyJourney journey, ReqVocabularyJourneyDTO request)
            throws IdInvalidException {
        journey.setTitle(request.getTitle().trim());
        journey.setDescription(blankToNull(request.getDescription()));
        journey.setCoverImageUrl(blankToNull(request.getCoverImageUrl()));
        if (request.getDisplayOrder() != null) {
            journey.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                journey.setStatus(VocabularyJourneyStatusEnum.valueOf(request.getStatus().trim().toUpperCase()));
            } catch (IllegalArgumentException ex) {
                throw new IdInvalidException("status không hợp lệ (DRAFT|PUBLISHED|ARCHIVED).");
            }
        }
    }

    private void applyTopicFields(VocabularyTopic topic, ReqVocabularyTopicDTO request)
            throws IdInvalidException {
        topic.setTitle(request.getTitle().trim());
        topic.setSlug(blankToNull(request.getSlug()));
        topic.setSubtitle(blankToNull(request.getSubtitle()));
        topic.setCoverImageUrl(blankToNull(request.getCoverImageUrl()));
        topic.setThemeColor(blankToNull(request.getThemeColor()));
        if (request.getDisplayOrder() != null) {
            topic.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                topic.setStatus(VocabularyTopicStatusEnum.valueOf(request.getStatus().trim().toUpperCase()));
            } catch (IllegalArgumentException ex) {
                throw new IdInvalidException("status không hợp lệ (DRAFT|PUBLISHED).");
            }
        }
    }

    private Specification<VocabularyJourney> buildSearchSpec(ReqSearchVocabularyJourneyDTO req) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("voided")));
            if (req.getStatus() != null && !req.getStatus().isBlank()) {
                try {
                    predicates.add(cb.equal(
                            root.get("status"),
                            VocabularyJourneyStatusEnum.valueOf(req.getStatus().trim().toUpperCase())));
                } catch (IllegalArgumentException ignored) {
                    predicates.add(cb.disjunction());
                }
            }
            if (req.getKeyword() != null && !req.getKeyword().isBlank()) {
                String pattern = "%" + req.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("title")), pattern));
            }
            // Teacher: journey chưa gán lớp nào, hoặc đã gán ít nhất 1 lớp mình phụ trách
            if (!SercurityUtil.isAdminUser()) {
                UUID userId = SercurityUtil.getCurrentUserId().orElse(null);
                if (userId == null) {
                    predicates.add(cb.disjunction());
                } else if (query != null) {
                    var sqCount = query.subquery(Long.class);
                    var linkRoot = sqCount.from(VocabularyJourneyClassroom.class);
                    sqCount.select(cb.count(linkRoot));
                    sqCount.where(
                            cb.equal(linkRoot.get("journey").get("id"), root.get("id")),
                            cb.isFalse(linkRoot.get("voided")));

                    var sqOwn = query.subquery(Long.class);
                    var ownRoot = sqOwn.from(VocabularyJourneyClassroom.class);
                    sqOwn.select(cb.count(ownRoot));
                    sqOwn.where(
                            cb.equal(ownRoot.get("journey").get("id"), root.get("id")),
                            cb.isFalse(ownRoot.get("voided")),
                            cb.equal(ownRoot.get("classroom").get("teacher").get("id"), userId));

                    predicates.add(cb.or(cb.equal(sqCount, 0L), cb.greaterThan(sqOwn, 0L)));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.ASC, "displayOrder").and(Sort.by(Sort.Direction.ASC, "title"));
        }
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        Sort.Direction dir =
                parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC;
        return Sort.by(dir, field);
    }

    private VocabularyJourney requireJourney(UUID id) throws IdInvalidException {
        return journeyRepository
                .findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Journey không tồn tại."));
    }

    private VocabularyTopic requireTopic(UUID id) throws IdInvalidException {
        return topicRepository
                .findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Topic không tồn tại."));
    }

    private void requireStaff() throws IdInvalidException {
        if (!SercurityUtil.isStaffUser()) {
            throw new IdInvalidException("Chỉ giáo viên hoặc quản trị mới thao tác được.");
        }
    }

    private void requireTeacherCanAssignClassroom(Classroom classroom) throws IdInvalidException {
        if (SercurityUtil.isAdminUser()) {
            return;
        }
        UUID userId = SercurityUtil.getCurrentUserId()
                .orElseThrow(() -> new IdInvalidException("Không xác định được người dùng"));
        if (classroom.getTeacher() == null
                || classroom.getTeacher().getId() == null
                || !classroom.getTeacher().getId().equals(userId)) {
            throw new IdInvalidException("Bạn chỉ được gán journey cho lớp mình phụ trách");
        }
    }

    private void requireTeacherCanAccessJourney(VocabularyJourney journey) throws IdInvalidException {
        if (SercurityUtil.isAdminUser()) {
            return;
        }
        UUID userId = SercurityUtil.getCurrentUserId()
                .orElseThrow(() -> new IdInvalidException("Không xác định được người dùng"));
        List<VocabularyJourneyClassroom> links =
                journeyClassroomRepository.findActiveWithClassroomByJourneyId(journey.getId());
        if (links.isEmpty()) {
            return;
        }
        boolean ownsAny = links.stream().anyMatch(link -> {
            Classroom c = link.getClassroom();
            return c != null && c.getTeacher() != null && userId.equals(c.getTeacher().getId());
        });
        if (!ownsAny) {
            throw new IdInvalidException("Bạn không có quyền với journey này.");
        }
    }

    private ResVocabularyJourneyDTO toJourneyDto(VocabularyJourney journey, boolean includeClassrooms) {
        ResVocabularyJourneyDTO dto = new ResVocabularyJourneyDTO();
        dto.setId(journey.getId());
        dto.setTitle(journey.getTitle());
        dto.setDescription(journey.getDescription());
        dto.setCoverImageUrl(journey.getCoverImageUrl());
        dto.setStatus(journey.getStatus() == null ? null : journey.getStatus().name());
        dto.setDisplayOrder(journey.getDisplayOrder());
        dto.setCreatedAt(journey.getCreatedAt());
        dto.setUpdatedAt(journey.getUpdatedAt());

        List<VocabularyTopic> topics =
                topicRepository.findByJourney_IdAndVoidedFalseOrderByDisplayOrderAscTitleAsc(journey.getId());
        dto.setTopicCount(topics.size());

        List<VocabularyJourneyClassroom> links =
                journeyClassroomRepository.findActiveWithClassroomByJourneyId(journey.getId());
        dto.setClassroomCount(links.size());
        if (includeClassrooms) {
            dto.setClassrooms(links.stream().map(this::toClassroomDto).toList());
        }
        return dto;
    }

    private ResVocabularyJourneyClassroomDTO toClassroomDto(VocabularyJourneyClassroom link) {
        ResVocabularyJourneyClassroomDTO dto = new ResVocabularyJourneyClassroomDTO();
        dto.setId(link.getId());
        if (link.getClassroom() != null) {
            dto.setClassroomId(link.getClassroom().getId());
            dto.setClassroomName(link.getClassroom().getName());
        }
        return dto;
    }

    private ResVocabularyTopicDTO toTopicDto(VocabularyTopic topic, boolean includeMembers) {
        ResVocabularyTopicDTO dto = new ResVocabularyTopicDTO();
        dto.setId(topic.getId());
        if (topic.getJourney() != null) {
            dto.setJourneyId(topic.getJourney().getId());
            dto.setJourneyTitle(topic.getJourney().getTitle());
        }
        dto.setSlug(topic.getSlug());
        dto.setTitle(topic.getTitle());
        dto.setSubtitle(topic.getSubtitle());
        dto.setCoverImageUrl(topic.getCoverImageUrl());
        dto.setThemeColor(topic.getThemeColor());
        dto.setDisplayOrder(topic.getDisplayOrder());
        dto.setStatus(topic.getStatus() == null ? null : topic.getStatus().name());
        dto.setCreatedAt(topic.getCreatedAt());
        dto.setUpdatedAt(topic.getUpdatedAt());

        if (includeMembers) {
            List<ResVocabularyTopicMemberDTO> members = topicMemberRepository
                    .findActiveWithSetByTopicId(topic.getId())
                    .stream()
                    .map(this::toMemberDto)
                    .toList();
            dto.setMembers(members);
            dto.setSetCount(members.size());
        } else {
            dto.setSetCount((int) topicMemberRepository.countByTopic_IdAndVoidedFalse(topic.getId()));
        }
        return dto;
    }

    private ResVocabularyTopicMemberDTO toMemberDto(VocabularyTopicMember member) {
        ResVocabularyTopicMemberDTO dto = new ResVocabularyTopicMemberDTO();
        dto.setId(member.getId());
        dto.setDisplayOrder(member.getDisplayOrder());
        VocabularySet set = member.getVocabularySet();
        if (set != null) {
            dto.setVocabularySetId(set.getId());
            dto.setVocabularySetTitle(set.getTitle());
            dto.setCoverImageUrl(set.getCoverImageUrl());
            dto.setDescription(set.getDescription());
            dto.setStatus(set.getStatus() == null ? null : set.getStatus().name());
            if (set.getSubject() != null) {
                dto.setSubjectName(set.getSubject().getName());
            }
            dto.setItemCount(setMemberRepository.countByVocabularySet_IdAndVoidedFalse(set.getId()));
        }
        return dto;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
