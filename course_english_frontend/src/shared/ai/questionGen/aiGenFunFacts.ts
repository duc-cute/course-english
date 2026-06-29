/** Category for rotating "Bạn có biết?" cards while AI generates questions. */
export enum AiGenFunFactCategory {
  IDIOM = "IDIOM",
  VOCAB = "VOCAB",
  GRAMMAR = "GRAMMAR",
  TIP = "TIP",
  HISTORY = "HISTORY",
}

export const AI_GEN_FUN_FACT_CATEGORY_LABEL: Record<AiGenFunFactCategory, string> = {
  [AiGenFunFactCategory.IDIOM]: "Thành ngữ",
  [AiGenFunFactCategory.VOCAB]: "Từ vựng",
  [AiGenFunFactCategory.GRAMMAR]: "Ngữ pháp",
  [AiGenFunFactCategory.TIP]: "Mẹo học",
  [AiGenFunFactCategory.HISTORY]: "Lịch sử",
};

export type AiGenFunFact = {
  id: string;
  category: AiGenFunFactCategory;
  text: string;
};

/** Auto-rotate interval for fun-fact carousel (matches design). */
export const AI_GEN_FUN_FACT_ROTATE_MS = 8_000;

export const AI_GEN_FUN_FACTS: AiGenFunFact[] = [
  {
    id: "piece-of-cake",
    category: AiGenFunFactCategory.IDIOM,
    text: 'Cụm "Piece of cake" bắt nguồn từ thế kỷ 19, khi người tham gia cuộc thi được thưởng bánh nếu hoàn thành điệu nhảy — nghĩa là việc rất dễ.',
  },
  {
    id: "break-ice",
    category: AiGenFunFactCategory.IDIOM,
    text: '"Break the ice" xuất phát từ tàu băng phá băng ở cực — tạo lối đi để các tàu khác theo sau, nay dùng để chỉ phá vỡ sự ngượng ngùng.',
  },
  {
    id: "ok-origin",
    category: AiGenFunFactCategory.HISTORY,
    text: 'Từ "OK" có thể bắt nguồn từ "oll korrect" (all correct) — cách viết tắt hài hước phổ biến ở Mỹ thế kỷ 19.',
  },
  {
    id: "vocab-spaced",
    category: AiGenFunFactCategory.TIP,
    text: "Ôn từ vựng theo khoảng cách (spaced repetition) giúp nhớ lâu hơn 200% so với học thuộc một lần — hãy ôn lại sau 1 ngày, 3 ngày, 1 tuần.",
  },
  {
    id: "vocab-context",
    category: AiGenFunFactCategory.VOCAB,
    text: 'Học từ trong ngữ cảnh (câu ví dụ) giúp não bộ gắn nghĩa tốt hơn học từ đơn lẻ — đó là lý do đọc hiểu rất hiệu quả.',
  },
  {
    id: "grammar-third-conditional",
    category: AiGenFunFactCategory.GRAMMAR,
    text: 'Câu điều kiện loại 3 (Third Conditional) dùng cho việc không thể thay đổi quá khứ: "If I had studied harder, I would have passed."',
  },
  {
    id: "tip-shadowing",
    category: AiGenFunFactCategory.TIP,
    text: "Kỹ thuật shadowing — lặp lại ngay sau người bản xứ — cải thiện phát âm và nhịp điệu nhanh hơn chỉ nghe thụ động.",
  },
  {
    id: "vocab-oxford-3000",
    category: AiGenFunFactCategory.VOCAB,
    text: "Oxford 3000 gồm khoảng 3.000 từ cốt lõi — nắm vững chúng bạn đã hiểu ~90% văn bản tiếng Anh hàng ngày.",
  },
  {
    id: "history-shakespeare",
    category: AiGenFunFactCategory.HISTORY,
    text: 'Shakespeare đã đóng góp hơn 1.700 từ và cụm mới vào tiếng Anh — ví dụ "eyeball", "lonely", "generous".',
  },
  {
    id: "tip-pomodoro",
    category: AiGenFunFactCategory.TIP,
    text: "Học 25 phút, nghỉ 5 phút (Pomodoro) giúp não duy trì tập trung — đặc biệt hiệu quả khi luyện ngữ pháp hoặc làm bài tập.",
  },
  {
    id: "idiom-raining-cats",
    category: AiGenFunFactCategory.IDIOM,
    text: '"Raining cats and dogs" có thể liên quan đến mái nhà cỏ ở Anh thời xưa — mèo chó trú tạm trên mái và rơi xuống khi mưa lớn.',
  },
  {
    id: "grammar-present-perfect",
    category: AiGenFunFactCategory.GRAMMAR,
    text: 'Present Perfect (have/has + V3) nối quá khứ với hiện tại — "I have lived here for 5 years" nhấn mạnh kết quả còn liên quan đến bây giờ.',
  },
];

export function pickRandomFunFactIndex(exclude?: number): number {
  if (AI_GEN_FUN_FACTS.length <= 1) return 0;
  let next = Math.floor(Math.random() * AI_GEN_FUN_FACTS.length);
  if (exclude !== undefined && next === exclude) {
    next = (next + 1) % AI_GEN_FUN_FACTS.length;
  }
  return next;
}
