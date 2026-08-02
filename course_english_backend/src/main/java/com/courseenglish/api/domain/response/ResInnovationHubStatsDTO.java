package com.courseenglish.api.domain.response;

import com.courseenglish.api.util.constant.InnovationIdeaCategoryEnum;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ResInnovationHubStatsDTO {
    private long analyzedCount;
    private int mineCompletedCount;
    private List<CategoryShare> categoryShares = new ArrayList<>();
    private List<TopContributor> topContributors = new ArrayList<>();
    private FeaturedCompleted featuredCompleted;

    @Getter
    @Setter
    public static class CategoryShare {
        private InnovationIdeaCategoryEnum category;
        private long count;
        private int percent;
    }

    @Getter
    @Setter
    public static class TopContributor {
        private UUID userId;
        private String displayName;
        private int points;
    }

    @Getter
    @Setter
    public static class FeaturedCompleted {
        private UUID ideaId;
        private String title;
        private int voteCount;
        private UUID createdByUserId;
        private String createdByDisplayName;
    }
}
