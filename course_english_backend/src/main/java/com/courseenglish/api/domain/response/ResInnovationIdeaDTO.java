package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.InnovationIdeaCategoryEnum;
import com.courseenglish.api.util.constant.InnovationIdeaPriorityEnum;
import com.courseenglish.api.util.constant.InnovationIdeaStatusEnum;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResInnovationIdeaDTO {
    private UUID id;
    private String title;
    private String description;
    private InnovationIdeaCategoryEnum category;
    private InnovationIdeaStatusEnum status;
    private InnovationIdeaPriorityEnum priority;
    private int voteCount;
    private int commentCount;
    private UUID createdByUserId;
    private String createdByDisplayName;
    private Instant createdAt;
    private Instant updatedAt;
    private Boolean viewerHasVoted;
    private List<String> imageUrls = new ArrayList<>();
}
