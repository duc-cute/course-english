import { paths } from "../constants/paths";
import type { UsageGuideContent } from "./usageGuideTypes";

const studentRoot = `/${paths.STUDENT}`;

export const studentGuideContent: UsageGuideContent = {
  title: "Hướng dẫn học trên Course English",
  subtitle: "Đọc bài, làm bài tập và theo dõi tiến độ — làm từng bước nhỏ, không cần vội.",
  intro:
    "Chào bạn! Đây là nơi bạn học tiếng Anh theo từng bài: đọc nội dung, làm trắc nghiệm, xem kết quả và chuyển sang bài tiếp theo. Nếu lần đầu vào, cứ bắt đầu từ Bài học trong menu bên trái nhé.",
  sections: [
    {
      id: "home",
      emoji: "🏠",
      title: "Trang chủ — tiếp tục chỗ đang học dở",
      summary: "Hệ thống nhớ bài bạn đọc dở để bạn không phải tìm lại từ đầu.",
      steps: [
        "Mở Trang chủ sau khi đăng nhập.",
        "Nếu có thẻ Tiếp tục học, bấm vào để nhảy đúng vị trí bạn dừng lại lần trước.",
        "Không thấy thẻ? Vào Bài học và chọn bài trong danh sách.",
      ],
      tip: "Đọc dở giữa chừng cũng không sao — quay lại bất cứ lúc nào, tiến độ vẫn được lưu trên máy bạn.",
      link: { label: "Về Trang chủ", to: studentRoot },
    },
    {
      id: "lessons",
      emoji: "📖",
      title: "Danh sách bài học",
      summary: "Chỉ hiện các bài giáo viên đã publish — bạn chọn bài theo môn hoặc tìm theo tên.",
      steps: [
        "Vào Bài học trên menu trái.",
        "Dùng ô tìm kiếm nếu danh sách dài.",
        "Bấm vào một bài để bắt đầu học.",
      ],
      link: { label: "Mở danh sách bài học", to: `${studentRoot}/${paths.STUDENT_LESSONS}` },
    },
    {
      id: "study",
      emoji: "📝",
      title: "Tab Bài học — đọc và theo mục lục",
      summary: "Phần nội dung chính: văn bản, hình ảnh… Cuộn xuống hoặc bấm mục lục bên trái để nhảy nhanh.",
      steps: [
        "Mở một bài → mặc định ở tab Bài học (nếu bài có phần đọc).",
        "Mục lục bên trái (màn hình rộng) cho biết bạn đang ở đoạn nào.",
        "Bấm Chế độ tập trung nếu muốn ẩn menu, chỉ còn nội dung.",
        "Đọc xong, kéo xuống cuối — có thể thấy gợi ý Bài tiếp theo.",
      ],
      tip: "Nên đọc hết tab Bài học trước khi làm Bài tập — bạn sẽ nhớ từ và làm bài dễ hơn.",
    },
    {
      id: "practice",
      emoji: "✅",
      title: "Tab Bài tập — làm trắc nghiệm từng câu",
      summary: "Mỗi câu làm một lượt: chọn đáp án → Kiểm tra → xem đúng/sai → Giải thích (nếu có) → Làm tiếp.",
      steps: [
        "Chuyển sang tab Bài tập (nếu bài có bài tập).",
        "Chọn một đáp án rồi bấm KIỂM TRA — đáp án đúng/sai sẽ được tô màu.",
        "Bấm GIẢI THÍCH để xem gợi ý từ giáo viên (khi có).",
        "Bấm LÀM TIẾP cho đến câu cuối, rồi XEM KẾT QUẢ.",
        "Cần đạt tỷ lệ đúng theo yêu cầu (thường 80%) để «qua» bài tập.",
      ],
      tip: "Lỡ tắt trình duyệt giữa chừng? Mở lại bài — hệ thống nhớ câu bạn đang làm (trên cùng máy).",
    },
    {
      id: "result",
      emoji: "🎉",
      title: "Màn kết quả — xem điểm và học tiếp",
      summary: "Sau khi làm xong, bạn thấy số câu đúng, thời gian và lời động viên từ «cô giáo» ảo.",
      steps: [
        "Xem thống kê bên trái: câu đúng, câu sai, điểm phần trăm.",
        "Xem lại bài làm — ôn từng câu, đáp án bạn chọn và đáp án đúng.",
        "Làm lại nếu muốn cải thiện điểm (câu hỏi có thể được xáo trộn lại).",
        "Bấm Bài tiếp theo để sang bài kế trong cùng môn.",
      ],
      tip: "Chưa đạt điểm? Đừng buồn — xem lại bài làm, đọc lại tab Bài học rồi Làm lại nhé!",
    },
    {
      id: "tips",
      emoji: "💡",
      title: "Mẹo học hiệu quả",
      summary: "Vài thói quen nhỏ giúp bạn tiến bộ đều mỗi ngày.",
      steps: [
        "Học 15–20 phút mỗi ngày thay vì «ôm» nhiều bài một lúc.",
        "Đọc to câu tiếng Anh trong tab Bài học — giúp nhớ phát âm.",
        "Sau khi làm sai, đọc Giải thích và ghi từ khó vào sổ tay.",
        "Hoàn thành bài tập rồi chuyển Bài tiếp theo — giữ nhịp học liên tục.",
      ],
      tip: "Học tiếng Anh giống leo cầu thang — mỗi bài hoàn thành là thêm một bậc. Cố lên nhé! 🌟",
    },
  ],
};
