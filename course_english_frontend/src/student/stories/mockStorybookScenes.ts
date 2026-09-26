import type { StoryScene, StorySceneSegment, StorySentence, StoryToken } from "../../shared/api/story";

/** Build demo storybook scenes when API has no illustrations yet. */
export function buildMockStorybookScenes(
  sentences: StorySentence[] | undefined,
  tokens: StoryToken[] | undefined,
): StoryScene[] {
  const list = sentences ?? [];
  if (list.length === 0) {
    return [
      {
        sceneIndex: 1,
        sentenceStart: 0,
        sentenceEnd: 0,
        description: "Demo scene",
        location: "bookstore",
        characters: ["Emma"],
        imageUrl: "",
        status: "READY",
        segments: [
          { type: "narration", text: "Emma walked into a small English bookstore on a rainy afternoon." },
          { type: "dialogue", speaker: "Emma", text: "Is anyone here?" },
          { type: "narration", text: "Nobody answered, but she noticed an old red book on a dusty shelf." },
        ],
      },
    ];
  }

  const targetScenes = Math.min(5, Math.max(3, Math.ceil(list.length / 3)));
  const chunk = Math.max(1, Math.ceil(list.length / targetScenes));
  const scenes: StoryScene[] = [];
  const speakers = ["Emma", "Tom", "Librarian"];

  for (let i = 0; i < list.length; i += chunk) {
    const start = i;
    const end = Math.min(list.length - 1, i + chunk - 1);
    const sceneIndex = scenes.length + 1;
    const segments: StorySceneSegment[] = [];
    for (let si = start; si <= end; si++) {
      const text = list[si]?.text?.trim() ?? "";
      if (!text) continue;
      const quoted = text.match(/^["“](.+)["”](?:\s*[—-]\s*(.+))?$/);
      if (quoted) {
        segments.push({
          type: "dialogue",
          speaker: quoted[2]?.trim() || speakers[sceneIndex % speakers.length],
          text: quoted[1].trim(),
        });
      } else if (text.includes('"') || text.includes("“")) {
        const parts = text.split(/(?=["“])/);
        for (const part of parts) {
          const p = part.trim();
          if (!p) continue;
          if (p.startsWith('"') || p.startsWith("“")) {
            segments.push({
              type: "dialogue",
              speaker: speakers[sceneIndex % speakers.length],
              text: p.replace(/^["“]|["”]$/g, "").trim(),
            });
          } else {
            segments.push({ type: "narration", text: p });
          }
        }
      } else {
        segments.push({ type: "narration", text });
      }
    }
    if (segments.length === 0) {
      segments.push({ type: "narration", text: list.slice(start, end + 1).map((s) => s.text).join(" ") });
    }
    scenes.push({
      sceneIndex,
      sentenceStart: start,
      sentenceEnd: end,
      description: `Scene ${sceneIndex}`,
      location: sceneIndex % 2 === 0 ? "street" : "bookstore",
      characters: ["Emma"],
      segments,
      imageUrl: "",
      status: "READY",
    });
  }

  void tokens;
  return scenes;
}

export function speakerColor(speaker: string | undefined, index: number): string {
  const palette = ["#0d9488", "#2563eb", "#c026d3", "#ea580c", "#4f46e5"];
  if (!speaker) return palette[index % palette.length];
  let hash = 0;
  for (let i = 0; i < speaker.length; i++) {
    hash = (hash * 31 + speaker.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}
