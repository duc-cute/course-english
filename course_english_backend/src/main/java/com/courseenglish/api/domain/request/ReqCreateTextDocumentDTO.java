package com.courseenglish.api.domain.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqCreateTextDocumentDTO {

  @NotBlank(message = "Nội dung không được để trống")
  @Size(max = 100000, message = "Nội dung quá dài")
  private String text;

  @Size(max = 200, message = "Tiêu đề quá dài")
  private String title;
}
