/**
 * Derive stable key for merge import — instruction-first (đề không bắt buộc có I/II).
 */
export function deriveSectionImportKey(parts: {
  sectionKey?: string;
  sectionTitle?: string;
  sectionInstruction?: string;
  questionType?: string;
  fallbackOrder?: number;
}): string {
  const explicit = parts.sectionKey?.trim();
  if (explicit) return explicit.toLowerCase();

  const instruction = parts.sectionInstruction?.trim();
  if (instruction) {
    return slugify(instruction).slice(0, 120);
  }

  const title = parts.sectionTitle?.trim();
  if (title) {
    return slugify(title).slice(0, 120);
  }

  const type = parts.questionType?.trim();
  if (type) {
    return `type_${type.toLowerCase()}_${parts.fallbackOrder ?? 0}`;
  }

  return `section_${parts.fallbackOrder ?? 0}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
