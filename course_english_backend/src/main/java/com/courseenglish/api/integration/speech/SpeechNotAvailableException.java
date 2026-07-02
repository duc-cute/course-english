package com.courseenglish.api.integration.speech;

public class SpeechNotAvailableException extends RuntimeException {

    public SpeechNotAvailableException(String message) {
        super(message);
    }
}
