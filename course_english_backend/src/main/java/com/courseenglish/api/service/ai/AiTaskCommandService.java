package com.courseenglish.api.service.ai;

import com.courseenglish.api.domain.AiDocument;
import com.courseenglish.api.domain.AiTask;
import com.courseenglish.api.domain.request.ExamSectionGenSpecDTO;
import com.courseenglish.api.domain.request.ReqCreateExamPaperGenTaskDTO;
import com.courseenglish.api.domain.request.ReqCreateQuestionGenTaskDTO;
import com.courseenglish.api.domain.request.ReqUpdateAiTaskDraftDTO;
import com.courseenglish.api.domain.response.ResAiTaskHistoryItemDTO;
import com.courseenglish.api.domain.response.ResAiTaskDTO;
import com.courseenglish.api.domain.response.ResCreateAiTaskDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

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

  @Value("${app.ai.client-poll-timeout-ms:300000}")
  private long clientPollTimeoutMs;

  @Value("${app.ai.supported-gen-types:MULTIPLE_CHOICE,TRUE_FALSE,FILL_BLANK,GAP_FILL_MCQ,READING_COMPREHENSION}")
  private String supportedGenTypesCsv;

  @Value("${app.ai.task-redispatch-sec:20}")
  private int taskRedispatchSec;

  /** At most one redispatch per task — avoids flooding aiTaskExecutor on every poll. */
  private final Set<UUID> redispatchAttempted = ConcurrentHashMap.newKeySet();

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

    boolean topicMode = request.getTopic() != null && !request.getTopic().isBlank();
    ResolvedGenConfig config = resolveGenConfig(request, topicMode);

    AiDocument document;
    if (topicMode) {
      document =
          aiDocumentService.createTopicBriefDocument(
              userId,
              request.getTopic().trim(),
              request.getGrade(),
              request.getLanguageLevel(),
              request.getAdditionalInstructions());
    } else {
      if (request.getDocumentId() == null) {
        throw new IdInvalidException("Thiếu documentId hoặc topic");
      }
      document = aiDocumentService.requireReadyDocument(request.getDocumentId(), userId);
    }

    int count = config.questionCount();
    if (count < 1 || count > maxQuestionsPerTask) {
      throw new IdInvalidException("Số câu hỏi từ 1 đến " + maxQuestionsPerTask);
    }

    List<QuestionTypeEnum> types = config.questionTypes();
    if (types.isEmpty()) {
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

    request.setQuestionCount(count);
    request.setQuestionTypes(types);
    if (topicMode) {
      request.setDocumentId(document.getId());
    }

    AiTask task = new AiTask();
    task.setUserId(userId);
    task.setDocumentId(document.getId());
    task.setConversationId(request.getConversationId());
    task.setTaskType(AiTaskTypeEnum.QUESTION_GENERATION);
    task.setStatus(AiTaskStatusEnum.PENDING);
    task.setInputJson(serializeInput(request, topicMode));
    aiTaskRepository.save(task);

    activityLogService.log(
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.INFO,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_GEN_TASK_CREATED,
                topicMode ? "Đã tạo tác vụ sinh bài tập AI (topic)" : "Đã tạo tác vụ sinh câu hỏi AI")
            .userId(userId)
            .ref("AI_TASK", task.getId())
            .put("taskId", task.getId())
            .put("documentId", document.getId())
            .put("topicMode", topicMode)
            .put("questionCount", count)
            .put("questionTypes", types)
            .put("typeQuotas", config.typeQuotas()));

    scheduleProcessAfterCommit(task.getId());

    ResCreateAiTaskDTO dto = new ResCreateAiTaskDTO();
    dto.setTaskId(task.getId());
    dto.setStatus(task.getStatus());
    return dto;
  }

  @Transactional
  public ResCreateAiTaskDTO createExamPaperGenerationTask(ReqCreateExamPaperGenTaskDTO request)
      throws IdInvalidException {
    aiAccessSupport.requireAiEnabled();
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();

    enforceDailyGenQuota(userId);

    if (request.getDocumentId() == null) {
      throw new IdInvalidException("Thiếu documentId");
    }
    AiDocument document = aiDocumentService.requireReadyDocument(request.getDocumentId(), userId);

    List<ExamSectionGenSpecDTO> specs = request.getSectionSpecs();
    if (specs == null || specs.isEmpty()) {
      throw new IdInvalidException("Cần ít nhất một section");
    }

    List<String> allowed = aiAccessSupport.parseSupportedGenTypes(supportedGenTypesCsv);
    int totalQuestions = 0;
    for (ExamSectionGenSpecDTO spec : specs) {
      if (spec.getQuestionType() == null) {
        throw new IdInvalidException("Mỗi section cần questionType");
      }
      if (!allowed.contains(spec.getQuestionType().name())) {
        throw new IdInvalidException("Loại câu hỏi không được phép: " + spec.getQuestionType());
      }
      if (!handlerRegistry.supports(spec.getQuestionType())) {
        throw new IdInvalidException("Loại câu hỏi chưa có handler: " + spec.getQuestionType());
      }
      if (spec.getQuestionCount() < 1 || spec.getQuestionCount() > maxQuestionsPerTask) {
        throw new IdInvalidException("Số câu mỗi section từ 1 đến " + maxQuestionsPerTask);
      }
      totalQuestions += spec.getQuestionCount();
    }
    if (totalQuestions < 1 || totalQuestions > maxQuestionsPerTask) {
      throw new IdInvalidException("Tổng số câu từ 1 đến " + maxQuestionsPerTask);
    }

    AiTask task = new AiTask();
    task.setUserId(userId);
    task.setDocumentId(document.getId());
    task.setConversationId(request.getConversationId());
    task.setTaskType(AiTaskTypeEnum.EXAM_PAPER_GENERATION);
    task.setStatus(AiTaskStatusEnum.PENDING);
    task.setInputJson(serializeExamPaperInput(request));
    aiTaskRepository.save(task);

    activityLogService.log(
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.INFO,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_GEN_TASK_CREATED,
                "Đã tạo tác vụ sinh đề thi AI")
            .userId(userId)
            .ref("AI_TASK", task.getId())
            .put("taskId", task.getId())
            .put("documentId", document.getId())
            .put("sectionCount", specs.size())
            .put("totalQuestions", totalQuestions));

    scheduleProcessAfterCommit(task.getId());

    ResCreateAiTaskDTO dto = new ResCreateAiTaskDTO();
    dto.setTaskId(task.getId());
    dto.setStatus(task.getStatus());
    return dto;
  }

  private String serializeExamPaperInput(ReqCreateExamPaperGenTaskDTO request) throws IdInvalidException {
    try {
      return objectMapper.writeValueAsString(request);
    } catch (JsonProcessingException e) {
      throw new IdInvalidException("Không lưu được cấu hình tác vụ");
    }
  }

  private record ResolvedGenConfig(
      int questionCount, List<QuestionTypeEnum> questionTypes, Map<QuestionTypeEnum, Integer> typeQuotas) {}

  private ResolvedGenConfig resolveGenConfig(ReqCreateQuestionGenTaskDTO request, boolean topicMode)
      throws IdInvalidException {
    Map<QuestionTypeEnum, Integer> quotas = normalizeTypeQuotas(request.getTypeQuotas());

    if (!quotas.isEmpty()) {
      int sum = quotas.values().stream().mapToInt(Integer::intValue).sum();
      if (sum < 1 || sum > maxQuestionsPerTask) {
        throw new IdInvalidException("Tổng số câu từ quota phải từ 1 đến " + maxQuestionsPerTask);
      }
      return new ResolvedGenConfig(sum, new ArrayList<>(quotas.keySet()), quotas);
    }

    if (topicMode) {
      throw new IdInvalidException("Chế độ topic cần typeQuotas (vd. MCQ: 10, Reading: 3)");
    }

    int count = request.getQuestionCount();
    List<QuestionTypeEnum> types = request.getQuestionTypes();
    if (types == null || types.isEmpty()) {
      throw new IdInvalidException("Chọn ít nhất một loại câu hỏi");
    }
    return new ResolvedGenConfig(count, types, Map.of());
  }

  private Map<QuestionTypeEnum, Integer> normalizeTypeQuotas(Map<QuestionTypeEnum, Integer> raw) {
    if (raw == null || raw.isEmpty()) {
      return Map.of();
    }
    Map<QuestionTypeEnum, Integer> out = new LinkedHashMap<>();
    for (Map.Entry<QuestionTypeEnum, Integer> entry : raw.entrySet()) {
      if (entry.getKey() == null || entry.getValue() == null || entry.getValue() < 1) {
        continue;
      }
      out.put(entry.getKey(), entry.getValue());
    }
    return out;
  }

  public ResAiTaskDTO getTask(UUID taskId) throws IdInvalidException {
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();
    AiTask task = aiTaskRepository.findByIdAndUserIdAndVoidedFalse(taskId, userId)
        .orElseThrow(() -> new IdInvalidException("Tác vụ không tồn tại"));
    maybeRedispatchStalePendingTask(task.getId());
    task = aiTaskRepository.findByIdAndUserIdAndVoidedFalse(taskId, userId)
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
            .put("pollTimeoutMs", clientPollTimeoutMs));
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

  private void scheduleProcessAfterCommit(UUID taskId) {
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override
        public void afterCommit() {
          aiTaskWorker.dispatchSafely(taskId);
        }
      });
    } else {
      aiTaskWorker.dispatchSafely(taskId);
    }
  }

  /**
   * Safety net when the initial worker dispatch was lost. Only re-dispatch truly stale PENDING tasks
   * (no startedAt). Reloads from DB so we never act on a stale entity while another worker runs.
   */
  private void maybeRedispatchStalePendingTask(UUID taskId) {
    AiTask task = aiTaskRepository.findById(taskId).orElse(null);
    if (task == null || task.isVoided()) {
      return;
    }
    if (task.getStatus() != AiTaskStatusEnum.PENDING) {
      return;
    }
    if (task.getStartedAt() != null) {
      return;
    }
    if (task.getCreatedAt() == null) {
      return;
    }
    long pendingSec = Duration.between(task.getCreatedAt(), Instant.now()).getSeconds();
    if (pendingSec < taskRedispatchSec) {
      return;
    }
    if (!redispatchAttempted.add(taskId)) {
      return;
    }
    activityLogService.log(
        ActivityLogWriteContext.of(
                ActivityLogSeverityEnum.WARN,
                ActivityLogModuleEnum.AI,
                ActivityLogActionEnum.AI_GEN_SKIP,
                "Tác vụ PENDING " + pendingSec + "s — kích hoạt lại worker")
            .userId(task.getUserId())
            .ref("AI_TASK", task.getId())
            .put("taskId", task.getId())
            .put("documentId", task.getDocumentId())
            .put("step", "redispatch")
            .put("pendingSec", pendingSec));
    aiTaskWorker.dispatchSafely(taskId);
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

  private String serializeInput(ReqCreateQuestionGenTaskDTO request, boolean topicMode)
      throws IdInvalidException {
    try {
      Map<String, Object> map = new HashMap<>();
      map.put("documentId", request.getDocumentId());
      map.put("categoryId", request.getCategoryId());
      map.put("questionCount", request.getQuestionCount());
      map.put("questionTypes", request.getQuestionTypes());
      map.put("typeQuotas", request.getTypeQuotas());
      map.put("topic", request.getTopic());
      map.put("grade", request.getGrade());
      map.put("languageLevel", request.getLanguageLevel());
      map.put("additionalInstructions", request.getAdditionalInstructions());
      map.put("readingSubQuestionCount", request.getReadingSubQuestionCount());
      map.put("difficulty", request.getDifficulty());
      map.put("promptLang", request.getPromptLang());
      map.put("topicMode", topicMode);
      map.put("customUserPromptByType", request.getCustomUserPromptByType());
      return objectMapper.writeValueAsString(map);
    } catch (JsonProcessingException e) {
      throw new IdInvalidException("Không lưu được cấu hình tác vụ");
    }
  }

  public ResultPaginationDTO listQuestionGenHistory(int page, int pageSize) throws IdInvalidException {
    aiAccessSupport.requireStaffUser();
    UUID userId = aiAccessSupport.currentUserId();
    int safePage = Math.max(0, page);
    int safeSize = Math.min(50, Math.max(1, pageSize));

    Page<AiTask> taskPage =
        aiTaskRepository.findByUserIdAndTaskTypeAndVoidedFalseOrderByCreatedAtDesc(
            userId, AiTaskTypeEnum.QUESTION_GENERATION, PageRequest.of(safePage, safeSize));

    List<ResAiTaskHistoryItemDTO> items = new ArrayList<>();
    for (AiTask task : taskPage.getContent()) {
      items.add(toHistoryItem(task));
    }

    ResultPaginationDTO response = new ResultPaginationDTO();
    ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
    meta.setPage(safePage);
    meta.setPageSize(safeSize);
    meta.setTotal(taskPage.getTotalElements());
    meta.setPages(taskPage.getTotalPages());
    response.setMeta(meta);
    response.setResult(items);
    return response;
  }

  private ResAiTaskHistoryItemDTO toHistoryItem(AiTask task) {
    ResAiTaskHistoryItemDTO item = new ResAiTaskHistoryItemDTO();
    item.setId(task.getId());
    item.setStatus(task.getStatus());
    item.setTaskType(task.getTaskType() != null ? task.getTaskType().name() : null);
    item.setCreatedAt(task.getCreatedAt());

    String topic = null;
    Integer questionCount = null;
    if (task.getInputJson() != null && !task.getInputJson().isBlank()) {
      try {
        JsonNode input = objectMapper.readTree(task.getInputJson());
        if (input.hasNonNull("topic")) {
          topic = input.get("topic").asText();
        }
        if (input.has("questionCount")) {
          questionCount = input.get("questionCount").asInt();
        }
      } catch (JsonProcessingException ignored) {
        /* keep partial */
      }
    }
    item.setTopic(topic);
    item.setQuestionCount(questionCount);

    if (task.getOutputJson() != null && !task.getOutputJson().isBlank()) {
      try {
        JsonNode output = objectMapper.readTree(task.getOutputJson());
        JsonNode meta = output.get("meta");
        if (meta != null) {
          if (meta.has("validCount")) {
            item.setValidCount(meta.get("validCount").asInt());
          }
          if (meta.has("summaryMessage")) {
            item.setSummaryMessage(meta.get("summaryMessage").asText());
          }
        }
      } catch (JsonProcessingException ignored) {
        /* keep partial */
      }
    }

    item.setLabel(buildHistoryLabel(item, task));
    return item;
  }

  private static String buildHistoryLabel(ResAiTaskHistoryItemDTO item, AiTask task) {
    StringBuilder sb = new StringBuilder();
    if (item.getTopic() != null && !item.getTopic().isBlank()) {
      sb.append(item.getTopic().trim());
    } else {
      sb.append("Sinh câu hỏi AI");
    }
    if (item.getQuestionCount() != null) {
      sb.append(" · ").append(item.getQuestionCount()).append(" item");
    }
    if (task.getStatus() == AiTaskStatusEnum.DONE && item.getValidCount() != null) {
      sb.append(" · ").append(item.getValidCount()).append(" hợp lệ");
    } else if (task.getStatus() == AiTaskStatusEnum.FAILED) {
      sb.append(" · thất bại");
    } else if (task.getStatus() == AiTaskStatusEnum.PROCESSING
        || task.getStatus() == AiTaskStatusEnum.PENDING) {
      sb.append(" · đang xử lý");
    }
    return sb.toString();
  }

  private ResAiTaskDTO toDto(AiTask task) throws IdInvalidException {
    ResAiTaskDTO dto = new ResAiTaskDTO();
    dto.setId(task.getId());
    dto.setStatus(task.getStatus());
    dto.setTaskType(task.getTaskType() != null ? task.getTaskType().name() : null);
    dto.setErrorMessage(task.getErrorMessage());
    dto.setModel(task.getModel());
    dto.setProgressMessage(task.getProgressMessage());
    dto.setProgressPercent(task.getProgressPercent());
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
