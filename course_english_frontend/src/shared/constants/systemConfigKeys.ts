export type SystemConfigValueType = "boolean" | "select" | "text" | "image_url";

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
  /** Cho phép lưu giá trị rỗng */
  optional?: boolean;
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
    key: "VOCABULARY_PRACTICE_MAX_QUESTIONS",
    label: "Số câu luyện từ vựng (tối đa)",
    type: "text",
    defaultValue: "16",
    defaultNote: "Số câu tối đa mỗi session luyện từ vựng (1–40, mặc định 16)",
  },
  {
    key: "VOCABULARY_PRACTICE_PASS_SCORE",
    label: "Ngưỡng đạt luyện từ vựng (%)",
    type: "text",
    defaultValue: "80",
    defaultNote: "Ngưỡng đạt (%) luyện từ vựng (1–100, mặc định 80)",
  },
  {
    key: "STUDENT_SELF_REGISTRATION_ENABLED",
    label: "Tự đăng ký học sinh",
    type: "boolean",
    defaultValue: "true",
    defaultNote: "Cho phép học sinh tự đăng ký tài khoản (true/1=bật)",
  },
   {
    key: "NOTIFICATION_EMAIL_ENABLED",
    label: "Gửi email thông báo",
    type: "boolean",
    defaultValue: "true",
    defaultNote: "Cho phép gửi email thông báo (true/1=bật)",
  },
  {
    key: "BRAND_NAME",
    label: "Tên thương hiệu",
    type: "text",
    defaultValue: "MT English",
    defaultNote: "Tên thương hiệu hiển thị trên app, email và thông báo",
  },
  {
    key: "WORD_EXPORT_LOGO_URL",
    label: "Logo xuất Word bài tập",
    type: "image_url",
    defaultValue: "",
    defaultNote: "Logo hiển thị đầu trang 1 file Word (PNG/JPG, để trống = không logo)",
    optional: true,
  },
  {
    key: "WORD_EXPORT_WATERMARK_TEXT",
    label: "Watermark xuất Word (đề)",
    type: "text",
    defaultValue: "",
    defaultNote: "Chữ watermark in chìm trên file đề Word (vd: Ms Mitra). Để trống = không watermark",
    optional: true,
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

/** Nhãn ngắn cho validate / sinh bài nghe LISTEN_CHOOSE */
export function vocabularyAudioAccentListenLabel(accent: VocabularyAudioAccent): string {
  if (accent === "US") return "US";
  if (accent === "BOTH") return "UK hoặc US";
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
  if (meta?.type === "image_url") {
    const url = (configValue ?? "").trim();
    return url ? "Đã có logo" : "Chưa có";
  }
  return configValue ?? "—";
}
