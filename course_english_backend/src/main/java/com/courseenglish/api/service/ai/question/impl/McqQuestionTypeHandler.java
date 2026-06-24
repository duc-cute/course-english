package com.courseenglish.api.service.ai.question.impl;

import com.courseenglish.api.service.ai.question.AiQuestionTypeHandler;
import com.courseenglish.api.service.ai.question.dto.AiDraftChoiceDTO;
import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class McqQuestionTypeHandler implements AiQuestionTypeHandler {

  private static final String[] KEYS = {"a", "b", "c", "d", "e", "f"};

  @Override
  public QuestionTypeEnum supportedType() {
    return QuestionTypeEnum.MULTIPLE_CHOICE;
  }

  @Override
  public String promptSchemaFragment() {
    return """
        MULTIPLE_CHOICE:
        - choices: array of 4 items with choiceKey (a/b/c/d), choiceText, correct (boolean), displayOrder (0-3)
        - Exactly one choice has correct: true
        - Do NOT use contentJson for MCQ
        """;
  }

  @Override
  public String promptExampleJson() {
    return """
        {
          "tempId": "q1",
          "selected": true,
          "questionType": "MULTIPLE_CHOICE",
          "promptText": "She ___ to school every day.",
          "promptLang": "en",
          "explanation": "Present simple, third person.",
          "difficulty": 2,
          "choices": [
            { "choiceKey": "a", "choiceText": "go", "correct": false, "displayOrder": 0 },
            { "choiceKey": "b", "choiceText": "goes", "correct": true, "displayOrder": 1 },
            { "choiceKey": "c", "choiceText": "going", "correct": false, "displayOrder": 2 },
            { "choiceKey": "d", "choiceText": "went", "correct": false, "displayOrder": 3 }
          ]
        }""";
  }

  @Override
  public void normalize(AiDraftQuestionDTO draft) {
    if (draft.getChoices() == null) {
      draft.setChoices(new ArrayList<>());
    }
    for (int i = 0; i < draft.getChoices().size(); i++) {
      AiDraftChoiceDTO choice = draft.getChoices().get(i);
      if (choice.getChoiceKey() == null || choice.getChoiceKey().isBlank()) {
        choice.setChoiceKey(i < KEYS.length ? KEYS[i] : "x" + (i + 1));
      } else {
        choice.setChoiceKey(choice.getChoiceKey().trim().toLowerCase());
      }
      if (choice.getDisplayOrder() == null) {
        choice.setDisplayOrder(i);
      }
    }
    draft.setContentJson(null);
  }

  @Override
  public List<String> validate(AiDraftQuestionDTO draft) {
    List<String> errors = new ArrayList<>();
    if (draft.getPromptText() == null || draft.getPromptText().isBlank()) {
      errors.add("Thiếu nội dung câu hỏi");
      return errors;
    }
    List<AiDraftChoiceDTO> choices = draft.getChoices();
    if (choices == null || choices.size() < 2) {
      errors.add("MCQ cần ít nhất 2 đáp án");
      return errors;
    }
    Set<String> keys = new HashSet<>();
    int correctCount = 0;
    for (int i = 0; i < choices.size(); i++) {
      AiDraftChoiceDTO c = choices.get(i);
      if (c.getChoiceKey() == null || c.getChoiceKey().isBlank()) {
        errors.add("Đáp án " + (i + 1) + ": thiếu mã");
        continue;
      }
      if (c.getChoiceText() == null || c.getChoiceText().isBlank()) {
        errors.add("Đáp án " + c.getChoiceKey() + ": thiếu nội dung");
      }
      if (!keys.add(c.getChoiceKey())) {
        errors.add("Mã đáp án \"" + c.getChoiceKey() + "\" bị trùng");
      }
      if (Boolean.TRUE.equals(c.getCorrect())) {
        correctCount++;
      }
    }
    if (correctCount != 1) {
      errors.add("MCQ cần đúng 1 đáp án đúng");
    }
    return errors;
  }
}
