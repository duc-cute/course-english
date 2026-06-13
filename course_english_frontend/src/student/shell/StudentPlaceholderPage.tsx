import { useNavigate } from "react-router-dom";
import { studentRoutePaths } from "../../shared/constants/paths";
import { VqButton, VqCard, VqSpeechBubble } from "../ui";

type StudentPlaceholderPageProps = {
  title: string;
  description: string;
};

export function StudentPlaceholderPage({ title, description }: StudentPlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div className="vq-page">
      <h1 className="vq-page-title">{title}</h1>
      <p className="vq-page-subtitle">{description}</p>
      <div style={{ display: "grid", gap: 24, maxWidth: 480 }}>
        <VqSpeechBubble label="Sắp ra mắt">
          Tính năng này sẽ có ở phase tiếp theo. Bạn vẫn có thể học qua mục Bài học.
        </VqSpeechBubble>
        <VqCard title="Đang xây dựng" tone="primary">
          <p style={{ margin: "0 0 16px" }}>
            Shell Vibrant Scholar (S0 + S1) đã sẵn sàng — UI kit và navigation mới đã được bật.
          </p>
          <VqButton variant="primary" size="md" onClick={() => navigate(studentRoutePaths.lessons)}>
            Xem bài học
          </VqButton>
        </VqCard>
      </div>
    </div>
  );
}
