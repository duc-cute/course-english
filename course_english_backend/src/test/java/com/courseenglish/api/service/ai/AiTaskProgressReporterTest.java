package com.courseenglish.api.service.ai;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AiTaskProgressReporterTest {

  @Test
  void milestoneNeverRegressesButCanRaisePercent() {
    assertEquals(45, AiTaskProgressReporter.resolveNextPercent(45, 24, true));
    assertEquals(38, AiTaskProgressReporter.resolveNextPercent(24, 38, true));
  }

  @Test
  void streamUpdateSkippedWhenLowerThanCurrent() {
    assertEquals(-1, AiTaskProgressReporter.resolveNextPercent(24, 12, false));
    assertEquals(30, AiTaskProgressReporter.resolveNextPercent(24, 30, false));
  }
}
