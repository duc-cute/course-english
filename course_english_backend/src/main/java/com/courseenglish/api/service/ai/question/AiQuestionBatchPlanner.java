package com.courseenglish.api.service.ai.question;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class AiQuestionBatchPlanner {

  public record BatchSpec(QuestionTypeEnum type, int count) {}

  /**
   * Split {@code totalCount} evenly across {@code types} (remainder goes to first types).
   */
  public List<BatchSpec> plan(int totalCount, List<QuestionTypeEnum> types) {
    if (types == null || types.isEmpty() || totalCount < 1) {
      return List.of();
    }
    int typeCount = types.size();
    int base = totalCount / typeCount;
    int remainder = totalCount % typeCount;
    List<BatchSpec> specs = new ArrayList<>();
    for (int i = 0; i < typeCount; i++) {
      int count = base + (i < remainder ? 1 : 0);
      if (count > 0) {
        specs.add(new BatchSpec(types.get(i), count));
      }
    }
    return specs;
  }
}
