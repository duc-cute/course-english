import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import TollOutlinedIcon from "@mui/icons-material/TollOutlined";
import { getStudentDisplayName } from "../shared/auth/getStudentDisplayName";
import { VqSpeechBubble } from "../ui";
import { HomeMascot } from "./HomeMascot";

type HomeHeroProps = {
  weeklyStreakCount: number;
  xp: number;
};

export function HomeHero({ weeklyStreakCount, xp }: HomeHeroProps) {
  const name = getStudentDisplayName();
  const greeting = name === "bạn" ? "Chào bạn!" : `Chào ${name}!`;

  return (
    <section className="vq-home-hero">
      <div className="vq-home-hero__main">
        <VqSpeechBubble title={greeting}>
          Sẵn sàng cho nhiệm vụ hôm nay chưa? Học bài, làm bài tập và giữ streak mỗi ngày nhé!
        </VqSpeechBubble>
        <HomeMascot />
      </div>
      <div className="vq-home-hero__stats">
        <div className="vq-home-stat vq-home-stat--streak">
          <LocalFireDepartmentOutlinedIcon className="vq-home-stat__icon" />
          <span className="vq-home-stat__value">{weeklyStreakCount > 0 ? weeklyStreakCount : "—"}</span>
          <span className="vq-home-stat__label">Ngày tuần này</span>
        </div>
        <div className="vq-home-stat vq-home-stat--xp">
          <TollOutlinedIcon className="vq-home-stat__icon" />
          <span className="vq-home-stat__value">{xp > 0 ? xp : "—"}</span>
          <span className="vq-home-stat__label">Tổng XP</span>
        </div>
      </div>
    </section>
  );
}
