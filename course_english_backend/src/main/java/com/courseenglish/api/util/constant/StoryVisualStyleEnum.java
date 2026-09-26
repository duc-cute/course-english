package com.courseenglish.api.util.constant;

public enum StoryVisualStyleEnum {
    PASTEL_STORYBOOK(
            "modern 2D educational storybook illustration",
            "soft pastel colors",
            "warm and natural",
            "friendly"),
    INK_SKETCH(
            "hand-drawn black ink doodle sketch, simple clean line art on cream paper texture, "
                    + "loose sketchnote style, simple round-headed everyman character",
            "mostly black and white with one minimal warm yellow accent",
            "soft and calm",
            "hopeful and reflective");

    private final String artStyle;
    private final String colorStyle;
    private final String lighting;
    private final String mood;

    StoryVisualStyleEnum(String artStyle, String colorStyle, String lighting, String mood) {
        this.artStyle = artStyle;
        this.colorStyle = colorStyle;
        this.lighting = lighting;
        this.mood = mood;
    }

    public String getArtStyle() {
        return artStyle;
    }

    public String getColorStyle() {
        return colorStyle;
    }

    public String getLighting() {
        return lighting;
    }

    public String getMood() {
        return mood;
    }

    public static StoryVisualStyleEnum defaultFor(StoryFormatEnum format) {
        return format == StoryFormatEnum.MONOLOGUE ? INK_SKETCH : PASTEL_STORYBOOK;
    }
}
