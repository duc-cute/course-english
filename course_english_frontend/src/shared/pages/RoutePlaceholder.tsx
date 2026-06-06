import { Link } from "react-router-dom";

type RoutePlaceholderProps = {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
};

export function RoutePlaceholder({
  title,
  description = "Route reserved — integrate from your existing admin/auth source when ready.",
  backTo = "/student",
  backLabel = "Back to gallery",
}: RoutePlaceholderProps) {
  return (
    <div className="route-placeholder">
      <h1>{title}</h1>
      <p>{description}</p>
      <Link to={backTo}>{backLabel}</Link>
    </div>
  );
}
