package com.courseenglish.api.service.story;

import com.courseenglish.api.domain.dto.story.StoryTranslationsPayloadDTO;
import com.courseenglish.api.service.ActivityLogService;
import com.courseenglish.api.service.activitylog.ActivityLogWriteContext;
import com.courseenglish.api.service.impl.OpenRouterClient;
import com.courseenglish.api.util.SercurityUtil;
import com.courseenglish.api.util.constant.ActivityLogActionEnum;
import com.courseenglish.api.util.constant.ActivityLogModuleEnum;
import com.courseenglish.api.util.constant.ActivityLogSeverityEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Activity log cho bước AI sinh nội dung story (preview — chưa có storyId).
 * Dùng chung cho "Sinh bằng AI" (STORYBOOK) và "Truyện truyền cảm hứng" (MONOLOGUE).
 */
@Component
public class StoryAiGenActivityLogger {

    private static final Logger log = LoggerFactory.getLogger(StoryAiGenActivityLogger.class);
    private static final int RAW_SNIPPET_CHARS = 2000;

    private final ActivityLogService activityLogService;
    private final StoryTokenizerService storyTokenizerService;

    public StoryAiGenActivityLogger(
            ActivityLogService activityLogService, StoryTokenizerService storyTokenizerService) {
        this.activityLogService = activityLogService;
        this.storyTokenizerService = storyTokenizerService;
    }

    /** Context chung (format, model, level, …) — caller put thêm field riêng. */
    public Map<String, Object> baseContext(String storyFormat, String model, String level, Integer minutes) {
        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put("storyFormat", storyFormat);
        ctx.put("model", model);
        ctx.put("level", level);
        ctx.put("readingTimeMinutes", minutes);
        return ctx;
    }

    public void success(
            Map<String, Object> context,
            String title,
            String content,
            Integer targetWords,
            StoryTranslationsPayloadDTO translations,
            OpenRouterClient.ChatResult chat) {
        int words = content == null || content.isBlank() ? 0 : content.trim().split("\\s+").length;
        int sentencesEn = countSentences(content);
        int sentencesVi = translations != null ? translations.getSentenceTranslations().size() : 0;

        ActivityLogWriteContext ctx = base(
                sentencesEn == sentencesVi ? ActivityLogSeverityEnum.INFO : ActivityLogSeverityEnum.WARN,
                ActivityLogActionEnum.STORY_AI_GEN,
                "AI sinh story — \"" + title + "\"" + (sentencesEn == sentencesVi ? "" : " (lệch số câu EN/VI)"),
                context);
        ctx.put("title", title)
                .put("words", words)
                .put("targetWords", targetWords)
                .put("sentencesEn", sentencesEn)
                .put("sentencesVi", sentencesVi)
                .put("glossary", translations != null ? translations.getGlossary().size() : 0);
        putChatStats(ctx, chat);
        activityLogService.log(ctx);
    }

    public void failure(Map<String, Object> context, String reason, OpenRouterClient.ChatResult chat) {
        ActivityLogWriteContext ctx = base(
                ActivityLogSeverityEnum.ERROR,
                ActivityLogActionEnum.STORY_AI_GEN_FAIL,
                "AI sinh story thất bại — " + reason,
                context);
        putChatStats(ctx, chat);
        String raw = chat != null ? firstNonBlank(chat.getRawContent(), chat.getContent()) : null;
        if (raw != null) {
            ctx.detail(raw.length() > RAW_SNIPPET_CHARS ? raw.substring(0, RAW_SNIPPET_CHARS) + "…" : raw);
        } else {
            ctx.detail(reason);
        }
        activityLogService.log(ctx);
    }

    private ActivityLogWriteContext base(
            ActivityLogSeverityEnum severity,
            ActivityLogActionEnum action,
            String message,
            Map<String, Object> context) {
        ActivityLogWriteContext ctx =
                ActivityLogWriteContext.of(severity, ActivityLogModuleEnum.STORY, action, message);
        SercurityUtil.getCurrentUserId().ifPresent(ctx::userId);
        if (context != null) {
            context.forEach(ctx::put);
        }
        return ctx;
    }

    private static void putChatStats(ActivityLogWriteContext ctx, OpenRouterClient.ChatResult chat) {
        if (chat == null) {
            return;
        }
        ctx.put("promptTokens", chat.getPromptTokens())
                .put("completionTokens", chat.getCompletionTokens())
                .put("durationMs", chat.getDurationMs());
    }

    private int countSentences(String content) {
        if (content == null || content.isBlank()) {
            return 0;
        }
        try {
            return storyTokenizerService.splitSentences(content).size();
        } catch (Exception ex) {
            log.warn("[StoryAI] Could not count sentences for activity log: {}", ex.getMessage());
            return -1;
        }
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a;
        }
        return b != null && !b.isBlank() ? b : null;
    }
}
