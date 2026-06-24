package com.courseenglish.api.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MeetLinkValidatorTest {

    @Test
    void acceptsGoogleMeetRoom() {
        assertTrue(MeetLinkValidator.isValid("https://meet.google.com/abc-defg-hij"));
    }

    @Test
    void acceptsZoom() {
        assertTrue(MeetLinkValidator.isValid("https://us06web.zoom.us/j/123456789"));
    }

    @Test
    void rejectsMeetNew() {
        assertFalse(MeetLinkValidator.isValid("https://meet.new"));
    }

    @Test
    void rejectsHttp() {
        assertFalse(MeetLinkValidator.isValid("http://meet.google.com/abc-defg-hij"));
    }

    @Test
    void rejectsBlank() {
        assertFalse(MeetLinkValidator.isValid("  "));
    }
}
