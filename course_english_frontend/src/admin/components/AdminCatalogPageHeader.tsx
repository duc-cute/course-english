import type { ReactNode } from "react";

type AdminCatalogPageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  icon: ReactNode;
  action?: ReactNode;
};

export function AdminCatalogPageHeader({ title, subtitle, icon, action }: AdminCatalogPageHeaderProps) {
  return (
    <header className="admin-catalog-page__header">
      <div className="admin-catalog-page__title-row">
        <div className="admin-catalog-page__title-icon" aria-hidden>
          {icon}
        </div>
        <div>
          <h1 className="admin-catalog-page__title">{title}</h1>
          {subtitle ? <p className="admin-catalog-page__subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="admin-catalog-page__header-action">{action}</div> : null}
    </header>
  );
}
