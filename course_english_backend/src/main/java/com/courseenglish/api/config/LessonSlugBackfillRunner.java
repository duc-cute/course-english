package com.courseenglish.api.config;

import com.courseenglish.api.service.LessonService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class LessonSlugBackfillRunner implements ApplicationRunner {

    private final LessonService lessonService;

    public LessonSlugBackfillRunner(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @Override
    public void run(ApplicationArguments args) {
        lessonService.backfillTemporarySlugs();
    }
}
