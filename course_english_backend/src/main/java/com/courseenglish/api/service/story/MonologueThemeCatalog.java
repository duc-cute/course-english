package com.courseenglish.api.service.story;

import java.util.List;
import java.util.Optional;

/**
 * Danh mục chủ đề cho truyện tự sự (MONOLOGUE). Admin chọn nhóm hoặc để ngẫu nhiên;
 * BE random một "góc khai thác" trong nhóm để ghép prompt — admin không phải viết prompt.
 */
public final class MonologueThemeCatalog {

    public static final String PARABLE_KEY = "PARABLE";

    public record Theme(String key, String name, String description, List<String> angles) {}

    public static final List<Theme> THEMES = List.of(
            new Theme(
                    "CONFIDENCE",
                    "Lấy lại sự tự tin",
                    "Thất bại, lạc hướng, bắt đầu lại — không bao giờ là quá muộn",
                    List.of(
                            "failing an important exam and deciding to try again",
                            "feeling lost in a job you do not like",
                            "being afraid to speak in front of other people",
                            "comparing yourself to others on social media",
                            "starting over after a big mistake",
                            "feeling you are too old or too late to learn something new",
                            "being told you are not good enough",
                            "a long, tiring day that ends with a small hope")),
            new Theme(
                    "STUDY_PERSEVERANCE",
                    "Học tập & kiên trì",
                    "Học chậm cũng được, mỗi ngày một chút",
                    List.of(
                            "learning English slowly but every day",
                            "forgetting new words again and again",
                            "being afraid of making mistakes when speaking English",
                            "small daily habits that change everything",
                            "a student who studies late at night after work",
                            "progress you cannot see yet",
                            "starting again after giving up a goal")),
            new Theme(
                    "SELF_CARE",
                    "Tự chăm sóc bản thân",
                    "Nghỉ ngơi, bớt so sánh, đối xử tử tế với chính mình",
                    List.of(
                            "it is okay to rest",
                            "saying no without feeling guilty",
                            "a slow morning without the phone",
                            "being kind to yourself on a bad day",
                            "you do not need to be perfect",
                            "taking a walk when your mind is tired")),
            new Theme(
                    "GRATITUDE_FAMILY",
                    "Biết ơn & gia đình",
                    "Cha mẹ, những điều nhỏ bé thường bị bỏ quên",
                    List.of(
                            "a mother who wakes up early every day",
                            "a father who does not say much but always helps",
                            "calling your parents more often",
                            "small things we forget to thank people for",
                            "a simple family dinner",
                            "grandparents and the stories they tell")),
            new Theme(
                    "FRIENDSHIP_KINDNESS",
                    "Tình bạn & tử tế",
                    "Lòng tốt nhỏ, lắng nghe, người bạn ở bên",
                    List.of(
                            "a small act of kindness from a stranger",
                            "a friend who listens without judging",
                            "saying sorry first",
                            "helping someone who cannot help you back",
                            "a smile that changes someone's day",
                            "an old friend you have not called for years")),
            new Theme(
                    PARABLE_KEY,
                    "Ngụ ngôn bài học",
                    "Câu chuyện ngụ ngôn ngắn kết bằng một bài học",
                    List.of(
                            "the bamboo tree that grows roots for years before it grows tall",
                            "an old man who moves a big stone one small piece at a time",
                            "a snail that keeps going while others laugh",
                            "a seed in the dark soil waiting for spring",
                            "a broken cup repaired with gold",
                            "two buckets at a well, one full of complaints and one full of thanks",
                            "a butterfly that must struggle to leave its cocoon")));

    private MonologueThemeCatalog() {}

    public static Optional<Theme> find(String key) {
        if (key == null || key.isBlank()) {
            return Optional.empty();
        }
        String normalized = key.trim().toUpperCase();
        return THEMES.stream().filter(t -> t.key().equals(normalized)).findFirst();
    }
}
