package com.courseenglish.api.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StoryWordKeyUtilTest {

    @Test
    void stripsEdgePunctuationAndLowercases() {
        assertEquals("passport", StoryWordKeyUtil.toWordKey("Passport,"));
        assertEquals("gate", StoryWordKeyUtil.toWordKey("\"gate\""));
        assertEquals("don't", StoryWordKeyUtil.toWordKey("don't."));
    }

    @Test
    void trimsWhitespace() {
        assertEquals("hello", StoryWordKeyUtil.toWordKey("  hello  "));
    }

    @Test
    void blankAfterStripReturnsEmpty() {
        assertEquals("", StoryWordKeyUtil.toWordKey("..."));
        assertEquals("", StoryWordKeyUtil.toWordKey(null));
    }

    @Test
    void isWordSurface() {
        assertTrue(StoryWordKeyUtil.isWordSurface("passport,"));
        assertFalse(StoryWordKeyUtil.isWordSurface("..."));
        assertFalse(StoryWordKeyUtil.isWordSurface(null));
    }
}
