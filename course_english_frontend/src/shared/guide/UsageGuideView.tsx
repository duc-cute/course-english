import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";
import type { UsageGuideContent } from "./usageGuideTypes";

type UsageGuideViewProps = {
  variant: "teacher" | "student";
  content: UsageGuideContent;
};

export function UsageGuideView({ variant, content }: UsageGuideViewProps) {
  return (
    <div className={`usage-guide usage-guide--${variant}`}>
      <header className="usage-guide-hero">
        <h1 className="usage-guide-title">{content.title}</h1>
        <p className="usage-guide-subtitle">{content.subtitle}</p>
        <p className="usage-guide-intro">{content.intro}</p>
      </header>

      <div className="usage-guide-sections">
        {content.sections.map((section, index) => (
          <article key={section.id} className="usage-guide-section">
            <div className="usage-guide-section-head">
              <span className="usage-guide-section-emoji" aria-hidden>
                {section.emoji}
              </span>
              <div>
                <span className="usage-guide-section-num">Bước {index + 1}</span>
                <h2 className="usage-guide-section-title">{section.title}</h2>
              </div>
            </div>

            <p className="usage-guide-section-summary">{section.summary}</p>

            <ol className="usage-guide-steps">
              {section.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            {section.tip ? (
              <aside className="usage-guide-tip">
                <span className="usage-guide-tip-label">Mẹo nhỏ</span>
                <p>{section.tip}</p>
              </aside>
            ) : null}

            {section.link ? (
              <Link className="usage-guide-link" to={section.link.to}>
                {section.link.label}
                <ArrowForwardIcon sx={{ fontSize: 18 }} />
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
