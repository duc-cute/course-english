import { parseBlockPayload } from "../../../shared/api/lesson";
import type { ExerciseQuestion, ExerciseSetPayload } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseQuestion(raw: unknown): ExerciseQuestion | null {
  if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.type !== "string") {
    return null;
  }

  if (raw.type === "MULTIPLE_CHOICE") {
    const choices = Array.isArray(raw.choices) ? raw.choices : [];
    const parsedChoices = choices
      .filter(isRecord)
      .map((c) => ({
        id: String(c.id ?? ""),
        text: String(c.text ?? ""),
      }))
      .filter((c) => c.id && c.text);

    const prompt = isRecord(raw.prompt)
      ? { text: String(raw.prompt.text ?? ""), lang: raw.prompt.lang ? String(raw.prompt.lang) : undefined }
      : { text: "" };

    if (!prompt.text || !parsedChoices.length || typeof raw.correctChoiceId !== "string") {
      return null;
    }

    return {
      id: raw.id,
      type: "MULTIPLE_CHOICE",
      prompt,
      choices: parsedChoices,
      correctChoiceId: raw.correctChoiceId,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  if (raw.type === "LISTEN_CHOOSE") {
    const audioUrl = typeof raw.audioUrl === "string" ? raw.audioUrl.trim() : "";
    if (!audioUrl) return null;

    const choices = Array.isArray(raw.choices) ? raw.choices : [];
    const parsedChoices = choices
      .filter(isRecord)
      .map((c) => ({
        id: String(c.id ?? ""),
        text: String(c.text ?? ""),
      }))
      .filter((c) => c.id && c.text);

    if (!parsedChoices.length || typeof raw.correctChoiceId !== "string") {
      return null;
    }

    const prompt = isRecord(raw.prompt)
      ? { text: String(raw.prompt.text ?? ""), lang: raw.prompt.lang ? String(raw.prompt.lang) : undefined }
      : { text: "Nghe và chọn nghĩa tiếng Việt đúng", lang: "vi" };

    const audioAccent = raw.audioAccent === "US" ? "US" : raw.audioAccent === "UK" ? "UK" : undefined;

    return {
      id: raw.id,
      type: "LISTEN_CHOOSE",
      audioUrl,
      audioAccent,
      wordEn: typeof raw.wordEn === "string" ? raw.wordEn : undefined,
      prompt,
      choices: parsedChoices,
      correctChoiceId: raw.correctChoiceId,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  if (raw.type === "MATCHING") {
    const pairs = Array.isArray(raw.pairs) ? raw.pairs : [];
    const parsedPairs = pairs
      .filter(isRecord)
      .map((p) => ({ left: String(p.left ?? ""), right: String(p.right ?? "") }))
      .filter((p) => p.left && p.right);

    if (!parsedPairs.length) return null;

    return {
      id: raw.id,
      type: "MATCHING",
      pairs: parsedPairs,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  if (raw.type === "SPELLING") {
    const correctAnswer = typeof raw.correctAnswer === "string" ? raw.correctAnswer.trim() : "";
    if (!correctAnswer) return null;

    const prompt = isRecord(raw.prompt)
      ? { text: String(raw.prompt.text ?? ""), lang: raw.prompt.lang ? String(raw.prompt.lang) : undefined }
      : { text: "" };

    if (!prompt.text.trim() && !correctAnswer) return null;

    return {
      id: raw.id,
      type: "SPELLING",
      prompt: prompt.text.trim() ? prompt : { text: correctAnswer, lang: "en" },
      correctAnswer,
      wordEn: typeof raw.wordEn === "string" ? raw.wordEn : undefined,
      hint: typeof raw.hint === "string" ? raw.hint : undefined,
      caseSensitive: raw.caseSensitive === true,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  if (raw.type === "FILL_BLANK") {
    const prompt = isRecord(raw.prompt)
      ? { text: String(raw.prompt.text ?? ""), lang: raw.prompt.lang ? String(raw.prompt.lang) : undefined }
      : { text: "" };
    if (!prompt.text.trim()) return null;

    const blanksRaw = Array.isArray(raw.blanks) ? raw.blanks : [];
    const blanks = blanksRaw
      .filter(isRecord)
      .map((b, index) => {
        const id = typeof b.id === "string" && b.id.trim() ? b.id.trim() : `b${index + 1}`;
        const acceptedRaw = Array.isArray(b.acceptedAnswers) ? b.acceptedAnswers : [];
        const acceptedAnswers = acceptedRaw.map((a) => String(a ?? "").trim()).filter(Boolean);
        return {
          id,
          acceptedAnswers,
          placeholder: typeof b.placeholder === "string" ? b.placeholder : undefined,
        };
      })
      .filter((b) => b.acceptedAnswers.length > 0);

    if (!blanks.length) return null;

    return {
      id: raw.id,
      type: "FILL_BLANK",
      prompt,
      blanks,
      wordEn: typeof raw.wordEn === "string" ? raw.wordEn : undefined,
      caseSensitive: raw.caseSensitive === true,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  if (raw.type === "GAP_FILL_MCQ") {
    const prompt = isRecord(raw.prompt)
      ? { text: String(raw.prompt.text ?? ""), lang: raw.prompt.lang ? String(raw.prompt.lang) : undefined }
      : { text: "" };
    if (!prompt.text.trim()) return null;

    const blanksRaw = Array.isArray(raw.blanks) ? raw.blanks : [];
    const blanks = blanksRaw
      .filter(isRecord)
      .map((b, index) => {
        const id = typeof b.id === "string" && b.id.trim() ? b.id.trim() : `b${index + 1}`;
        const choicesRaw = Array.isArray(b.choices) ? b.choices : [];
        const choices = choicesRaw
          .filter(isRecord)
          .map((c, ci) => ({
            id: typeof c.id === "string" && c.id.trim() ? c.id.trim() : `a${ci}`,
            text: typeof c.text === "string" ? c.text.trim() : "",
          }))
          .filter((c) => c.text);
        const correctChoiceId =
          typeof b.correctChoiceId === "string" ? b.correctChoiceId.trim() : "";
        return { id, choices, correctChoiceId };
      })
      .filter((b) => b.choices.length >= 2 && b.correctChoiceId);

    if (!blanks.length) return null;

    return {
      id: raw.id,
      type: "GAP_FILL_MCQ",
      prompt,
      blanks,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  if (raw.type === "READING_COMPREHENSION") {
    const passageRaw = isRecord(raw.passage) ? raw.passage : {};
    const passageText = typeof passageRaw.text === "string" ? passageRaw.text.trim() : "";
    if (!passageText) return null;

    const subRaw = Array.isArray(raw.subQuestions) ? raw.subQuestions : [];
    const subQuestions = subRaw
      .filter(isRecord)
      .map((sub, index) => {
        const id = typeof sub.id === "string" && sub.id.trim() ? sub.id.trim() : `sq${index + 1}`;
        const prompt = isRecord(sub.prompt)
          ? {
              text: String(sub.prompt.text ?? "").trim(),
              lang: sub.prompt.lang ? String(sub.prompt.lang) : undefined,
            }
          : { text: "" };
        const choicesRaw = Array.isArray(sub.choices) ? sub.choices : [];
        const choices = choicesRaw
          .filter(isRecord)
          .map((c, ci) => ({
            id: typeof c.id === "string" && c.id.trim() ? c.id.trim() : `a${ci}`,
            text: typeof c.text === "string" ? c.text.trim() : "",
          }))
          .filter((c) => c.text);
        const correctChoiceId =
          typeof sub.correctChoiceId === "string" ? sub.correctChoiceId.trim() : "";
        return {
          id,
          prompt,
          choices,
          correctChoiceId,
          explanation: typeof sub.explanation === "string" ? sub.explanation : undefined,
        };
      })
      .filter((sub) => sub.prompt.text && sub.choices.length >= 2 && sub.correctChoiceId);

    if (!subQuestions.length) return null;

    const presentation =
      raw.presentation === "stepped" || raw.presentation === "split"
        ? raw.presentation
        : "split";

    return {
      id: raw.id,
      type: "READING_COMPREHENSION",
      passage: {
        title: typeof passageRaw.title === "string" ? passageRaw.title.trim() || undefined : undefined,
        text: passageText,
        lang: passageRaw.lang ? String(passageRaw.lang) : undefined,
      },
      subQuestions,
      presentation,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  if (raw.type === "REORDER_SENTENCE") {
    const tokensRaw = Array.isArray(raw.tokens) ? raw.tokens : [];
    const tokens = tokensRaw
      .filter(isRecord)
      .map((t, index) => {
        const id = typeof t.id === "string" && t.id.trim() ? t.id.trim() : `t${index + 1}`;
        const text = typeof t.text === "string" ? t.text.trim() : "";
        return { id, text };
      })
      .filter((t) => t.text);

    if (tokens.length < 3) return null;

    const tokenIds = new Set(tokens.map((t) => t.id));
    const orderRaw = Array.isArray(raw.correctOrder) ? raw.correctOrder : [];
    const correctOrder = orderRaw
      .map((id) => String(id ?? "").trim())
      .filter((id) => tokenIds.has(id));

    const finalOrder =
      correctOrder.length === tokens.length && new Set(correctOrder).size === tokens.length
        ? correctOrder
        : tokens.map((t) => t.id);

    const prompt = isRecord(raw.prompt)
      ? { text: String(raw.prompt.text ?? ""), lang: raw.prompt.lang ? String(raw.prompt.lang) : undefined }
      : undefined;

    return {
      id: raw.id,
      type: "REORDER_SENTENCE",
      prompt: prompt?.text?.trim() ? prompt : { text: "Sắp xếp các mảnh thành câu đúng", lang: "vi" },
      tokens,
      correctOrder: finalOrder,
      sourceSentence: typeof raw.sourceSentence === "string" ? raw.sourceSentence : undefined,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  if (raw.type === "TRUE_FALSE") {
    const prompt = isRecord(raw.prompt)
      ? { text: String(raw.prompt.text ?? ""), lang: raw.prompt.lang ? String(raw.prompt.lang) : undefined }
      : { text: "" };

    if (!prompt.text.trim()) return null;

    let correctAnswer: boolean | null = null;

    if (typeof raw.correctAnswer === "boolean") {
      correctAnswer = raw.correctAnswer;
    } else if (raw.correctAnswer === "true") {
      correctAnswer = true;
    } else if (raw.correctAnswer === "false") {
      correctAnswer = false;
    } else if (raw.correctChoiceId === "true") {
      correctAnswer = true;
    } else if (raw.correctChoiceId === "false") {
      correctAnswer = false;
    } else if (Array.isArray(raw.choices)) {
      const choices = raw.choices.filter(isRecord);
      const correctChoice = choices.find((c) => c.correct === true);
      if (correctChoice) {
        const key = String(correctChoice.id ?? correctChoice.choiceKey ?? "").toLowerCase();
        if (key === "true" || key === "false") {
          correctAnswer = key === "true";
        }
      }
    }

    if (correctAnswer === null) return null;

    return {
      id: raw.id,
      type: "TRUE_FALSE",
      prompt,
      correctAnswer,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  if (raw.type === "LISTEN_TYPE") {
    const audioUrl = typeof raw.audioUrl === "string" ? raw.audioUrl.trim() : "";
    const correctAnswer = typeof raw.correctAnswer === "string" ? raw.correctAnswer.trim() : "";
    if (!audioUrl || !correctAnswer) return null;

    const prompt = isRecord(raw.prompt)
      ? { text: String(raw.prompt.text ?? ""), lang: raw.prompt.lang ? String(raw.prompt.lang) : undefined }
      : { text: "Nghe và gõ từ tiếng Anh", lang: "vi" };

    const audioAccent = raw.audioAccent === "US" ? "US" : raw.audioAccent === "UK" ? "UK" : undefined;

    return {
      id: raw.id,
      type: "LISTEN_TYPE",
      audioUrl,
      audioAccent,
      correctAnswer,
      wordEn: typeof raw.wordEn === "string" ? raw.wordEn : undefined,
      prompt,
      caseSensitive: raw.caseSensitive === true,
      explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
    };
  }

  return null;
}

export function parseExerciseSetPayload(payloadJson?: string): ExerciseSetPayload {
  const raw = parseBlockPayload<Record<string, unknown>>(payloadJson);
  const questionsRaw = Array.isArray(raw.questions) ? raw.questions : [];
  const questions = questionsRaw.map(parseQuestion).filter((q): q is ExerciseQuestion => q !== null);

  return {
    title: typeof raw.title === "string" ? raw.title : undefined,
    instruction: typeof raw.instruction === "string" ? raw.instruction : undefined,
    presentation: raw.presentation === "inline" ? "inline" : "stepped",
    shuffleQuestions: raw.shuffleQuestions === true,
    shuffleOptions: raw.shuffleOptions === true,
    passScorePercent: typeof raw.passScorePercent === "number" ? raw.passScorePercent : undefined,
    questions,
  };
}
