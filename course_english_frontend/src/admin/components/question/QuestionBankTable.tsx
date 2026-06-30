import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, Button, Checkbox, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { useMemo } from "react";
import { AdminCatalogGridTable, type CatalogGridColumn } from "../AdminCatalogGridTable";
import type { QuestionRecord, QuestionStatus } from "../../../shared/api/question";
import { formatRelativeTime } from "../../../shared/ai/aiChatUtils";
import {
  difficultyStars,
  questionTypeLabel,
  skillLabel,
  truncatePrompt,
} from "../../../shared/constants/questionBank";
import { displayQuestionTitle, QUESTION_BANK_EDITABLE_TYPES } from "../../../shared/lesson/questionBankUtils";
import { muBtnSmOutlined } from "../../../pages/admin/manageUserUiStyles";

function statusChip(status?: QuestionStatus) {
  if (status === "PUBLISHED") {
    return <Chip size="small" label="Published" color="success" variant="outlined" />;
  }
  if (status === "ARCHIVED") {
    return <Chip size="small" label="Lưu trữ" variant="outlined" />;
  }
  return <Chip size="small" label="Nháp" variant="outlined" />;
}

type QuestionBankTableProps = {
  rows: QuestionRecord[];
  loading: boolean;
  page: number;
  size: number;
  total: number;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onPagePrev: () => void;
  onPageNext: () => void;
  onEdit: (row: QuestionRecord) => void;
  onDelete: (row: QuestionRecord) => void;
  onPreview: (row: QuestionRecord) => void;
  onExplain?: (row: QuestionRecord) => void;
};

export function QuestionBankTable({
  rows,
  loading,
  page,
  size,
  total,
  selectedIds,
  onSelectionChange,
  onPagePrev,
  onPageNext,
  onEdit,
  onDelete,
  onPreview,
  onExplain,
}: QuestionBankTableProps) {
  const pageIds = rows.map((r) => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const togglePage = () => {
    const next = new Set(selectedIds);
    if (allPageSelected) {
      pageIds.forEach((id) => next.delete(id));
    } else {
      pageIds.forEach((id) => next.add(id));
    }
    onSelectionChange(next);
  };

  const columns = useMemo<CatalogGridColumn<QuestionRecord>[]>(
    () => [
      {
        key: "select",
        header: (
          <Checkbox
            size="small"
            checked={allPageSelected}
            indeterminate={!allPageSelected && somePageSelected}
            onChange={togglePage}
            inputProps={{ "aria-label": "Chọn tất cả trên trang" }}
          />
        ),
        width: "40px",
        mobileRole: "hidden",
        render: (row) => (
          <Checkbox
            size="small"
            checked={selectedIds.has(row.id)}
            onChange={() => toggleRow(row.id)}
            inputProps={{ "aria-label": "Chọn câu" }}
          />
        ),
      },
      {
        key: "stt",
        header: "#",
        width: "48px",
        mobileRole: "hidden",
        className: "catalog-table-muted",
        render: (_row, index) => page * size + index + 1,
      },
      {
        key: "prompt",
        header: "Câu hỏi",
        width: "minmax(180px, 2fr)",
        mobileRole: "title",
        render: (row) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
            <span className="qb-prompt-cell">{truncatePrompt(displayQuestionTitle(row))}</span>
            {row.isAIGenerated ? (
              <Chip
                size="small"
                icon={<AutoAwesomeOutlinedIcon sx={{ fontSize: "14px !important" }} />}
                label="AI"
                color="secondary"
                variant="outlined"
                sx={{ height: 22 }}
              />
            ) : null}
          </Box>
        ),
      },
      {
        key: "cefr",
        header: "CEFR",
        width: "56px",
        mobileRole: "meta",
        className: "qb-muted",
        render: (row) => row.cefrLevel ?? "—",
      },
      {
        key: "skill",
        header: "Kỹ năng",
        width: "88px",
        mobileRole: "meta",
        className: "qb-muted",
        render: (row) => skillLabel(row.skill),
      },
      {
        key: "type",
        header: "Loại",
        width: "100px",
        mobileRole: "inline",
        render: (row) => (
          <Chip size="small" className="qb-type-chip" label={questionTypeLabel(row.questionType)} variant="outlined" />
        ),
      },
      {
        key: "category",
        header: "Danh mục",
        width: "minmax(90px, 1fr)",
        mobileRole: "meta",
        className: "catalog-table-muted",
        render: (row) => row.categoryName ?? "—",
      },
      {
        key: "difficulty",
        header: "Độ khó",
        width: "88px",
        mobileRole: "meta",
        className: "qb-muted",
        render: (row) => difficultyStars(row.difficulty),
      },
      {
        key: "status",
        header: "Trạng thái",
        width: "100px",
        mobileRole: "inline",
        render: (row) => statusChip(row.status),
      },
      {
        key: "updatedAt",
        header: "Cập nhật",
        width: "100px",
        mobileRole: "meta",
        className: "qb-muted",
        render: (row) => formatRelativeTime(row.updatedAt ?? row.createdAt),
      },
      {
        key: "actions",
        header: "Thao tác",
        width: "148px",
        align: "center",
        mobileRole: "actions",
        render: (row) => (
          <>
            <Tooltip title="Preview">
              <IconButton size="small" color="primary" onClick={() => onPreview(row)}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {onExplain && QUESTION_BANK_EDITABLE_TYPES.includes(row.questionType) ? (
              <Tooltip title="AI giải thích (VI)">
                <IconButton size="small" color="secondary" onClick={() => onExplain(row)}>
                  <AutoAwesomeOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
            <Tooltip title="Sửa">
              <IconButton size="small" color="primary" onClick={() => onEdit(row)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa">
              <IconButton size="small" color="error" onClick={() => onDelete(row)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    [
      page,
      size,
      allPageSelected,
      somePageSelected,
      selectedIds,
      onEdit,
      onDelete,
      onPreview,
      onExplain,
    ],
  );

  return (
    <Box className="admin-catalog-page__table-card">
      <AdminCatalogGridTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="Chưa có câu hỏi trong ngân hàng."
        getRowKey={(row) => row.id}
      />
      <Box className="admin-catalog-page__table-footer">
        <Typography variant="body2" className="admin-catalog-page__table-footer-total">
          Tổng: {total}
        </Typography>
        <Box className="admin-catalog-page__table-footer-controls">
          <Button variant="outlined" sx={muBtnSmOutlined} size="small" disabled={page <= 0} onClick={onPagePrev}>
            Trang trước
          </Button>
          <Button
            variant="outlined"
            sx={muBtnSmOutlined}
            size="small"
            disabled={(page + 1) * size >= total}
            onClick={onPageNext}
          >
            Trang sau
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
