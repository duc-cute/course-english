package com.courseenglish.api.service.ai.question;

import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class AiQuestionTypeHandlerRegistry {

  private final Map<QuestionTypeEnum, AiQuestionTypeHandler> handlers;

  public AiQuestionTypeHandlerRegistry(List<AiQuestionTypeHandler> handlerList) {
    Map<QuestionTypeEnum, AiQuestionTypeHandler> map = new EnumMap<>(QuestionTypeEnum.class);
    for (AiQuestionTypeHandler handler : handlerList) {
      map.put(handler.supportedType(), handler);
    }
    this.handlers = Map.copyOf(map);
  }

  public AiQuestionTypeHandler require(QuestionTypeEnum type) throws IdInvalidException {
    AiQuestionTypeHandler handler = handlers.get(type);
    if (handler == null) {
      throw new IdInvalidException("Loại câu hỏi chưa được hỗ trợ: " + type);
    }
    return handler;
  }

  public boolean supports(QuestionTypeEnum type) {
    return handlers.containsKey(type);
  }

  public List<AiQuestionTypeHandler> all() {
    return List.copyOf(handlers.values());
  }
}
