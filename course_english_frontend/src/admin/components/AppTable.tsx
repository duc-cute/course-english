import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

export type AppTableColumn = {
  key: string;
  title: string;
  align?: "left" | "right" | "center";
  width?: number | string;
};

type AppTableProps<T> = {
  columns: AppTableColumn[];
  rows: T[];
  loading?: boolean;
  skeletonRows?: number;
  emptyText?: string;
  emptyContent?: ReactNode;
  rowKey?: keyof T | ((row: T) => string | number);
  renderRow: (row: T, index: number) => ReactNode;
  paper?: boolean;
};

export function AppTable<T extends Record<string, unknown>>({
  columns,
  rows,
  loading = false,
  skeletonRows = 5,
  emptyText = "Không có dữ liệu",
  emptyContent,
  rowKey = "id" as keyof T,
  renderRow,
  paper = true,
}: AppTableProps<T>) {
  const tableContent = (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ background: "linear-gradient(180deg, #f9fbff 0%, #f3f7ff 100%)" }}>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                align={col.align || "left"}
                width={col.width}
                sx={{
                  fontWeight: 700,
                  color: "#2f3a4f",
                  py: 1.25,
                  fontSize: 12,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #e8edf5",
                }}
              >
                {col.title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, rowIdx) => (
              <TableRow key={`skeleton-${rowIdx}`}>
                {columns.map((col) => (
                  <TableCell key={col.key} sx={{ py: 1.25, borderBottom: "1px solid #eef2f8" }}>
                    <Skeleton variant="rounded" height={col.key === "actions" ? 28 : 20} width={col.key === "actions" ? 72 : "72%"} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length || 1} sx={{ py: 0, border: 0 }}>
                {emptyContent ?? (
                  <Box py={4} textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      {emptyText}
                    </Typography>
                  </Box>
                )}
              </TableCell>
            </TableRow>
          ) : (
              rows.map((row, idx) => {
                const key =
                  typeof rowKey === "function"
                    ? rowKey(row)
                    : (row[rowKey] as string | number | undefined) ?? idx;
                return (
                  <TableRow
                    key={key}
                    hover
                    sx={{
                      "&:nth-of-type(even)": { backgroundColor: "#fbfcff" },
                      "& td": {
                        borderBottom: "1px solid #eef2f8",
                        color: "#31415f",
                        py: 0.7,
                        fontSize: 13,
                      },
                    }}
                  >
                    {renderRow(row, idx)}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
  );

  if (!paper) {
    return tableContent;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #e8edf5",
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      {tableContent}
    </Paper>
  );
}
