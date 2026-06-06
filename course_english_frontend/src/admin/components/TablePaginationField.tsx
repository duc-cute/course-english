import { TablePagination, type TablePaginationProps } from "@mui/material";

export function TablePaginationField(props: TablePaginationProps) {
  return <TablePagination component="div" {...props} />;
}
