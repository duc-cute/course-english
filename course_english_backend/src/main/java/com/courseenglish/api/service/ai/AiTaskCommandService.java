package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.AiDocument;
import com.courseenglish.api.domain.AiTask;
import com.courseenglish.api.domain.request.ReqCreateQuestionGenTaskDTO;
import com.courseenglish.api.domain.request.ReqUpdateAiTaskDraftDTO;
import com.courseenglish.api.domain.response.ResAiTaskDTO;
import com.courseenglish.api.domain.response.ResCreateAiTaskDTO;
import com.courseenglish.api.repository.AiTaskRepository;
import com.courseenglish.api.service.ActivityLogService;
import com.courseenglish.api.service.activitylog.ActivityLogWriteContext;
import com.courseenglish.api.util.constant.ActivityLogActionEnum;
import com.courseenglish.api.util.constant.ActivityLogModuleEnum;
import com.courseenglish.api.util.constant.ActivityLogSeverityEnum;
import com.courseenglish.api.service.ai.question.AiQuestionGenResultValidator;
import com.courseenglish.api.service.ai.question.AiQuestionTypeHandlerRegistry;
import com.courseenglish.api.service.ai.question.dto.AiDraftQuestionDTO;
import com.courseenglish.api.service.ai.question.dto.AiQuestionGenEnvelopeDTO;
import com.courseenglish.api.util.constant.AiTaskStatusEnum;
import com.courseenglish.api.util.constant.AiTaskTypeEnum;
import com.courseenglish.api.util.constant.QuestionTypeEnum;
import com.courseenglish.api.util.error.IdInvalidException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiTaskCommandService {

  private final AiTaskRepository aiTaskRepository;
  private final AiDocumentService aiDocumentService;
  private final AiAccessSupport aiAccessSupport;
  private final AiQuestionTypeHandlerRegistry handlerRegistry;
  private final AiQuestionGenResultValidator resultValidator;
  private final AiTaskWorker aiTaskWorker;
  private final ActivityLogService activityLogService;
  private final ObjectMapper objectMapper;

  @Value("${app.ai.max-questions-per-task:50}")
  private int maxQuestionsPerTask;

  @Value("${app.ai.daily-gen-task-limit:5}")
  private int dailyGenTaskLimit;

  @Value("${app.ai.supported-gen-types:MULTIPLE_CHOICE,TRUE_FALSE,FILL_BLANK,READING_COMPREHENSION}")
  private String supportedGenTypesCsv;

  public AiTaskCommandService(
      AiTaskRepository aiTaskRepository,
      AiDocumentService aiDocumentService,
      AiAccessSupport aiAccessSupport,
      AiQuestionTypeHandlerRegistry handlerRegistry,
      AiQuestionGenResultValidator resultValidator,
      AiTaskWorker aiTaskWorker,
      ActivityLogService activityLogService,
      ObjectMapper objectMapper) {
    this.aiTaskRepository = aiTaskRepository;
    this.aiDocumentService = aiDocumentService;
    this.aiAccessSupport = aiAccessSupport;
    this.handlerRegistry = handlerRegistry;
    this.resultValidator = resultValidator;
    this.aiTaskWorker = aiTaskWorker;
    this.activityLogService = activityLogService;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public ResCreateAiTaskDTO createQuestionGenerationTask(ReqCreateQuestionGenTaskDTO request)
      throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();

    enforceDailyGenQuota(userId);

    int count = request.getQuestionCount();
    if (count < 1 || count > maxQuestionsPerTask) {
      throw new IdInvalidException("Số câu hỏi từ 1 đến " + maxQuestionsPerTask);
    }

    List<QuestionTypeEnum> types = request.getQuestionTypes();
    if (types == null || types.isEmpty()) {
      throw new IdInvalidException("Chọn ít nhất một loại câu hỏi");
    }

    List<String> allowed = aiAccessSupport.parseSupportedGenTypes(supportedGenTypesCsv);
    for (QuestionTypeEnum type : types) {
      if (!allowed.contains(type.name())) {
        throw new IdInvalidException("Loại câu hỏi không được phép: " + type);
      }
      if (!handlerRegistry.supports(type)) {
        throw new IdInvalidException("Loại câu hỏi chưa có handler: " + type);
      }
    }

    AiDocument document = aiDocumentService.requireReadyDocument(request.getDocumentId(), userId);

    AiTask task = new AiTask();
    task.setUserId(userId);
    task.setDocumentId(document.getId());
    task.setConversationId(request.getConversationId());
    task.setTaskType(AiTaskTypeEnum.QUESTION_GENERATION);
    task.setStatus(AiTaskStatusEnum.PENDING);
    task.setInputJson(serializeInput(request));
    aiTaskRepository.save(task);

    activityLogService.log(
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.INFO,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_GEN_TASK_CREATED,
                "Đã tạo tác vụ sinh câu hỏi AI")
            .userId(userId)
            .ref("AI_TASK", task.getId())
            .put("taskId", task.getId())
            .put("documentId", document.getId())
            .put("questionCount", count)
            .put("questionTypes", types));

    aiTaskWorker.processAsync(task.getId());

    ResCreateAiTaskDTO dto = new ResCreateAiTaskDTO();
    dto.setTaskId(task.getId());
    dto.setStatus(task.getStatus());
    return dto;
  }

  public ResAiTaskDTO getTask(UUID taskId) throws IdInvalidException {
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();
    AiTask task = aiTaskRepository.findByIdAndUserIdAndVoidedFalse(taskId, userId)
        .orElseThrow(() -> new IdInvalidException("Tác vụ không tồn tại"));
    return toDto(task);
  }

  public void reportClientPollTimeout(UUID taskId) throws IdInvalidException {
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();
    AiTask task = aiTaskRepository.findByIdAndUserIdAndVoidedFalse(taskId, userId)
        .orElseThrow(() -> new IdInvalidException("Tác vụ không tồn tại"));

    activityLogService.log(
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.WARN,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_GEN_POLL_TIMEOUT,
                "Frontend poll timeout — UI hiển thị xử lý quá lâu")
            .userId(userId)
            .ref("AI_TASK", task.getId())
            .put("taskId", task.getId())
            .put("taskStatus", task.getStatus() != null ? task.getStatus().name() : null)
            .put("documentId", task.getDocumentId())
            .put("pollTimeoutMs", 180_000));
  }

  @Transactional
  public ResAiTaskDTO updateTaskDraft(UUID taskId, ReqUpdateAiTaskDraftDTO request)
      throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();

    AiTask task = aiTaskRepository.findByIdAndUserIdAndVoidedFalse(taskId, userId)
        .orElseThrow(() -> new IdInvalidException("Tác vụ không tồn tại"));

    if (task.getStatus() != AiTaskStatusEnum.DONE) {
      throw new IdInvalidException("Chỉ sửa được bản nháp khi tác vụ đã hoàn thành");
    }

    List<AiDraftQuestionDTO> questions = request.getQuestions();
    if (questions.size() > maxQuestionsPerTask) {
      throw new IdInvalidException("Tối đa " + maxQuestionsPerTask + " câu hỏi mỗi tác vụ");
    }

    AiQuestionGenEnvelopeDTO envelope = readEnvelope(task);
    envelope.setQuestions(questions);
    resultValidator.normalizeAndValidate(envelope);

    try {
      task.setOutputJson(objectMapper.writeValueAsString(envelope));
    } catch (JsonProcessingException e) {
      throw new IdInvalidException("Không lưu được bản nháp");
    }
    aiTaskRepository.save(task);
    return toDto(task);
  }

  private AiQuestionGenEnvelopeDTO readEnvelope(AiTask task) throws IdInvalidException {
    if (task.getOutputJson() == null || task.getOutputJson().isBlank()) {
      return new AiQuestionGenEnvelopeDTO();
    }
    try {
      return objectMapper.readValue(task.getOutputJson(), AiQuestionGenEnvelopeDTO.class);
    } catch (JsonProcessingException e) {
      throw new IdInvalidException("output_json hiện tại không hợp lệ");
    }
  }

  private void enforceDailyGenQuota(UUID userId) throws IdInvalidException {
    ZoneId zone = ZoneId.systemDefault();
    Instant start = LocalDate.now(zone).atStartOfDay(zone).toInstant();
    Instant end = start.plusSeconds(24 * 60 * 60);
    long used = aiTaskRepository.countByUserIdAndVoidedFalseAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
        userId, start, end);
    if (used >= dailyGenTaskLimit) {
      activityLogService.log(
          ActivityLogWriteContext.of(
                  ActivityLogSeverityEnum.WARN,
                  ActivityLogModuleEnum.AI,
                  ActivityLogActionEnum.AI_GEN_QUOTA,
                  "Đã hết lượt sinh câu hỏi AI hôm nay")
              .userId(userId)
              .put("usedToday", used)
              .put("dailyLimit", dailyGenTaskLimit));
      throw new IdInvalidException("Đã hết lượt sinh câu hỏi AI hôm nay");
    }
  }

  private String serializeInput(ReqCreateQuestionGenTaskDTO request) throws IdInvalidException {
    try {
      Map<String, Object> map = new HashMap<>();
      map.put("documentId", request.getDocumentId());
      map.put("categoryId", request.getCategoryId());
      map.put("questionCount", request.getQuestionCount());
      map.put("questionTypes", request.getQuestionTypes());
      map.put("difficulty", request.getDifficulty());
      map.put("promptLang", request.getPromptLang());
      return objectMapper.writeValueAsString(map);
    } catch (JsonProcessingException e) {
      throw new IdInvalidException("Không lưu được cấu hình tác vụ");
    }
  }

  private ResAiTaskDTO toDto(AiTask task) throws IdInvalidException {
    ResAiTaskDTO dto = new ResAiTaskDTO();
    dto.setId(task.getId());
    dto.setStatus(task.getStatus());
    dto.setTaskType(task.getTaskType() != null ? task.getTaskType().name() : null);
    dto.setErrorMessage(task.getErrorMessage());
    dto.setModel(task.getModel());
    if (task.getOutputJson() != null && !task.getOutputJson().isBlank()) {
      try {
        JsonNode node = objectMapper.readTree(task.getOutputJson());
        dto.setOutputJson(node);
      } catch (JsonProcessingException e) {
        throw new IdInvalidException("output_json không hợp lệ");
      }
    }
    return dto;
  }
}
