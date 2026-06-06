package com.courseenglish.api.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.LessonBlock;
import com.courseenglish.api.domain.request.ReqLessonBlockDTO;
import com.courseenglish.api.domain.request.ReqReorderLessonBlocksDTO;
import com.courseenglish.api.domain.response.ResLessonBlockDTO;
import com.courseenglish.api.repository.LessonBlockRepository;
import com.courseenglish.api.repository.LessonRepository;
import com.courseenglish.api.service.LessonBlockService;
import com.courseenglish.api.util.error.IdInvalidException;

@Service
public class LessonBlockServiceImpl implements LessonBlockService {

    private final LessonBlockRepository lessonBlockRepository;
    private final LessonRepository lessonRepository;

    public LessonBlockServiceImpl(LessonBlockRepository lessonBlockRepository, LessonRepository lessonRepository) {
        this.lessonBlockRepository = lessonBlockRepository;
        this.lessonRepository = lessonRepository;
    }

    @Override
    public List<ResLessonBlockDTO> listByLessonId(UUID lessonId) {
        return lessonBlockRepository.findByLesson_IdAndVoidedFalseOrderByDisplayOrderAsc(lessonId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public ResLessonBlockDTO create(UUID lessonId, ReqLessonBlockDTO request) throws IdInvalidException {
        Lesson lesson = requireLesson(lessonId);
        if (request.getBlockType() == null) {
            throw new IdInvalidException("blockType là bắt buộc!");
        }

        LessonBlock entity = new LessonBlock();
        entity.setLesson(lesson);
        entity.setBlockType(request.getBlockType());
        entity.setPayloadJson(request.getPayloadJson());
        entity.setDisplayOrder(resolveDisplayOrder(lessonId, request.getDisplayOrder()));
        return toDto(lessonBlockRepository.save(entity));
    }

    @Override
    public ResLessonBlockDTO update(UUID blockId, ReqLessonBlockDTO request) throws IdInvalidException {
        LessonBlock entity = lessonBlockRepository.findByIdAndVoidedFalse(blockId)
                .orElseThrow(() -> new IdInvalidException("Lesson block không tồn tại!"));
        if (request.getBlockType() != null) {
            entity.setBlockType(request.getBlockType());
        }
        if (request.getPayloadJson() != null) {
            entity.setPayloadJson(request.getPayloadJson());
        }
        entity.setDisplayOrder(request.getDisplayOrder());
        return toDto(lessonBlockRepository.save(entity));
    }

    @Override
    public void delete(UUID blockId) {
        lessonBlockRepository.findByIdAndVoidedFalse(blockId).ifPresent(item -> {
            item.setVoided(true);
            lessonBlockRepository.save(item);
        });
    }

    @Override
    @Transactional
    public List<ResLessonBlockDTO> reorder(UUID lessonId, ReqReorderLessonBlocksDTO request) throws IdInvalidException {
        requireLesson(lessonId);
        if (request == null || request.getBlockIds() == null || request.getBlockIds().isEmpty()) {
            throw new IdInvalidException("blockIds là bắt buộc!");
        }

        List<LessonBlock> blocks = lessonBlockRepository.findByLesson_IdAndVoidedFalseOrderByDisplayOrderAsc(lessonId);
        Map<UUID, LessonBlock> byId = new HashMap<>();
        for (LessonBlock block : blocks) {
            byId.put(block.getId(), block);
        }

        List<LessonBlock> reordered = new ArrayList<>();
        for (UUID blockId : request.getBlockIds()) {
            LessonBlock block = byId.remove(blockId);
            if (block == null) {
                throw new IdInvalidException("Lesson block không thuộc bài học này!");
            }
            reordered.add(block);
        }
        if (!byId.isEmpty()) {
            throw new IdInvalidException("blockIds phải chứa đủ tất cả block của bài học!");
        }

        int order = 1;
        for (LessonBlock block : reordered) {
            block.setDisplayOrder(order++);
            lessonBlockRepository.save(block);
        }
        return reordered.stream().map(this::toDto).collect(Collectors.toList());
    }

    private Lesson requireLesson(UUID lessonId) throws IdInvalidException {
        return lessonRepository.findByIdAndVoidedFalse(lessonId)
                .orElseThrow(() -> new IdInvalidException("Lesson không tồn tại!"));
    }

    private int resolveDisplayOrder(UUID lessonId, int requestedOrder) {
        if (requestedOrder > 0) {
            return requestedOrder;
        }
        return (int) lessonBlockRepository.countByLesson_IdAndVoidedFalse(lessonId) + 1;
    }

    private ResLessonBlockDTO toDto(LessonBlock block) {
        ResLessonBlockDTO dto = new ResLessonBlockDTO();
        dto.setId(block.getId());
        dto.setLessonId(block.getLesson() != null ? block.getLesson().getId() : null);
        dto.setBlockType(block.getBlockType());
        dto.setDisplayOrder(block.getDisplayOrder());
        dto.setPayloadJson(block.getPayloadJson());
        return dto;
    }
}
