package com.courseenglish.api.service.ai.question;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class AiQuestionBatchPlanner {

  public record BatchSpec(QuestionTypeEnum type, int count) {}

  /** Plan batches from explicit per-type quotas. */
  public List<BatchSpec> planFromQuotas(Map<QuestionTypeEnum, Integer> quotas) {
    if (quotas == null || quotas.isEmpty()) {
      return List.of();
    }
    List<BatchSpec> specs = new ArrayList<>();
    for (Map.Entry<QuestionTypeEnum, Integer> entry : quotas.entrySet()) {
      if (entry.getKey() == null || entry.getValue() == null || entry.getValue() < 1) {
        continue;
      }
      specs.add(new BatchSpec(entry.getKey(), entry.getValue()));
    }
    return specs;
  }

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
