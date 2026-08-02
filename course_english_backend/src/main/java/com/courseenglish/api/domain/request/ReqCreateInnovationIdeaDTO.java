package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.InnovationIdeaCategoryEnum;
import com.courseenglish.api.util.constant.InnovationIdeaPriorityEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ReqCreateInnovationIdeaDTO {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 200)
    private String title;

    @NotBlank(message = "Mô tả không được để trống")
    @Size(max = 5000)
    private String description;

    @NotNull(message = "Danh mục là bắt buộc")
    private InnovationIdeaCategoryEnum category;

    private InnovationIdeaPriorityEnum priority;

    /** Optional screenshots; max 3 paths under /storage/inovation/ */
    @Size(max = 3, message = "Tối đa 3 ảnh minh họa")
    private List<@Size(max = 500) String> imageUrls = new ArrayList<>();
}
