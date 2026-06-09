export type SystemConfigValueType = "boolean" | "select" | "text";

export type SystemConfigSelectOption = {
  value: string;
  label: string;
};

export type SystemConfigKeyMeta = {
  key: string;
  label: string;
  type: SystemConfigValueType;
  defaultValue: string;
  defaultNote: string;
  options?: SystemConfigSelectOption[];
};

export type VocabularyAudioAccent = "UK" | "US" | "BOTH";

export const VOCABULARY_AUDIO_ACCENT_OPTIONS: SystemConfigSelectOption[] = [
  { value: "UK", label: "Chỉ UK (British English)" },
  { value: "US", label: "Chỉ US (American English)" },
  { value: "BOTH", label: "Cả UK và US" },
];

export const SYSTEM_CONFIG_KEY_OPTIONS: SystemConfigKeyMeta[] = [
  {
    key: "DICTIONARY_ENRICH_ENABLED",
    label: "Bật enrich từ điển",
    type: "boolean",
    defaultValue: "true",
    defaultNote: "Bật tra cứu Free Dictionary khi enrich từ vựng (true/1=bật, false/0=tắt)",
  },
  {
    key: "VOCABULARY_AUDIO_ENABLED",
    label: "Nút phát âm từ vựng (HS)",
    type: "boolean",
    defaultValue: "true",
    defaultNote: "Hiển thị nút phát âm cho học sinh (true/1=bật)",
  },
  {
    key: "VOCABULARY_AUDIO_ACCENT",
    label: "Giọng phát âm từ vựng (HS)",
    type: "select",
    defaultValue: "UK",
    defaultNote: "Giọng phát âm hiển thị cho học sinh — GV thường chỉ dạy UK",
    options: VOCABULARY_AUDIO_ACCENT_OPTIONS,
  },
  {
    key: "STUDENT_SELF_REGISTRATION_ENABLED",
    label: "Tự đăng ký học sinh",
    type: "boolean",
    defaultValue: "true",
    defaultNote: "Cho phép học sinh tự đăng ký tài khoản (true/1=bật)",
  },
];

export const BOOLEAN_CONFIG_OPTIONS = [
  { value: "true", label: "Bật (true)" },
  { value: "false", label: "Tắt (false)" },
];

export function findSystemConfigMeta(configKey?: string): SystemConfigKeyMeta | undefined {
  if (!configKey) return undefined;
  const normalized = configKey.trim().toUpperCase();
  return SYSTEM_CONFIG_KEY_OPTIONS.find((item) => item.key === normalized);
}

export function normalizeVocabularyAudioAccent(value?: string): VocabularyAudioAccent {
  const normalized = (value ?? "UK").trim().toUpperCase();
  if (normalized === "US" || normalized === "BOTH") return normalized;
  return "UK";
}

export function formatConfigDisplayValue(configKey?: string, configValue?: string): string {
  const meta = findSystemConfigMeta(configKey);
  if (meta?.type === "boolean") {
    const normalized = (configValue ?? "").trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return "Bật";
    if (normalized === "false" || normalized === "0") return "Tắt";
  }
  if (meta?.type === "select" && meta.options) {
    const match = meta.options.find((item) => item.value === (configValue ?? "").trim().toUpperCase());
    if (match) return match.label;
  }
  return configValue ?? "—";
}
