import { paths } from "../constants/paths";
import type { UsageGuideContent } from "./usageGuideTypes";

const adminRoot = `/${paths.ADMIN}`;

export const teacherGuideContent: UsageGuideContent = {
  title: "Hướng dẫn dành cho giáo viên",
  subtitle: "Soạn bài học và bài tập tiếng Anh — từ đơn giản đến nâng cao, bạn chọn cách phù hợp nhất.",
  intro:
    "Chào thầy cô! Course English hỗ trợ bốn cách đưa nội dung vào bài học. Bạn có thể bắt đầu với cách dễ nhất, rồi dần dùng thư viện câu hỏi hoặc bộ từ khi đã quen. Dưới đây là lộ trình gợi ý — không bắt buộc phải làm hết một lúc đâu nhé.",
  sections: [
    {
      id: "start",
      emoji: "🌱",
      title: "Bắt đầu: tạo bài học mới",
      summary: "Mỗi bài học gồm phần đọc (Bài học) và phần luyện tập (Bài tập) — bạn có thể có một hoặc cả hai.",
      steps: [
        "Vào Quản lý bài học → bấm Tạo bài học mới, điền tiêu đề, môn học và mô tả ngắn.",
        "Bấm Soạn bài để mở trình soạn — thêm khối nội dung: Văn bản, Hình ảnh, v.v.",
        "Khi đã ổn, đổi trạng thái sang Đã publish để học sinh nhìn thấy trên khu vực học tập.",
      ],
      tip: "Nên publish từng bài nhỏ thay vì chờ soạn hết cả unit — học sinh học dần, bạn cũng nhận phản hồi sớm hơn.",
      link: { label: "Mở Quản lý bài học", to: `${adminRoot}/${paths.MANAGE_LESSON}` },
    },
    {
      id: "manual",
      emoji: "✏️",
      title: "Cách 1 — Soạn bài tập trực tiếp (dễ nhất)",
      summary: "Thêm khối Bài tập (EXERCISE_SET) và nhập từng câu trắc nghiệm bằng form — không cần file Excel hay JSON.",
      steps: [
        "Trong Soạn bài học, bấm + Thêm khối → chọn Bài tập.",
        "Điền tiêu đề khối, hướng dẫn cho học sinh (ví dụ: «Chọn nghĩa tiếng Việt đúng»).",
        "Thêm câu hỏi: câu hỏi tiếng Anh, 4 đáp án, chọn đáp án đúng; có thể thêm giải thích sau khi chấm.",
        "Tuỳ chọn: xáo trộn câu / xáo trộn đáp án, đặt điểm đạt (mặc định 80%).",
        "Lưu bài học — học sinh làm bài ở tab Bài tập.",
      ],
      tip: "Phù hợp khi bài có ít câu (3–10 câu) hoặc bạn muốn chỉnh từng câu rất chi tiết.",
    },
    {
      id: "import",
      emoji: "📥",
      title: "Cách 2 — Import từ Excel / CSV",
      summary: "Đã có sẵn bảng câu hỏi? Tải lên một lần thay vì gõ lại từng câu.",
      steps: [
        "Chuẩn bị file với các cột: câu hỏi (prompt_en), đáp án A–D, đáp án đúng, giải thích (tuỳ chọn).",
        "Trong khối Bài tập, bấm Import CSV hoặc Import Excel.",
        "Xem trước bảng — kiểm tra lỗi từng dòng nếu có.",
        "Chọn Ghi đè hoặc Thêm vào cuối, rồi Lưu bài học.",
      ],
      tip: "Có file mẫu trong hệ thống — tải về, sửa nội dung, import lại là xong.",
    },
    {
      id: "bank",
      emoji: "🏦",
      title: "Cách 3 — Thư viện câu hỏi (dùng lại nhiều bài)",
      summary: "Câu hỏi lưu một chỗ — sửa một lần, mọi bài học dùng chung câu đó đều cập nhật.",
      steps: [
        "Vào Thư viện câu hỏi → thêm câu mới hoặc import CSV/Excel vào ngân hàng.",
        "Trong Soạn bài học, thêm khối Tham chiếu câu hỏi (QUESTION_REF).",
        "Chọn câu từ thư viện — có thể chọn nhiều câu cho một bài.",
        "Lưu và publish. Khi sửa câu trong thư viện, học sinh F5 sẽ thấy nội dung mới.",
      ],
      tip: "Rất tiện khi nhiều bài dùng chung bộ từ (ví dụ «apple», «school») — không phải sửa từng bài một.",
      link: { label: "Mở Thư viện câu hỏi", to: `${adminRoot}/${paths.MANAGE_QUESTIONS}` },
    },
    {
      id: "vocab",
      emoji: "📚",
      title: "Cách 4 — Bộ từ vựng + sinh câu hỏi",
      summary: "Chỉ cần danh sách từ Anh – nghĩa Việt; hệ thống gợi ý câu trắc nghiệm cho bạn.",
      steps: [
        "Vào Bộ từ vựng → tạo bộ mới hoặc import CSV (cột word_en, meaning_vi).",
        "Bấm Sinh MCQ để xem trước câu hỏi tự động (đáp án nhiễu lấy từ cùng bộ từ).",
        "Copy JSON hoặc (sắp có) gắn thẳng vào bài học qua trình soạn.",
        "Dán vào khối Bài tập hoặc tạo khối mới — chỉnh lại nếu cần rồi publish.",
      ],
      tip: "Tiết kiệm thời gian nhất khi bài chủ yếu là từ vựng theo chủ đề (động vật, trường học, gia đình…).",
      link: { label: "Mở Bộ từ vựng", to: `${adminRoot}/${paths.MANAGE_VOCABULARY_SETS}` },
    },
    {
      id: "publish",
      emoji: "🚀",
      title: "Publish và kiểm tra như học sinh",
      summary: "Trước khi giao lớp, nên tự làm thử một vòng như học sinh.",
      steps: [
        "Đảm bảo bài ở trạng thái Đã publish.",
        "Bấm Khu vực học sinh ở menu trái → mở bài vừa tạo.",
        "Đọc tab Bài học, làm tab Bài tập, xem màn kết quả và Xem lại bài làm.",
        "Nếu ổn, giao cho lớp qua Quản lý phân lớp (khi đã cấu hình enrollment).",
      ],
      tip: "Thấy lỗi chính tả hay đáp án sai? Quay lại Soạn bài — học sinh refresh là thấy bản mới.",
      link: { label: "Xem như học sinh", to: `/${paths.STUDENT}/${paths.STUDENT_LESSONS}` },
    },
  ],
};
