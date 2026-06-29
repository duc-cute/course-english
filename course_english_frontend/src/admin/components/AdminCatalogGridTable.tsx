import { Box, Skeleton } from "@mui/material";
import type { ReactNode } from "react";

export type CatalogGridMobileRole = "hidden" | "title" | "subtitle" | "meta" | "inline" | "actions";

export type CatalogGridColumn<T> = {
  key: string;
  header: string;
  width: string;
  align?: "left" | "center" | "right";
  /** Desktop grid + mobile card layout slot. Defaults: actions → actions, else meta */
  mobileRole?: CatalogGridMobileRole;
  className?: string;
  render: (row: T, index: number) => ReactNode;
};

type AdminCatalogGridTableProps<T> = {
  columns: CatalogGridColumn<T>[];
  rows: T[];
  loading?: boolean;
  skeletonRows?: number;
  emptyText?: string;
  emptyContent?: ReactNode;
  getRowKey: (row: T, index: number) => string | number;
};

function resolveMobileRole(column: CatalogGridColumn<unknown>): CatalogGridMobileRole {
  if (column.mobileRole) return column.mobileRole;
  if (column.key === "actions") return "actions";
  return "meta";
}

export function AdminCatalogGridTable<T>({
  columns,
  rows,
  loading = false,
  skeletonRows = 3,
  emptyText = "Không có dữ liệu.",
  emptyContent,
  getRowKey,
}: AdminCatalogGridTableProps<T>) {
  const gridTemplate = columns.map((col) => col.width).join(" ");
  const gridSx = { display: "grid", gridTemplateColumns: gridTemplate, columnGap: 1.5 };

  if (loading) {
    return (
      <Box className="catalog-grid-table__loading">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Box key={`sk-${i}`} className="catalog-grid-table__skeleton-row">
            <Skeleton height={20} width="55%" sx={{ mb: 1 }} />
            <Skeleton height={16} width="40%" />
          </Box>
        ))}
      </Box>
    );
  }

  if (rows.length === 0) {
    return emptyContent ?? <Box className="admin-catalog-page__empty">{emptyText}</Box>;
  }

  return (
    <Box className="catalog-grid-table">
      <Box className="catalog-table-head catalog-grid-table__head" sx={gridSx}>
        {columns.map((col) => (
          <Box
            key={col.key}
            sx={{
              textAlign: col.align === "center" ? "center" : col.align === "right" ? "right" : "left",
            }}
          >
            {col.header}
          </Box>
        ))}
      </Box>

      <Box className="catalog-grid-table__body">
        {rows.map((row, index) => (
          <Box key={getRowKey(row, index)} className="catalog-table-row catalog-grid-table__row" sx={gridSx}>
            {columns.map((col) => {
              const mobileRole = resolveMobileRole(col as CatalogGridColumn<unknown>);
              const cellClass = [
                "catalog-grid-table__cell",
                `catalog-grid-table__cell--${mobileRole}`,
                col.className,
                mobileRole === "actions" ? "catalog-table-actions" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <Box
                  key={col.key}
                  className={cellClass}
                  data-label={col.header}
                  sx={{
                    textAlign: col.align === "center" ? "center" : col.align === "right" ? "right" : "left",
                    ...(mobileRole === "title" ? { fontWeight: 600, color: "#0C447C" } : {}),
                  }}
                >
                  {col.render(row, index)}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
