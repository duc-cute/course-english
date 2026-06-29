package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.SystemConfig;
import com.courseenglish.api.domain.request.ReqCheckSystemConfigKeyDTO;
import com.courseenglish.api.domain.request.ReqSearchSystemConfigDTO;
import com.courseenglish.api.domain.request.ReqSystemConfigDTO;
import com.courseenglish.api.domain.response.ResFeatureFlagsDTO;
import com.courseenglish.api.domain.response.ResSystemConfigDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.SystemConfigRepository;
import com.courseenglish.api.service.SystemConfigService;
import com.courseenglish.api.util.AppConstants;
import com.courseenglish.api.util.CatalogSearchSpecs;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.constant.SystemConfigKeyEnum;
import com.courseenglish.api.util.constant.VocabularyAudioAccentEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SystemConfigServiceImpl implements SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;

    public SystemConfigServiceImpl(SystemConfigRepository systemConfigRepository) {
        this.systemConfigRepository = systemConfigRepository;
    }

    @Override
    @Transactional
    public void initConfig() {
        List<SystemConfig> all = systemConfigRepository.findByVoidedFalseOrderByConfigKeyAsc();
        for (SystemConfigKeyEnum keyEnum : SystemConfigKeyEnum.values()) {
            ensureSeed(all, keyEnum);
        }
        all = systemConfigRepository.findByVoidedFalseOrderByConfigKeyAsc();
        loadIntoConstants(all);
    }

    @Override
    public ResultPaginationDTO search(ReqSearchSystemConfigDTO req) {
        ReqSearchSystemConfigDTO payload = req == null ? new ReqSearchSystemConfigDTO() : req;
        Specification<SystemConfig> spec = CatalogSearchSpecs.systemConfigSearch(payload);
        Pageable pageable = PagingSearchUtil.toPageable(payload);

        Specification<SystemConfig> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<SystemConfig> finalSpec = spec == null ? notVoidedSpec : spec.and(notVoidedSpec);

        Page<SystemConfig> page = systemConfigRepository.findAll(finalSpec, pageable);

        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setTotal(page.getTotalElements());
        meta.setPages(page.getTotalPages());

        ResultPaginationDTO dto = new ResultPaginationDTO();
        dto.setMeta(meta);
        dto.setResult(page.getContent().stream().map(this::toDto).collect(Collectors.toList()));
        return dto;
    }

    @Override
    public ResSystemConfigDTO getById(UUID id) throws IdInvalidException {
        SystemConfig entity = systemConfigRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Cấu hình không tồn tại"));
        return toDto(entity);
    }

    @Override
    @Transactional
    public ResSystemConfigDTO saveOrUpdate(ReqSystemConfigDTO request) throws IdInvalidException {
        if (request.getConfigKey() == null || request.getConfigKey().isBlank()) {
            throw new IdInvalidException("Mã cấu hình không được để trống");
        }

        String configKey = request.getConfigKey().trim().toUpperCase();
        SystemConfig entity;

        if (request.getId() != null) {
            entity = systemConfigRepository.findByIdAndVoidedFalse(request.getId())
                    .orElseThrow(() -> new IdInvalidException("Cấu hình không tồn tại"));
            if (!entity.getConfigKey().equalsIgnoreCase(configKey)) {
                throw new IdInvalidException("Không được đổi mã cấu hình khi cập nhật");
            }
        } else {
            if (systemConfigRepository.existsByConfigKeyAndVoidedFalse(configKey)) {
                throw new IdInvalidException("Mã cấu hình \"" + configKey + "\" đã tồn tại");
            }
            entity = new SystemConfig();
            entity.setConfigKey(configKey);
        }

        entity.setConfigValue(trimOrNull(request.getConfigValue()));
        entity.setNote(trimOrNull(request.getNote()));

        SystemConfigKeyEnum known = SystemConfigKeyEnum.fromKey(configKey);
        if (known != null && entity.getNote() == null) {
            entity.setNote(known.getDefaultNote());
        }

        SystemConfig saved = systemConfigRepository.save(entity);
        initConfig();
        return toDto(saved);
    }

    @Override
    @Transactional
    public void delete(UUID id) throws IdInvalidException {
        SystemConfig entity = systemConfigRepository.findByIdAndVoidedFalse(id)
                .orElseThrow(() -> new IdInvalidException("Cấu hình không tồn tại"));
        entity.setVoided(true);
        systemConfigRepository.save(entity);
        initConfig();
    }

    @Override
    public boolean isConfigKeyTaken(ReqCheckSystemConfigKeyDTO request) {
        if (request == null || request.getConfigKey() == null || request.getConfigKey().isBlank()) {
            return false;
        }
        String configKey = request.getConfigKey().trim().toUpperCase();
        if (request.getId() != null) {
            return systemConfigRepository.existsByConfigKeyAndVoidedFalseAndIdNot(configKey, request.getId());
        }
        return systemConfigRepository.existsByConfigKeyAndVoidedFalse(configKey);
    }

    @Override
    public ResFeatureFlagsDTO getFeatureFlags() {
        ResFeatureFlagsDTO dto = new ResFeatureFlagsDTO();
        dto.setDictionaryEnrichEnabled(AppConstants.dictionaryEnrichEnabled);
        dto.setVocabularyAudioEnabled(AppConstants.vocabularyAudioEnabled);
        dto.setVocabularyAudioAccent(AppConstants.vocabularyAudioAccent.getValue());
        dto.setStudentSelfRegistrationEnabled(AppConstants.studentSelfRegistrationEnabled);
        dto.setWordExportLogoUrl(
                AppConstants.wordExportLogoUrl != null ? AppConstants.wordExportLogoUrl : "");
        dto.setWordExportWatermarkText(
                AppConstants.wordExportWatermarkText != null ? AppConstants.wordExportWatermarkText : "");
        return dto;
    }

    private void ensureSeed(List<SystemConfig> all, SystemConfigKeyEnum keyEnum) {
        boolean exists = all.stream()
                .anyMatch(item -> keyEnum.getKey().equalsIgnoreCase(item.getConfigKey()));
        if (exists) {
            return;
        }
        SystemConfig entity = new SystemConfig();
        entity.setConfigKey(keyEnum.getKey());
        entity.setConfigValue(keyEnum.getDefaultValue());
        entity.setNote(keyEnum.getDefaultNote());
        systemConfigRepository.save(entity);
    }

    private void loadIntoConstants(List<SystemConfig> all) {
        AppConstants.dictionaryEnrichEnabled = readBoolean(
                findValue(all, SystemConfigKeyEnum.DICTIONARY_ENRICH_ENABLED.getKey()),
                true);
        AppConstants.vocabularyAudioEnabled = readBoolean(
                findValue(all, SystemConfigKeyEnum.VOCABULARY_AUDIO_ENABLED.getKey()),
                true);
        AppConstants.vocabularyAudioAccent = VocabularyAudioAccentEnum.fromValue(
                findValue(all, SystemConfigKeyEnum.VOCABULARY_AUDIO_ACCENT.getKey()),
                VocabularyAudioAccentEnum.UK);
        AppConstants.studentSelfRegistrationEnabled = readBoolean(
                findValue(all, SystemConfigKeyEnum.STUDENT_SELF_REGISTRATION_ENABLED.getKey()),
                true);
        AppConstants.notificationEmailEnabled = readBoolean(
                findValue(all, SystemConfigKeyEnum.NOTIFICATION_EMAIL_ENABLED.getKey()),
                false);
        AppConstants.wordExportLogoUrl = trimToEmpty(
                findValue(all, SystemConfigKeyEnum.WORD_EXPORT_LOGO_URL.getKey()));
        AppConstants.wordExportWatermarkText = trimToEmpty(
                findValue(all, SystemConfigKeyEnum.WORD_EXPORT_WATERMARK_TEXT.getKey()));
    }

    private String findValue(List<SystemConfig> all, String key) {
        return all.stream()
                .filter(item -> key.equalsIgnoreCase(item.getConfigKey()))
                .map(SystemConfig::getConfigValue)
                .findFirst()
                .orElse(null);
    }

    private static boolean readBoolean(String value, boolean defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        String normalized = value.trim();
        return "1".equals(normalized) || Boolean.parseBoolean(normalized);
    }

    private static String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private ResSystemConfigDTO toDto(SystemConfig entity) {
        ResSystemConfigDTO dto = new ResSystemConfigDTO();
        dto.setId(entity.getId());
        dto.setConfigKey(entity.getConfigKey());
        dto.setConfigValue(entity.getConfigValue());
        dto.setNote(entity.getNote());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private String trimOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
