import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";

type ProgressMilestonesPanelProps = {
  progress: number; // 0 to 1
  theme: string;
};

type MilestoneDetail = {
  percent: number;
  title: string;
  desc: string;
  icon: string;
};

const MILESTONE_THEMES: Record<
  string,
  {
    m25: { title: string; desc: string; icon: string };
    m50: { title: string; desc: string; icon: string };
    m75: { title: string; desc: string; icon: string };
    m100: { title: string; desc: string; icon: string };
  }
> = {
  ocean: {
    m25: { title: "Bãi cát mịn", desc: "Bạn đã khám phá được gần một phần tư câu chuyện!", icon: "🏖️" },
    m50: { title: "Vỏ sò biển", desc: "Bạn đang đi đúng hướng, tiếp tục nhặt vỏ sò nhé!", icon: "🐚" },
    m75: { title: "Cơn sóng xanh", desc: "Gần tới đích rồi, những con sóng đang nâng bước chân bạn!", icon: "🌊" },
    m100: { title: "Báu vật đại dương", desc: "Chúc mừng! Bạn đã tìm thấy vương miện báu vật đại dương!", icon: "👑" },
  },
  forest: {
    m25: { title: "Lối mòn nhỏ", desc: "Bạn bắt đầu đi vào bìa rừng ngập tràn tiếng chim hót!", icon: "🌱" },
    m50: { title: "Chú nấm nhỏ", desc: "Bạn vượt qua nửa chặng đường và tìm thấy nấm may mắn!", icon: "🍄" },
    m75: { title: "Đom đóm sáng", desc: "Gần tới đích rồi, đom đóm đang thắp sáng dẫn đường!", icon: "✨" },
    m100: { title: "Nhà gỗ ấm áp", desc: "Chúc mừng! Bạn đã tới đích tại ngôi nhà ấm cúng giữa rừng xanh!", icon: "🏡" },
  },
  night: {
    m25: { title: "Trăng khuyết", desc: "Trăng khuyết soi sáng chặng hành trình đầu tiên của bạn!", icon: "🌙" },
    m50: { title: "Sao lấp lánh", desc: "Ngôi sao nhỏ dẫn lối cho bạn vượt qua đêm tối mát mẻ!", icon: "⭐" },
    m75: { title: "Sao băng ước nguyện", desc: "Sao băng vụt qua mang theo ước mơ hoàn thành câu chuyện!", icon: "☄️" },
    m100: { title: "Sao trời rực rỡ", desc: "Chúc mừng! Bạn đã kết thúc hành trình dưới bầu trời đêm!", icon: "🌟" },
  },
  snow: {
    m25: { title: "Bông tuyết trắng", desc: "Tuyết rơi nhẹ nhàng chào đón bước chân đầu tiên của bạn!", icon: "❄️" },
    m50: { title: "Trượt tuyết", desc: "Vượt qua nửa câu chuyện cực kỳ mượt mà như trượt tuyết!", icon: "🎿" },
    m75: { title: "Lâu đài tuyết", desc: "Gần tới đích rồi, lâu đài tuyết lấp lánh đã hiện ra trước mắt!", icon: "🏰" },
    m100: { title: "Người tuyết vui vẻ", desc: "Chúc mừng! Bạn đã hoàn thành câu chuyện và dựng xong người tuyết!", icon: "⛄" },
  },
  autumn: {
    m25: { title: "Lá vàng rơi", desc: "Bắt đầu chuyến dạo chơi lãng mạn dưới rừng lá phong!", icon: "🍁" },
    m50: { title: "Quả thông nhỏ", desc: "Bạn nhặt được quả thông vàng may mắn ở giữa khu rừng!", icon: "🌲" },
    m75: { title: "Hạt dẻ ấm", desc: "Hương thơm hạt dẻ rang lan tỏa, vạch đích đã ở rất gần!", icon: "🌰" },
    m100: { title: "Nhà gỗ mùa thu", desc: "Chúc mừng! Bạn đã hoàn thành câu chuyện bên tách trà ấm!", icon: "🏡" },
  },
  fantasy: {
    m25: { title: "Sách thần kỳ", desc: "Cuốn sách mở ra thế giới phép thuật huyền bí chặng đầu!", icon: "📖" },
    m50: { title: "Đũa phép thuật", desc: "Một nửa chặng đường đã qua nhờ phép thuật kỳ diệu hỗ trợ!", icon: "🪄" },
    m75: { title: "Kỳ lân bạc", desc: "Kỳ lân dẫn đường giúp bạn tiến thật nhanh tới đích!", icon: "🦄" },
    m100: { title: "Lâu đài phép thuật", desc: "Chúc mừng! Bạn đã hoàn thành và mở khóa cánh cổng lâu đài!", icon: "🏰" },
  },
  space: {
    m25: { title: "Tàu vũ trụ", desc: "Khởi động động cơ và bay vào khoảng không vô tận!", icon: "🚀" },
    m50: { title: "Hành tinh đỏ", desc: "Đổ bộ lên nửa chặng đường tại hành tinh đỏ kỳ bí!", icon: "🪐" },
    m75: { title: "Hố đen kỳ bí", desc: "Gia tốc vượt qua hố đen vũ trụ để tiếp cận đích đến!", icon: "🕳️" },
    m100: { title: "Thiên hà rực rỡ", desc: "Chúc mừng! Bạn đã chinh phục dải ngân hà bao la!", icon: "🌌" },
  },
};

export function ProgressMilestonesPanel({ progress, theme }: ProgressMilestonesPanelProps) {
  const normTheme = theme.toLowerCase();
  const spec = MILESTONE_THEMES[normTheme] ?? MILESTONE_THEMES.ocean;

  const milestones: MilestoneDetail[] = [
    { percent: 25, ...spec.m25 },
    { percent: 50, ...spec.m50 },
    { percent: 75, ...spec.m75 },
    { percent: 100, ...spec.m100 },
  ];

  return (
    <div className="milestones-tab-container">
      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 12px", color: "var(--theme-text)" }}>
        Kỷ niệm hành trình
      </h3>
      {milestones.map((m) => {
        const isUnlocked = progress * 100 >= m.percent;
        return (
          <div
            key={m.percent}
            className={`milestone-card ${isUnlocked ? "milestone-card--unlocked" : ""}`}
          >
            <div className="milestone-card__icon-box">
              <span style={{ fontSize: "1.4rem" }}>{m.icon}</span>
            </div>

            <div className="milestone-card__info">
              <span className="milestone-card__title">
                {m.title} ({m.percent}%)
              </span>
              <span className="milestone-card__desc">{m.desc}</span>
            </div>

            <div className="milestone-card__badge">
              {isUnlocked ? (
                <CheckCircleIcon sx={{ fontSize: 16 }} />
              ) : (
                <LockIcon sx={{ fontSize: 14 }} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
