-- Last error message when story audio generation fails (for admin UI + debugging).
ALTER TABLE stories
    ADD COLUMN audio_last_error TEXT NULL COMMENT 'Last TTS generation error' AFTER voice_profile_json;
