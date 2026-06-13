import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { Link } from "react-router-dom";
import { studentRoutePaths } from "../../shared/constants/paths";
import { VqButton, VqCard } from "../ui";

const LINKS = [
  {
    to: studentRoutePaths.lessons,
    title: "Bài học",
    desc: "Danh sách bài đã publish — có mục lục và tiến độ đọc.",
    icon: <ArticleOutlinedIcon />,
    tone: "primary" as const,
    cta: "Xem bài học",
    enabled: true,
  },
  {
    to: studentRoutePaths.path,
    title: "Lộ trình",
    desc: "Học theo từng unit và môn — bản đồ bài học zigzag.",
    icon: <MapOutlinedIcon />,
    tone: "default" as const,
    cta: "Xem lộ trình",
    enabled: true,
  },
  {
    to: studentRoutePaths.vocab,
    title: "Từ vựng",
    desc: "Flashcard và danh sách từ — ôn theo bộ từ đã publish.",
    icon: <MenuBookOutlinedIcon />,
    tone: "default" as const,
    cta: "Ôn từ vựng",
    enabled: true,
  },
];

export function HomeQuickLinks() {
  return (
    <section className="vq-home-quick">
      {LINKS.map((item) => (
        <VqCard key={item.to} title={item.title} tone={item.tone === "primary" ? "primary" : "default"} className="vq-home-quick__card">
          <div className={`vq-home-quick__icon vq-home-quick__icon--${item.tone}`}>{item.icon}</div>
          <p>{item.desc}</p>
          {item.enabled ? (
            <Link to={item.to} className="vq-home-quick__action">
              <VqButton size="sm">{item.cta}</VqButton>
            </Link>
          ) : (
            <VqButton size="sm" variant="ghost" disabled>
              {item.cta}
            </VqButton>
          )}
        </VqCard>
      ))}
    </section>
  );
}
