package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqCreateInnovationCommentDTO {

    @NotBlank(message = "Nội dung bình luận không được để trống")
    @Size(max = 2000)
    private String body;
}
