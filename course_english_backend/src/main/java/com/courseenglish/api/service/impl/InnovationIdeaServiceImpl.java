package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.InnovationIdea;
import com.courseenglish.api.domain.InnovationIdeaComment;
import com.courseenglish.api.domain.InnovationIdeaVote;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.request.ReqCreateInnovationCommentDTO;
import com.courseenglish.api.domain.request.ReqCreateInnovationIdeaDTO;
import com.courseenglish.api.domain.request.ReqSearchInnovationIdeaDTO;
import com.courseenglish.api.domain.request.ReqUpdateInnovationIdeaStatusDTO;
import com.courseenglish.api.domain.response.ResInnovationCommentDTO;
import com.courseenglish.api.domain.response.ResInnovationHubStatsDTO;
import com.courseenglish.api.domain.response.ResInnovationIdeaDTO;
import com.courseenglish.api.domain.response.ResInnovationVoteToggleDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.InnovationIdeaCommentRepository;
import com.courseenglish.api.repository.InnovationIdeaRepository;
import com.courseenglish.api.repository.InnovationIdeaVoteRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.service.InnovationIdeaService;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.constant.InnovationIdeaCategoryEnum;
import com.courseenglish.api.util.constant.InnovationIdeaPriorityEnum;
import com.courseenglish.api.util.constant.InnovationIdeaSortModeEnum;
import com.courseenglish.api.util.constant.InnovationIdeaStatusEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InnovationIdeaServiceImpl implements InnovationIdeaService {

    private final InnovationIdeaRepository ideaRepository;
    private final InnovationIdeaVoteRepository voteRepository;
    private final InnovationIdeaCommentRepository commentRepository;
    private final UserRepository userRepository;

    public InnovationIdeaServiceImpl(
            InnovationIdeaRepository ideaRepository,
            InnovationIdeaVoteRepository voteRepository,
            InnovationIdeaCommentRepository commentRepository,
            UserRepository userRepository
    ) {
        this.ideaRepository = ideaRepository;
        this.voteRepository = voteRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO search(ReqSearchInnovationIdeaDTO req) throws IdInvalidException {
        ReqSearchInnovationIdeaDTO payload = req == null ? new ReqSearchInnovationIdeaDTO() : req;
        UUID currentUserId = requireCurrentUserId();

        InnovationIdeaSortModeEnum sortMode = payload.getSortMode() != null
                ? payload.getSortMode()
                : InnovationIdeaSortModeEnum.FEATURED;

        Specification<InnovationIdea> spec = buildSearchSpec(payload, currentUserId, sortMode, true);
        Pageable pageable = toPageable(payload, sortMode);
        Page<InnovationIdea> page = ideaRepository.findAll(spec, pageable);

        // TRENDING with empty week → fallback FEATURED sort (no 7-day filter)
        if (sortMode == InnovationIdeaSortModeEnum.TRENDING && page.getTotalElements() == 0) {
            sortMode = InnovationIdeaSortModeEnum.FEATURED;
            spec = buildSearchSpec(payload, currentUserId, sortMode, false);
            pageable = toPageable(payload, sortMode);
            page = ideaRepository.findAll(spec, pageable);
        }

        Set<UUID> votedIdeaIds = loadVotedIdeaIds(currentUserId, page.getContent());
        Map<UUID, String> nameCache = new HashMap<>();

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setTotal(page.getTotalElements());
        meta.setPages(page.getTotalPages());

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(page.getContent().stream()
                .map(idea -> toIdeaDto(idea, votedIdeaIds.contains(idea.getId()), nameCache))
                .collect(Collectors.toList()));
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public ResInnovationIdeaDTO getById(UUID id) throws IdInvalidException {
        InnovationIdea idea = requireIdea(id);
        UUID currentUserId = requireCurrentUserId();
        boolean voted = voteRepository.existsByIdeaIdAndUserId(idea.getId(), currentUserId);
        return toIdeaDto(idea, voted, new HashMap<>());
    }

    private static final String INOVATION_STORAGE_PREFIX = "/storage/inovation/";
    private static final int MAX_IMAGE_URLS = 3;

    @Override
    @Transactional
    public ResInnovationIdeaDTO create(ReqCreateInnovationIdeaDTO req) throws IdInvalidException {
        UUID currentUserId = requireCurrentUserId();
        InnovationIdea idea = new InnovationIdea();
        idea.setTitle(req.getTitle().trim());
        idea.setDescription(req.getDescription().trim());
        idea.setCategory(req.getCategory());
        idea.setPriority(req.getPriority() != null ? req.getPriority() : InnovationIdeaPriorityEnum.MEDIUM);
        idea.setStatus(InnovationIdeaStatusEnum.UNDER_REVIEW);
        idea.setCreatedByUserId(currentUserId);
        idea.setVoteCount(0);
        idea.setCommentCount(0);
        idea.setImageUrls(normalizeImageUrls(req.getImageUrls()));
        InnovationIdea saved = ideaRepository.save(idea);
        return toIdeaDto(saved, false, new HashMap<>());
    }

    @Override
    @Transactional
    public ResInnovationIdeaDTO updateStatus(UUID id, ReqUpdateInnovationIdeaStatusDTO req) throws IdInvalidException {
        InnovationIdea idea = requireIdea(id);
        idea.setStatus(req.getStatus());
        InnovationIdea saved = ideaRepository.save(idea);
        UUID currentUserId = requireCurrentUserId();
        boolean voted = voteRepository.existsByIdeaIdAndUserId(saved.getId(), currentUserId);
        return toIdeaDto(saved, voted, new HashMap<>());
    }

    @Override
    @Transactional
    public ResInnovationVoteToggleDTO toggleVote(UUID ideaId) throws IdInvalidException {
        InnovationIdea idea = requireIdea(ideaId);
        UUID currentUserId = requireCurrentUserId();

        Optional<InnovationIdeaVote> existing = voteRepository.findByIdeaIdAndUserId(ideaId, currentUserId);
        ResInnovationVoteToggleDTO result = new ResInnovationVoteToggleDTO();

        if (existing.isPresent()) {
            voteRepository.delete(existing.get());
            idea.setVoteCount(Math.max(0, idea.getVoteCount() - 1));
            result.setVoted(false);
        } else {
            InnovationIdeaVote vote = new InnovationIdeaVote();
            vote.setIdeaId(ideaId);
            vote.setUserId(currentUserId);
            voteRepository.save(vote);
            idea.setVoteCount(idea.getVoteCount() + 1);
            result.setVoted(true);
        }

        InnovationIdea saved = ideaRepository.save(idea);
        result.setVoteCount(saved.getVoteCount());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResInnovationCommentDTO> listComments(UUID ideaId) throws IdInvalidException {
        requireIdea(ideaId);
        Map<UUID, String> nameCache = new HashMap<>();
        return commentRepository.findByIdeaIdAndVoidedFalseOrderByCreatedAtAsc(ideaId).stream()
                .map(c -> toCommentDto(c, nameCache))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ResInnovationCommentDTO createComment(UUID ideaId, ReqCreateInnovationCommentDTO req) throws IdInvalidException {
        InnovationIdea idea = requireIdea(ideaId);
        UUID currentUserId = requireCurrentUserId();

        InnovationIdeaComment comment = new InnovationIdeaComment();
        comment.setIdeaId(ideaId);
        comment.setUserId(currentUserId);
        comment.setBody(req.getBody().trim());
        InnovationIdeaComment saved = commentRepository.save(comment);

        idea.setCommentCount(idea.getCommentCount() + 1);
        ideaRepository.save(idea);

        return toCommentDto(saved, new HashMap<>());
    }

    @Override
    @Transactional(readOnly = true)
    public ResInnovationHubStatsDTO getStatsSummary() throws IdInvalidException {
        UUID currentUserId = requireCurrentUserId();
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);

        Specification<InnovationIdea> notVoided = (root, query, cb) -> cb.isFalse(root.get("voided"));
        List<InnovationIdea> allIdeas = ideaRepository.findAll(notVoided);

        ResInnovationHubStatsDTO stats = new ResInnovationHubStatsDTO();

        long ideasThisWeek = allIdeas.stream()
                .filter(i -> i.getCreatedAt() != null && !i.getCreatedAt().isBefore(weekAgo))
                .count();
        long votesThisWeek = voteRepository.findByCreatedAtGreaterThanEqualAndVoidedFalse(weekAgo).size();
        stats.setAnalyzedCount(ideasThisWeek + votesThisWeek);

        Map<InnovationIdeaCategoryEnum, Long> categoryCounts = new EnumMap<>(InnovationIdeaCategoryEnum.class);
        for (InnovationIdeaCategoryEnum cat : InnovationIdeaCategoryEnum.values()) {
            categoryCounts.put(cat, 0L);
        }
        for (InnovationIdea idea : allIdeas) {
            if (idea.getCategory() != null) {
                categoryCounts.merge(idea.getCategory(), 1L, Long::sum);
            }
        }
        long totalForShare = allIdeas.size();
        List<ResInnovationHubStatsDTO.CategoryShare> shares = new ArrayList<>();
        if (totalForShare == 0) {
            for (InnovationIdeaCategoryEnum cat : InnovationIdeaCategoryEnum.values()) {
                ResInnovationHubStatsDTO.CategoryShare share = new ResInnovationHubStatsDTO.CategoryShare();
                share.setCategory(cat);
                share.setCount(0);
                share.setPercent(0);
                shares.add(share);
            }
        } else {
            int assigned = 0;
            List<Map.Entry<InnovationIdeaCategoryEnum, Long>> sorted = categoryCounts.entrySet().stream()
                    .sorted(Map.Entry.<InnovationIdeaCategoryEnum, Long>comparingByValue().reversed())
                    .toList();
            for (int i = 0; i < sorted.size(); i++) {
                Map.Entry<InnovationIdeaCategoryEnum, Long> entry = sorted.get(i);
                ResInnovationHubStatsDTO.CategoryShare share = new ResInnovationHubStatsDTO.CategoryShare();
                share.setCategory(entry.getKey());
                share.setCount(entry.getValue());
                int percent;
                if (i == sorted.size() - 1) {
                    percent = Math.max(0, 100 - assigned);
                } else {
                    percent = (int) Math.round(entry.getValue() * 100.0 / totalForShare);
                    assigned += percent;
                }
                share.setPercent(percent);
                shares.add(share);
            }
            shares.sort(Comparator.comparingLong(ResInnovationHubStatsDTO.CategoryShare::getCount).reversed());
        }
        stats.setCategoryShares(shares);

        Map<UUID, Integer> points = new HashMap<>();
        for (InnovationIdea idea : allIdeas) {
            if (idea.getCreatedAt() != null && !idea.getCreatedAt().isBefore(weekAgo)) {
                points.merge(idea.getCreatedByUserId(), 3, Integer::sum);
            }
        }
        for (InnovationIdeaVote vote : voteRepository.findByCreatedAtGreaterThanEqualAndVoidedFalse(weekAgo)) {
            points.merge(vote.getUserId(), 1, Integer::sum);
        }
        Map<UUID, String> nameCache = new HashMap<>();
        List<ResInnovationHubStatsDTO.TopContributor> top = points.entrySet().stream()
                .sorted(Map.Entry.<UUID, Integer>comparingByValue().reversed())
                .limit(3)
                .map(entry -> {
                    ResInnovationHubStatsDTO.TopContributor c = new ResInnovationHubStatsDTO.TopContributor();
                    c.setUserId(entry.getKey());
                    c.setDisplayName(resolveDisplayName(entry.getKey(), nameCache));
                    c.setPoints(entry.getValue());
                    return c;
                })
                .collect(Collectors.toList());
        stats.setTopContributors(top);

        int mineCompleted = (int) ideaRepository.countByCreatedByUserIdAndStatusAndVoidedFalse(
                currentUserId, InnovationIdeaStatusEnum.COMPLETED);
        stats.setMineCompletedCount(mineCompleted);

        ideaRepository.findFirstByStatusAndVoidedFalseOrderByVoteCountDescCreatedAtDesc(InnovationIdeaStatusEnum.COMPLETED)
                .ifPresent(featured -> {
                    ResInnovationHubStatsDTO.FeaturedCompleted fc = new ResInnovationHubStatsDTO.FeaturedCompleted();
                    fc.setIdeaId(featured.getId());
                    fc.setTitle(featured.getTitle());
                    fc.setVoteCount(featured.getVoteCount());
                    fc.setCreatedByUserId(featured.getCreatedByUserId());
                    fc.setCreatedByDisplayName(resolveDisplayName(featured.getCreatedByUserId(), nameCache));
                    stats.setFeaturedCompleted(fc);
                });

        return stats;
    }

    private Specification<InnovationIdea> buildSearchSpec(
            ReqSearchInnovationIdeaDTO payload,
            UUID currentUserId,
            InnovationIdeaSortModeEnum sortMode,
            boolean applyTrendingWindow
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("voided")));

            if (payload.getKeyword() != null && !payload.getKeyword().isBlank()) {
                String like = "%" + payload.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("description")), like)
                ));
            }
            if (payload.getCategory() != null) {
                predicates.add(cb.equal(root.get("category"), payload.getCategory()));
            }
            if (payload.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), payload.getStatus()));
            }
            if (Boolean.TRUE.equals(payload.getMine())) {
                predicates.add(cb.equal(root.get("createdByUserId"), currentUserId));
            }
            if (applyTrendingWindow && sortMode == InnovationIdeaSortModeEnum.TRENDING) {
                Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), weekAgo));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Pageable toPageable(ReqSearchInnovationIdeaDTO payload, InnovationIdeaSortModeEnum sortMode) {
        int page = payload.getPage() != null ? payload.getPage() : 0;
        int size = payload.getSize() != null ? payload.getSize() : 10;

        Sort sort = switch (sortMode) {
            case NEWEST -> Sort.by(Sort.Direction.DESC, "createdAt");
            case TRENDING, FEATURED -> Sort.by(Sort.Direction.DESC, "voteCount").and(Sort.by(Sort.Direction.DESC, "createdAt"));
        };
        return PageRequest.of(page, size, sort);
    }

    private Set<UUID> loadVotedIdeaIds(UUID userId, List<InnovationIdea> ideas) {
        if (ideas.isEmpty()) {
            return Set.of();
        }
        Set<UUID> voted = new HashSet<>();
        for (InnovationIdea idea : ideas) {
            if (voteRepository.existsByIdeaIdAndUserId(idea.getId(), userId)) {
                voted.add(idea.getId());
            }
        }
        return voted;
    }

    private InnovationIdea requireIdea(UUID id) throws IdInvalidException {
        return ideaRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Ý tưởng không tồn tại!"));
    }

    private UUID requireCurrentUserId() throws IdInvalidException {
        return SercurityUtil.getCurrentUserId()
                .orElseThrow(() -> new IdInvalidException("Không xác định được người dùng hiện tại!"));
    }

    private ResInnovationIdeaDTO toIdeaDto(InnovationIdea idea, boolean viewerHasVoted, Map<UUID, String> nameCache) {
        ResInnovationIdeaDTO dto = new ResInnovationIdeaDTO();
        dto.setId(idea.getId());
        dto.setTitle(idea.getTitle());
        dto.setDescription(idea.getDescription());
        dto.setCategory(idea.getCategory());
        dto.setStatus(idea.getStatus());
        dto.setPriority(idea.getPriority());
        dto.setVoteCount(idea.getVoteCount());
        dto.setCommentCount(idea.getCommentCount());
        dto.setCreatedByUserId(idea.getCreatedByUserId());
        dto.setCreatedByDisplayName(resolveDisplayName(idea.getCreatedByUserId(), nameCache));
        dto.setCreatedAt(idea.getCreatedAt());
        dto.setUpdatedAt(idea.getUpdatedAt());
        dto.setViewerHasVoted(viewerHasVoted);
        dto.setImageUrls(idea.getImageUrls() != null ? new ArrayList<>(idea.getImageUrls()) : new ArrayList<>());
        return dto;
    }

    private List<String> normalizeImageUrls(List<String> raw) throws IdInvalidException {
        if (raw == null || raw.isEmpty()) {
            return new ArrayList<>();
        }
        if (raw.size() > MAX_IMAGE_URLS) {
            throw new IdInvalidException("Tối đa " + MAX_IMAGE_URLS + " ảnh minh họa");
        }
        List<String> normalized = new ArrayList<>();
        for (String item : raw) {
            if (item == null || item.isBlank()) {
                continue;
            }
            String path = toStorageRelativePath(item.trim());
            if (!path.startsWith(INOVATION_STORAGE_PREFIX) || path.length() <= INOVATION_STORAGE_PREFIX.length()) {
                throw new IdInvalidException("Ảnh minh họa phải thuộc thư mục /storage/inovation/");
            }
            if (path.contains("..")) {
                throw new IdInvalidException("Đường dẫn ảnh không hợp lệ");
            }
            normalized.add(path);
        }
        if (normalized.size() > MAX_IMAGE_URLS) {
            throw new IdInvalidException("Tối đa " + MAX_IMAGE_URLS + " ảnh minh họa");
        }
        return normalized;
    }

    private String toStorageRelativePath(String urlOrPath) {
        String value = urlOrPath.trim();
        int idx = value.indexOf("/storage/");
        if (idx >= 0) {
            return value.substring(idx);
        }
        if (value.startsWith("inovation/")) {
            return "/storage/" + value;
        }
        return value;
    }

    private ResInnovationCommentDTO toCommentDto(InnovationIdeaComment comment, Map<UUID, String> nameCache) {
        ResInnovationCommentDTO dto = new ResInnovationCommentDTO();
        dto.setId(comment.getId());
        dto.setIdeaId(comment.getIdeaId());
        dto.setUserId(comment.getUserId());
        dto.setDisplayName(resolveDisplayName(comment.getUserId(), nameCache));
        dto.setBody(comment.getBody());
        dto.setCreatedAt(comment.getCreatedAt());
        return dto;
    }

    private String resolveDisplayName(UUID userId, Map<UUID, String> nameCache) {
        if (userId == null) {
            return "User";
        }
        if (nameCache.containsKey(userId)) {
            return nameCache.get(userId);
        }
        String name = userRepository.findByIdAndVoidedFalse(userId)
                .map(User::getName)
                .filter(n -> n != null && !n.isBlank())
                .orElse("User");
        nameCache.put(userId, name);
        return name;
    }
}
