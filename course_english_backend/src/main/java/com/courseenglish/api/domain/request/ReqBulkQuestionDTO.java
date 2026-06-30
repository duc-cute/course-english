package com.courseenglish.api.domain.request;

import com.courseenglish.api.util.constant.BulkQuestionOperationEnum;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ReqBulkQuestionDTO {

  @NotEmpty(message = "Danh sách id không được rỗng")
  @Size(max = 100, message = "Tối đa 100 câu mỗi lần")
  private List<UUID> ids;

  @NotNull(message = "Thiếu operation")
  private BulkQuestionOperationEnum operation;
}
