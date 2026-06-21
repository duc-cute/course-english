package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ResStudentSupportListDTO {
    private ResStudentSupportSummaryDTO summary = new ResStudentSupportSummaryDTO();
    private List<ResStudentSupportItemDTO> items = new ArrayList<>();
    private ResultPaginationDTO.Meta meta;
}
