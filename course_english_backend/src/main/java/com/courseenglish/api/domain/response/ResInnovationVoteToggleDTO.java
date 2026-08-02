package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResInnovationVoteToggleDTO {
    private boolean voted;
    private int voteCount;
}
