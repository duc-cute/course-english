package com.courseenglish.api.service.notification;

import com.courseenglish.api.domain.Notification;
import com.courseenglish.api.domain.response.ResNotificationDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;

@Component
public class NotificationMapper {

    private final ObjectMapper objectMapper;

    public NotificationMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ResNotificationDTO toDto(Notification row) {
        ResNotificationDTO dto = new ResNotificationDTO();
        dto.setId(row.getId());
        dto.setType(row.getType());
        dto.setTitle(row.getTitle());
        dto.setBody(row.getBody());
        dto.setLinkPath(row.getLinkPath());
        dto.setRead(row.getReadAt() != null);
        dto.setReadAt(row.getReadAt());
        dto.setCreatedAt(row.getCreatedAt());
        dto.setPayload(parsePayload(row.getPayloadJson()));
        return dto;
    }

    private Map<String, Object> parsePayload(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            return Collections.emptyMap();
        }
    }
}
