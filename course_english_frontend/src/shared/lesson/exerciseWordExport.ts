import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  Header,
  HeadingLevel,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
} from "docx";
import { saveAs } from "file-saver";
import { resolveStorageAssetUrl } from "../api/file";
import type {
  ExerciseChoice,
  ExerciseQuestion,
  ExerciseQuestionType,
  ExerciseSetPayload,
  FillBlankQuestion,
  GapFillMcqQuestion,
  ListenChooseQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  ReadingComprehensionQuestion,
  ReadingSubQuestion,
  ReorderSentenceQuestion,
  TrueFalseQuestion,
} from "../../student/lessonPlayer/exercise/types";
import { getQuestionTypeLabel } from "./exercisePayload";
import { formatAcceptedAnswers, parseFillBlankPrompt } from "./fillBlankUtils";

/** Phase 1 — MCQ, Đúng/Sai, Điền khuyết, Chọn điền khuyết */
export const WORD_EXPORT_PHASE1_TYPES: ExerciseQuestionType[] = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "FILL_BLANK",
  "GAP_FILL_MCQ",
];

/** Phase 2 — Đọc hiểu, Ghép cặp, Sắp xếp câu */
export const WORD_EXPORT_PHASE2_TYPES: ExerciseQuestionType[] = [
  "READING_COMPREHENSION",
  "MATCHING",
  "REORDER_SENTENCE",
];

/** Phase 3 — nghe: LISTEN_CHOOSE đã hỗ trợ; LISTEN_TYPE chưa */
export const WORD_EXPORT_PHASE3_TYPES: ExerciseQuestionType[] = [
  "LISTEN_CHOOSE",
  "LISTEN_TYPE",
];

/** Phase 4 — logo + watermark từ SystemConfig; font mặc định Calibri */
export type ExerciseWordExportBranding = {
  logoUrl?: string;
  watermarkText?: string;
};

const WORD_EXPORT_SUPPORTED_TYPES = new Set<ExerciseQuestionType>([
  ...WORD_EXPORT_PHASE1_TYPES,
  ...WORD_EXPORT_PHASE2_TYPES,
  "LISTEN_CHOOSE",
]);

export type ExerciseWordExportMode = "worksheet" | "answer_key";

export type ExerciseWordExportResult = {
  ok: boolean;
  exportedCount: number;
  skippedCount: number;
  skippedTypeLabels: string[];
  error?: string;
};

const BODY_FONT = "Calibri";
const FILL_BLANK_WORKSHEET_GAP = "________";
const WORD_LOGO_MAX_WIDTH = 140;
const WORD_LOGO_MAX_HEIGHT = 56;

type WordImageType = "jpg" | "png" | "gif" | "bmp";

function detectWordImageType(url: string, contentType: string | null): WordImageType {
  const lower = url.toLowerCase();
  if (contentType?.includes("jpeg") || contentType?.includes("jpg") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "jpg";
  }
  if (contentType?.includes("gif") || lower.endsWith(".gif")) return "gif";
  if (contentType?.includes("bmp") || lower.endsWith(".bmp")) return "bmp";
  return "png";
}

async function loadWordExportLogoImage(logoUrl: string): Promise<ImageRun | null> {
  const resolved = resolveStorageAssetUrl(logoUrl);
  if (!resolved) return null;

  try {
    const response = await fetch(resolved);
    if (!response.ok) return null;
    const data = await response.arrayBuffer();
    if (!data.byteLength) return null;

    return new ImageRun({
      type: detectWordImageType(resolved, response.headers.get("content-type")),
      data,
      transformation: {
        width: WORD_LOGO_MAX_WIDTH,
        height: WORD_LOGO_MAX_HEIGHT,
      },
    });
  } catch {
    return null;
  }
}

function resolveWatermarkLayout(text: string) {
  const len = text.length;
  if (len <= 8) {
    return { canvasW: 1500, canvasH: 1100, fontPx: 156, imgW: 740, imgH: 560 };
  }
  if (len <= 14) {
    return { canvasW: 1500, canvasH: 1100, fontPx: 118, imgW: 720, imgH: 540 };
  }
  return { canvasW: 1600, canvasH: 1150, fontPx: 88, imgW: 700, imgH: 520 };
}

async function createWatermarkImageRun(text: string): Promise<ImageRun | null> {
  const label = text.trim();
  if (!label || typeof document === "undefined") return null;

  const layout = resolveWatermarkLayout(label);
  const canvas = document.createElement("canvas");
  canvas.width = layout.canvasW;
  canvas.height = layout.canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, layout.canvasW, layout.canvasH);
  ctx.translate(layout.canvasW / 2, layout.canvasH / 2);
  ctx.rotate((-45 * Math.PI) / 180);
  ctx.font = `bold ${layout.fontPx}px Calibri, Arial, sans-serif`;
  ctx.fillStyle = "rgba(170, 170, 170, 0.24)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (!blob) return null;

  const data = await blob.arrayBuffer();
  if (!data.byteLength) return null;

  return new ImageRun({
    type: "png",
    data,
    transformation: { width: layout.imgW, height: layout.imgH },
    floating: {
      behindDocument: true,
      allowOverlap: true,
      horizontalPosition: {
        relative: HorizontalPositionRelativeFrom.PAGE,
        align: HorizontalPositionAlign.CENTER,
      },
      verticalPosition: {
        relative: VerticalPositionRelativeFrom.PAGE,
        align: VerticalPositionAlign.CENTER,
      },
    },
  });
}

async function buildDocumentSection(
  children: Paragraph[],
  branding?: ExerciseWordExportBranding,
  options?: { applyWatermark?: boolean },
) {
  const watermarkText =
    options?.applyWatermark && branding?.watermarkText?.trim()
      ? branding.watermarkText.trim()
      : "";
  if (!watermarkText) {
    return { children };
  }

  const watermarkImage = await createWatermarkImageRun(watermarkText);
  if (!watermarkImage) {
    return { children };
  }

  return {
    children,
    headers: {
      default: new Header({
        children: [new Paragraph({ children: [watermarkImage] })],
      }),
    },
  };
}

async function buildLogoLeadParagraph(logoUrl?: string): Promise<Paragraph | null> {
  const resolved = logoUrl?.trim();
  if (!resolved) return null;

  const logoImage = await loadWordExportLogoImage(resolved);
  if (!logoImage) return null;

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [logoImage],
  });
}

function isWordExportSupported(type: ExerciseQuestionType): boolean {
  return WORD_EXPORT_SUPPORTED_TYPES.has(type);
}

function choiceIdToLabel(choiceId: string, index: number): string {
  const normalized = choiceId.trim().toLowerCase();
  if (/^[a-z]$/.test(normalized)) return normalized.toUpperCase();
  return String.fromCharCode(65 + index);
}

function slugifyFileName(title: string): string {
  const slug = title
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  return slug || "bai_tap";
}

function paragraph(text: string, options?: { bold?: boolean; italics?: boolean; color?: string; spacingAfter?: number }): Paragraph {
  return new Paragraph({
    spacing: { after: options?.spacingAfter ?? 120 },
    children: [
      new TextRun({
        text,
        font: BODY_FONT,
        size: 22,
        bold: options?.bold,
        italics: options?.italics,
        color: options?.color,
      }),
    ],
  });
}

type StyledParagraphOptions = {
  bold?: boolean;
  italics?: boolean;
  color?: string;
  spacingAfter?: number;
  indent?: { left?: number; right?: number };
};

/** Split textarea content into Word paragraphs (blank line or single newline). */
function splitMultilineParagraphs(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  let blocks = trimmed
    .split(/\r?\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (blocks.length === 1 && /\r?\n/.test(blocks[0]!)) {
    blocks = blocks[0]!
      .split(/\r?\n/)
      .map((segment) => segment.trim())
      .filter(Boolean);
  }

  return blocks;
}

function styledParagraph(segment: string, options?: StyledParagraphOptions): Paragraph {
  return new Paragraph({
    spacing: { after: options?.spacingAfter ?? 120 },
    indent: options?.indent,
    children: [
      new TextRun({
        text: segment,
        font: BODY_FONT,
        size: 22,
        bold: options?.bold,
        italics: options?.italics,
        color: options?.color,
      }),
    ],
  });
}

function paragraphsFromMultilineText(text: string, options?: StyledParagraphOptions): Paragraph[] {
  const blocks = splitMultilineParagraphs(text);
  if (!blocks.length) {
    return [styledParagraph("(Chưa có nội dung)", options)];
  }

  return blocks.map((segment, index) =>
    styledParagraph(segment, {
      ...options,
      spacingAfter:
        index < blocks.length - 1 ? (options?.spacingAfter ?? 100) : (options?.spacingAfter ?? 160),
    }),
  );
}

function mixedParagraph(runs: Array<{ text: string; bold?: boolean; italics?: boolean; color?: string }>, spacingAfter = 120): Paragraph {
  return new Paragraph({
    spacing: { after: spacingAfter },
    children: runs.map(
      (run) =>
        new TextRun({
          text: run.text,
          font: BODY_FONT,
          size: 22,
          bold: run.bold,
          italics: run.italics,
          color: run.color,
        }),
    ),
  });
}

function questionHeaderLine(questionNumber: number, typeLabel?: string): Paragraph {
  const runs: Array<{ text: string; bold?: boolean; italics?: boolean; color?: string }> = [
    { text: `Câu ${questionNumber}. `, bold: true },
  ];
  if (typeLabel) {
    runs.push({ text: `(${typeLabel})`, italics: true, color: "666666" });
  }
  return mixedParagraph(runs);
}

type WordExportQuestionCounter = {
  current: number;
};

function countLogicalWordQuestions(question: ExerciseQuestion): number {
  if (!isWordExportSupported(question.type)) return 0;
  if (question.type === "READING_COMPREHENSION") {
    return question.subQuestions.length > 0 ? question.subQuestions.length : 1;
  }
  if (question.type === "GAP_FILL_MCQ") {
    return question.blanks.length > 0 ? question.blanks.length : 1;
  }
  return 1;
}

function explanationParagraph(explanation: string | undefined, mode: ExerciseWordExportMode): Paragraph | null {
  if (mode !== "answer_key" || !explanation?.trim()) return null;
  return mixedParagraph([
    { text: "Giải thích: ", italics: true, color: "444444" },
    { text: explanation.trim() },
  ], 160);
}

function buildChoiceListParagraphs(
  choices: ExerciseChoice[],
  correctChoiceId: string,
  mode: ExerciseWordExportMode,
): Paragraph[] {
  return choices.map((choice, choiceIndex) => {
    const label = choiceIdToLabel(choice.id, choiceIndex);
    const isCorrect = mode === "answer_key" && choice.id === correctChoiceId;
    return new Paragraph({
      spacing: { after: 60 },
      indent: { left: 360 },
      children: [
        new TextRun({
          text: `${label}. `,
          font: BODY_FONT,
          size: 22,
          bold: isCorrect,
        }),
        new TextRun({
          text: choice.text.trim() || "—",
          font: BODY_FONT,
          size: 22,
          bold: isCorrect,
        }),
      ],
    });
  });
}

function buildMcqParagraphs(
  question: MultipleChoiceQuestion,
  mode: ExerciseWordExportMode,
): Paragraph[] {
  const blocks: Paragraph[] = [paragraph(question.prompt.text.trim() || "(Chưa có đề bài)", { spacingAfter: 80 })];
  blocks.push(...buildChoiceListParagraphs(question.choices, question.correctChoiceId, mode));

  const explanation = explanationParagraph(question.explanation, mode);
  if (explanation) blocks.push(explanation);
  return blocks;
}

function buildTrueFalseParagraphs(
  question: TrueFalseQuestion,
  mode: ExerciseWordExportMode,
): Paragraph[] {
  const blocks: Paragraph[] = [paragraph(question.prompt.text.trim() || "(Chưa có đề bài)", { spacingAfter: 80 })];

  const correctLabel = question.correctAnswer ? "Đúng" : "Sai";
  const options: Array<{ label: string; isCorrect: boolean }> = [
    { label: "Đúng", isCorrect: question.correctAnswer },
    { label: "Sai", isCorrect: !question.correctAnswer },
  ];

  options.forEach((opt, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const highlight = mode === "answer_key" && opt.isCorrect;
    blocks.push(
      new Paragraph({
        spacing: { after: 60 },
        indent: { left: 360 },
        children: [
          new TextRun({ text: `${letter}. `, font: BODY_FONT, size: 22, bold: highlight }),
          new TextRun({ text: opt.label, font: BODY_FONT, size: 22, bold: highlight }),
        ],
      }),
    );
  });

  if (mode === "answer_key") {
    blocks.push(
      mixedParagraph([
        { text: "Đáp án: ", bold: true },
        { text: correctLabel, bold: true },
      ], 100),
    );
  }

  const explanation = explanationParagraph(question.explanation, mode);
  if (explanation) blocks.push(explanation);
  return blocks;
}

function buildFillBlankParagraphs(
  question: FillBlankQuestion,
  mode: ExerciseWordExportMode,
): Paragraph[] {
  const segments = parseFillBlankPrompt(question.prompt.text, question.blanks);
  const blankById = new Map(question.blanks.map((b) => [b.id, b]));
  const runs: Array<{ text: string; bold?: boolean; italics?: boolean }> = [];

  segments.forEach((segment) => {
    if (segment.kind === "text") {
      runs.push({ text: segment.value });
      return;
    }

    const blank = blankById.get(segment.blankId) ?? question.blanks[0];
    if (mode === "worksheet" || !blank) {
      runs.push({ text: FILL_BLANK_WORKSHEET_GAP });
      return;
    }

    const answers = formatAcceptedAnswers(blank.acceptedAnswers);
    runs.push({ text: `[${answers || "…"}]`, bold: true });
  });

  if (!runs.length) {
    runs.push({ text: question.prompt.text.trim() || "(Chưa có đề bài)" });
  }

  const blocks: Paragraph[] = [mixedParagraph(runs, 100)];

  if (mode === "answer_key" && question.blanks.length > 0) {
    question.blanks.forEach((blank, idx) => {
      const answers = formatAcceptedAnswers(blank.acceptedAnswers);
      if (!answers) return;
      blocks.push(
        paragraph(`Ô ${idx + 1}: ${answers}`, { spacingAfter: 60 }),
      );
    });
  }

  const explanation = explanationParagraph(question.explanation, mode);
  if (explanation) blocks.push(explanation);
  return blocks;
}

function buildGapFillMcqParagraphs(
  question: GapFillMcqQuestion,
  counter: WordExportQuestionCounter,
  mode: ExerciseWordExportMode,
): Paragraph[] {
  const segments = parseFillBlankPrompt(question.prompt.text, question.blanks);
  const blankById = new Map(question.blanks.map((b) => [b.id, b]));
  const runs: Array<{ text: string; bold?: boolean }> = [];

  segments.forEach((segment) => {
    if (segment.kind === "text") {
      runs.push({ text: segment.value });
      return;
    }

    const blank = blankById.get(segment.blankId);
    if (mode === "worksheet" || !blank) {
      runs.push({ text: FILL_BLANK_WORKSHEET_GAP });
      return;
    }

    const correct = blank.choices.find((c) => c.id === blank.correctChoiceId);
    const answerText = correct?.text.trim() || "…";
    runs.push({ text: `[${answerText}]`, bold: true });
  });

  if (!runs.length) {
    runs.push({ text: question.prompt.text.trim() || "(Chưa có đề bài)" });
  }

  const blocks: Paragraph[] = [mixedParagraph(runs, 120)];

  question.blanks.forEach((blank) => {
    const hasChoices = blank.choices.some((c) => c.text.trim());
    if (!hasChoices && mode === "worksheet") return;

    counter.current += 1;
    blocks.push(
      questionHeaderLine(counter.current),
      ...buildChoiceListParagraphs(blank.choices, blank.correctChoiceId, mode),
    );
  });

  const explanation = explanationParagraph(question.explanation, mode);
  if (explanation) blocks.push(explanation);
  return blocks;
}

function buildAudioNoteParagraphs(
  audioUrl: string | undefined,
  options?: { audioAccent?: "UK" | "US"; wordEn?: string },
): Paragraph[] {
  const blocks: Paragraph[] = [
    paragraph("Nghe audio trên hệ thống Course English hoặc mở link bên dưới.", {
      italics: true,
      color: "666666",
      spacingAfter: 80,
    }),
  ];

  if (options?.wordEn?.trim()) {
    blocks.push(paragraph(`Từ vựng: ${options.wordEn.trim()}`, { spacingAfter: 60 }));
  }

  if (options?.audioAccent) {
    blocks.push(paragraph(`Giọng đọc: ${options.audioAccent}`, { spacingAfter: 60 }));
  }

  const url = audioUrl?.trim();
  if (url) {
    blocks.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: "Link audio: ", font: BODY_FONT, size: 22 }),
          new ExternalHyperlink({
            link: url,
            children: [
              new TextRun({
                text: url,
                font: BODY_FONT,
                size: 22,
                style: "Hyperlink",
                color: "0563C1",
              }),
            ],
          }),
        ],
      }),
    );
  } else {
    blocks.push(paragraph("(Chưa có link audio)", { italics: true, color: "888888", spacingAfter: 100 }));
  }

  return blocks;
}

function buildListenChooseParagraphs(
  question: ListenChooseQuestion,
  mode: ExerciseWordExportMode,
): Paragraph[] {
  const promptText =
    question.prompt?.text?.trim() || "Nghe và chọn nghĩa tiếng Việt đúng.";
  const blocks: Paragraph[] = [
    paragraph(promptText, { spacingAfter: 80 }),
    ...buildAudioNoteParagraphs(question.audioUrl, {
      audioAccent: question.audioAccent,
      wordEn: question.wordEn,
    }),
    ...buildChoiceListParagraphs(question.choices, question.correctChoiceId, mode),
  ];

  const explanation = explanationParagraph(question.explanation, mode);
  if (explanation) blocks.push(explanation);
  return blocks;
}

function buildReadingSubQuestionParagraphs(
  sub: ReadingSubQuestion,
  questionNumber: number,
  mode: ExerciseWordExportMode,
): Paragraph[] {
  const blocks: Paragraph[] = [
    mixedParagraph([
      { text: `Câu ${questionNumber}. `, bold: true },
      { text: sub.prompt.text.trim() || "(Chưa có đề bài)" },
    ], 80),
    ...buildChoiceListParagraphs(sub.choices, sub.correctChoiceId, mode),
  ];

  if (mode === "answer_key" && sub.explanation?.trim()) {
    const subExplanation = explanationParagraph(sub.explanation, mode);
    if (subExplanation) blocks.push(subExplanation);
  }

  return blocks;
}

function buildReadingComprehensionParagraphs(
  question: ReadingComprehensionQuestion,
  counter: WordExportQuestionCounter,
  mode: ExerciseWordExportMode,
): Paragraph[] {
  const blocks: Paragraph[] = [];

  if (question.passage.title?.trim()) {
    blocks.push(paragraph(question.passage.title.trim(), { bold: true, spacingAfter: 80 }));
  }

  const passageText = question.passage.text.trim() || "(Chưa có đoạn văn)";
  blocks.push(
    ...paragraphsFromMultilineText(passageText, {
      italics: true,
      spacingAfter: 100,
      indent: { left: 360, right: 360 },
    }),
  );

  question.subQuestions.forEach((sub) => {
    counter.current += 1;
    blocks.push(...buildReadingSubQuestionParagraphs(sub, counter.current, mode));
    blocks.push(paragraph("", { spacingAfter: 80 }));
  });

  const explanation = explanationParagraph(question.explanation, mode);
  if (explanation) blocks.push(explanation);
  return blocks;
}

function buildMatchingParagraphs(
  question: MatchingQuestion,
  mode: ExerciseWordExportMode,
): Paragraph[] {
  const blocks: Paragraph[] = [];

  if (question.prompt?.text?.trim()) {
    blocks.push(paragraph(question.prompt.text.trim(), { spacingAfter: 100 }));
  }

  const pairs = question.pairs.filter((p) => p.left.trim() || p.right.trim());
  if (!pairs.length) {
    blocks.push(paragraph("(Chưa có cặp ghép)", { spacingAfter: 80 }));
    return blocks;
  }

  if (mode === "worksheet") {
    blocks.push(paragraph("Cột trái:", { bold: true, spacingAfter: 60 }));
    pairs.forEach((pair, index) => {
      blocks.push(paragraph(`  ${index + 1}. ${pair.left.trim() || "—"}`, { spacingAfter: 40 }));
    });

    blocks.push(paragraph("Cột phải:", { bold: true, spacingAfter: 60 }));
    const rightItems = [...pairs.map((p) => p.right.trim() || "—")].sort((a, b) =>
      a.localeCompare(b, "vi"),
    );
    rightItems.forEach((right, index) => {
      const label = String.fromCharCode(65 + index);
      blocks.push(paragraph(`  ${label}. ${right}`, { spacingAfter: 40 }));
    });

    blocks.push(
      paragraph("Nối mỗi mục cột trái với một mục cột phải tương ứng.", {
        italics: true,
        color: "666666",
        spacingAfter: 80,
      }),
    );
  } else {
    blocks.push(paragraph("Đáp án ghép cặp:", { bold: true, spacingAfter: 80 }));
    pairs.forEach((pair, index) => {
      blocks.push(
        mixedParagraph([
          { text: `${index + 1}. `, bold: true },
          { text: `${pair.left.trim() || "—"}`, bold: true },
          { text: "  →  " },
          { text: pair.right.trim() || "—", bold: true },
        ], 60),
      );
    });
  }

  const explanation = explanationParagraph(question.explanation, mode);
  if (explanation) blocks.push(explanation);
  return blocks;
}

function buildReorderSentenceParagraphs(
  question: ReorderSentenceQuestion,
  mode: ExerciseWordExportMode,
): Paragraph[] {
  const blocks: Paragraph[] = [];
  const tokens = question.tokens.filter((t) => t.text.trim());

  if (question.prompt?.text?.trim()) {
    blocks.push(paragraph(question.prompt.text.trim(), { spacingAfter: 100 }));
  }

  if (!tokens.length) {
    blocks.push(paragraph("(Chưa có từ/cụm từ)", { spacingAfter: 80 }));
    return blocks;
  }

  const tokenById = new Map(tokens.map((t) => [t.id, t]));

  if (mode === "worksheet") {
    blocks.push(
      paragraph("Sắp xếp các từ/cụm từ sau thành câu hoàn chỉnh:", { spacingAfter: 80 }),
    );
    const shuffled = [...tokens].sort((a, b) => a.text.localeCompare(b.text, "vi"));
    shuffled.forEach((token, index) => {
      blocks.push(paragraph(`  ${index + 1}. ${token.text.trim()}`, { spacingAfter: 40 }));
    });
    blocks.push(
      paragraph("Câu hoàn chỉnh: ________________________________________________", {
        spacingAfter: 80,
      }),
    );
  } else {
    const orderIds =
      question.correctOrder.length > 0
        ? question.correctOrder
        : tokens.map((t) => t.id);

    blocks.push(paragraph("Thứ tự đúng:", { bold: true, spacingAfter: 80 }));
    orderIds.forEach((id, index) => {
      const token = tokenById.get(id);
      if (!token) return;
      blocks.push(paragraph(`  ${index + 1}. ${token.text.trim()}`, { spacingAfter: 40 }));
    });

    const sentence =
      question.sourceSentence?.trim() ||
      orderIds
        .map((id) => tokenById.get(id)?.text.trim())
        .filter(Boolean)
        .join(" ");

    if (sentence) {
      blocks.push(
        mixedParagraph([
          { text: "Câu hoàn chỉnh: ", bold: true },
          { text: sentence, bold: true },
        ], 100),
      );
    }
  }

  const explanation = explanationParagraph(question.explanation, mode);
  if (explanation) blocks.push(explanation);
  return blocks;
}

function buildQuestionParagraphs(
  question: ExerciseQuestion,
  counter: WordExportQuestionCounter,
  mode: ExerciseWordExportMode,
): Paragraph[] | null {
  if (!isWordExportSupported(question.type)) return null;

  if (question.type === "READING_COMPREHENSION") {
    return buildReadingComprehensionParagraphs(question, counter, mode);
  }
  if (question.type === "GAP_FILL_MCQ") {
    return buildGapFillMcqParagraphs(question, counter, mode);
  }

  const typeLabel = getQuestionTypeLabel(question);
  counter.current += 1;
  const header = questionHeaderLine(counter.current, typeLabel);

  if (question.type === "MULTIPLE_CHOICE") {
    return [header, ...buildMcqParagraphs(question, mode)];
  }
  if (question.type === "TRUE_FALSE") {
    return [header, ...buildTrueFalseParagraphs(question, mode)];
  }
  if (question.type === "FILL_BLANK") {
    return [header, ...buildFillBlankParagraphs(question, mode)];
  }
  if (question.type === "MATCHING") {
    return [header, ...buildMatchingParagraphs(question, mode)];
  }
  if (question.type === "REORDER_SENTENCE") {
    return [header, ...buildReorderSentenceParagraphs(question, mode)];
  }
  if (question.type === "LISTEN_CHOOSE") {
    return [header, ...buildListenChooseParagraphs(question, mode)];
  }

  return null;
}

export function countWordExportableQuestions(questions: ExerciseQuestion[]): {
  exportable: number;
  skipped: number;
  skippedTypeLabels: string[];
} {
  let exportable = 0;
  let skipped = 0;
  const skippedTypes = new Set<string>();

  questions.forEach((q) => {
    if (isWordExportSupported(q.type)) {
      exportable += countLogicalWordQuestions(q);
    } else {
      skipped += 1;
      skippedTypes.add(getQuestionTypeLabel(q));
    }
  });

  return {
    exportable,
    skipped,
    skippedTypeLabels: [...skippedTypes],
  };
}

export async function downloadExerciseSetWord(
  payload: ExerciseSetPayload,
  mode: ExerciseWordExportMode,
  branding?: ExerciseWordExportBranding,
): Promise<ExerciseWordExportResult> {
  const { exportable, skipped, skippedTypeLabels } = countWordExportableQuestions(payload.questions);

  if (exportable === 0) {
    return {
      ok: false,
      exportedCount: 0,
      skippedCount: skipped,
      skippedTypeLabels,
      error: "Không có câu hỏi nào hỗ trợ xuất Word.",
    };
  }

  const children: Paragraph[] = [];
  const title = payload.title?.trim() || "Bài tập";
  const modeLabel = mode === "worksheet" ? "ĐỀ LÀM BÀI" : "ĐÁP ÁN";

  const logoParagraph = await buildLogoLeadParagraph(branding?.logoUrl);
  if (logoParagraph) {
    children.push(logoParagraph);
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 160 },
      children: [new TextRun({ text: title, font: BODY_FONT, size: 32, bold: true })],
    }),
    paragraph(modeLabel, { bold: true, color: "2563EB", spacingAfter: 120 }),
  );

  if (payload.instruction?.trim()) {
    children.push(
      mixedParagraph([
        { text: "Hướng dẫn: ", bold: true },
        { text: payload.instruction.trim() },
      ], 200),
    );
  }

  const counter: WordExportQuestionCounter = { current: 0 };
  payload.questions.forEach((question) => {
    const blocks = buildQuestionParagraphs(question, counter, mode);
    if (!blocks) return;
    children.push(...blocks);
    children.push(paragraph("", { spacingAfter: 200 }));
  });

  const exportedCount = counter.current;

  if (skipped > 0) {
    children.push(
      paragraph(
        `Ghi chú: ${skipped} câu không được xuất (${skippedTypeLabels.join(", ")}). Sẽ bổ sung ở phase sau.`,
        { italics: true, color: "888888", spacingAfter: 0 },
      ),
    );
  }

  const section = await buildDocumentSection(children, branding, {
    applyWatermark: mode === "worksheet",
  });

  const doc = new Document({
    sections: [section],
  });

  const blob = await Packer.toBlob(doc);
  const suffix = mode === "worksheet" ? "de" : "dap_an";
  saveAs(blob, `${slugifyFileName(title)}_${suffix}.docx`);

  return {
    ok: true,
    exportedCount,
    skippedCount: skipped,
    skippedTypeLabels,
  };
}

export type ExamPaperWordExportSection = {
  title?: string;
  instruction?: string;
  payload: ExerciseSetPayload;
};

export function countExamPaperWordExportable(sections: ExamPaperWordExportSection[]): {
  exportable: number;
  skipped: number;
  skippedTypeLabels: string[];
} {
  let exportable = 0;
  let skipped = 0;
  const skippedTypes = new Set<string>();

  sections.forEach((section) => {
    const stats = countWordExportableQuestions(section.payload.questions);
    exportable += stats.exportable;
    skipped += stats.skipped;
    stats.skippedTypeLabels.forEach((label) => skippedTypes.add(label));
  });

  return {
    exportable,
    skipped,
    skippedTypeLabels: [...skippedTypes],
  };
}

/** Xuất cả đề thi (nhiều section) ra một file Word — đề hoặc đáp án. */
export async function downloadExamPaperWord(
  examTitle: string,
  paperInstruction: string | undefined,
  sections: ExamPaperWordExportSection[],
  mode: ExerciseWordExportMode,
  branding?: ExerciseWordExportBranding,
): Promise<ExerciseWordExportResult> {
  const { exportable, skipped, skippedTypeLabels } = countExamPaperWordExportable(sections);

  if (exportable === 0) {
    return {
      ok: false,
      exportedCount: 0,
      skippedCount: skipped,
      skippedTypeLabels,
      error: "Không có câu hỏi nào hỗ trợ xuất Word.",
    };
  }

  const children: Paragraph[] = [];
  const title = examTitle.trim() || "Đề thi";
  const modeLabel = mode === "worksheet" ? "ĐỀ LÀM BÀI" : "ĐÁP ÁN";

  const logoParagraph = await buildLogoLeadParagraph(branding?.logoUrl);
  if (logoParagraph) {
    children.push(logoParagraph);
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 160 },
      children: [new TextRun({ text: title, font: BODY_FONT, size: 32, bold: true })],
    }),
    paragraph(modeLabel, { bold: true, color: "2563EB", spacingAfter: 120 }),
  );

  if (paperInstruction?.trim()) {
    children.push(
      mixedParagraph(
        [
          { text: "Hướng dẫn toàn đề: ", bold: true },
          { text: paperInstruction.trim() },
        ],
        240,
      ),
    );
  }

  const counter: WordExportQuestionCounter = { current: 0 };

  sections.forEach((section, sectionIndex) => {
    const sectionTitle = section.title?.trim() || `Phần ${sectionIndex + 1}`;
    const sectionInstruction = section.instruction?.trim() || section.payload.instruction?.trim();

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 120 },
        children: [new TextRun({ text: sectionTitle, font: BODY_FONT, size: 26, bold: true })],
      }),
    );

    if (sectionInstruction) {
      children.push(
        mixedParagraph([{ text: sectionInstruction, italics: true }], 200),
      );
    }

    section.payload.questions.forEach((question) => {
      const blocks = buildQuestionParagraphs(question, counter, mode);
      if (!blocks) return;
      children.push(...blocks);
      children.push(paragraph("", { spacingAfter: 200 }));
    });
  });

  const exportedCount = counter.current;

  if (skipped > 0) {
    children.push(
      paragraph(
        `Ghi chú: ${skipped} câu không được xuất (${skippedTypeLabels.join(", ")}).`,
        { italics: true, color: "888888", spacingAfter: 0 },
      ),
    );
  }

  const docSection = await buildDocumentSection(children, branding, {
    applyWatermark: mode === "worksheet",
  });

  const doc = new Document({
    sections: [docSection],
  });

  const blob = await Packer.toBlob(doc);
  const suffix = mode === "worksheet" ? "de" : "dap_an";
  saveAs(blob, `${slugifyFileName(title)}_${suffix}.docx`);

  return {
    ok: true,
    exportedCount,
    skippedCount: skipped,
    skippedTypeLabels,
  };
}
