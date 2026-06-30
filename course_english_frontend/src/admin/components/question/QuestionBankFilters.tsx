import { Box, MenuItem, TextField } from "@mui/material";
import { AdminCatalogToolbar } from "../AdminCatalogToolbar";
import type { QuestionCategoryRecord } from "../../../shared/api/question";
import {
  QUESTION_CEFR_OPTIONS,
  QUESTION_DIFFICULTY_OPTIONS,
  QUESTION_SKILLS,
  QUESTION_SOURCE_OPTIONS,
  QUESTION_SORT_OPTIONS,
  QUESTION_STATUS_OPTIONS,
  QUESTION_TYPE_FILTER_OPTIONS,
  type QuestionSortOption,
} from "../../../shared/constants/questionBank";
import {
  muSelectAllowEmpty,
  muSelectFilterInputLabelProps,
  muTextFieldSx,
} from "../../../pages/admin/manageUserUiStyles";

export type QuestionBankFilterState = {
  searchInput: string;
  filterCategoryId: string;
  filterStatus: string;
  filterQuestionType: string;
  filterDifficulty: string;
  filterCefrLevel: string;
  filterSkill: string;
  filterTopic: string;
  filterSource: string;
  sortBy: QuestionSortOption;
};

type QuestionBankFiltersProps = {
  categories: QuestionCategoryRecord[];
  filters: QuestionBankFilterState;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  onFilterChange: <K extends keyof QuestionBankFilterState>(key: K, value: QuestionBankFilterState[K]) => void;
};

export function QuestionBankFilters({
  categories,
  filters,
  onSearchInputChange,
  onSearch,
  onReset,
  onFilterChange,
}: QuestionBankFiltersProps) {
  return (
    <Box className="admin-catalog-page__filter-card admin-catalog-page__toolbar-wrap">
      <AdminCatalogToolbar
        searchPlaceholder="Tìm: environment B1, grammar passive voice, animals vocabulary…"
        searchInput={filters.searchInput}
        onSearchInputChange={onSearchInputChange}
        onSearch={onSearch}
        onReset={onReset}
        toolbarVariant="soft"
        extraFilters={
          <>
            <TextField
              select
              size="small"
              label="Loại câu"
              value={filters.filterQuestionType}
              onChange={(e) => onFilterChange("filterQuestionType", e.target.value)}
              SelectProps={muSelectAllowEmpty}
              InputLabelProps={muSelectFilterInputLabelProps}
              className="admin-catalog-soft-filter__field"
              sx={{ ...muTextFieldSx, minWidth: 148 }}
            >
              {QUESTION_TYPE_FILTER_OPTIONS.map((o) => (
                <MenuItem key={o.value || "all"} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Danh mục"
              value={filters.filterCategoryId}
              onChange={(e) => onFilterChange("filterCategoryId", e.target.value)}
              SelectProps={muSelectAllowEmpty}
              InputLabelProps={muSelectFilterInputLabelProps}
              className="admin-catalog-soft-filter__field"
              sx={{ ...muTextFieldSx, minWidth: 140 }}
            >
              <MenuItem value="">Tất cả DM</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Trạng thái"
              value={filters.filterStatus}
              onChange={(e) => onFilterChange("filterStatus", e.target.value)}
              SelectProps={muSelectAllowEmpty}
              InputLabelProps={muSelectFilterInputLabelProps}
              className="admin-catalog-soft-filter__field"
              sx={{ ...muTextFieldSx, minWidth: 132 }}
            >
              <MenuItem value="">Mọi trạng thái</MenuItem>
              {QUESTION_STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Độ khó"
              value={filters.filterDifficulty}
              onChange={(e) => onFilterChange("filterDifficulty", e.target.value)}
              SelectProps={muSelectAllowEmpty}
              InputLabelProps={muSelectFilterInputLabelProps}
              className="admin-catalog-soft-filter__field"
              sx={{ ...muTextFieldSx, minWidth: 148 }}
            >
              {QUESTION_DIFFICULTY_OPTIONS.map((o) => (
                <MenuItem key={o.value || "all"} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
              <TextField
                select
                size="small"
                label="Sắp xếp"
                value={filters.sortBy}
                onChange={(e) => onFilterChange("sortBy", e.target.value as QuestionSortOption)}
                InputLabelProps={muSelectFilterInputLabelProps}
                className="admin-catalog-soft-filter__field"
                sx={{ ...muTextFieldSx, minWidth: 148 }}
              >
                {QUESTION_SORT_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="CEFR"
                value={filters.filterCefrLevel}
                onChange={(e) => onFilterChange("filterCefrLevel", e.target.value)}
                SelectProps={muSelectAllowEmpty}
                InputLabelProps={muSelectFilterInputLabelProps}
                className="admin-catalog-soft-filter__field"
                sx={{ ...muTextFieldSx, minWidth: 100 }}
              >
                {QUESTION_CEFR_OPTIONS.map((o) => (
                  <MenuItem key={o.value || "all"} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Kỹ năng"
                value={filters.filterSkill}
                onChange={(e) => onFilterChange("filterSkill", e.target.value)}
                SelectProps={muSelectAllowEmpty}
                InputLabelProps={muSelectFilterInputLabelProps}
                className="admin-catalog-soft-filter__field"
                sx={{ ...muTextFieldSx, minWidth: 120 }}
              >
                {QUESTION_SKILLS.map((o) => (
                  <MenuItem key={o.value || "all"} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label="Chủ đề"
                value={filters.filterTopic}
                onChange={(e) => onFilterChange("filterTopic", e.target.value)}
                className="admin-catalog-soft-filter__field"
                sx={{ ...muTextFieldSx, minWidth: 120 }}
              />
              <TextField
                select
                size="small"
                label="Nguồn"
                value={filters.filterSource}
                onChange={(e) => onFilterChange("filterSource", e.target.value)}
                SelectProps={muSelectAllowEmpty}
                InputLabelProps={muSelectFilterInputLabelProps}
                className="admin-catalog-soft-filter__field"
                sx={{ ...muTextFieldSx, minWidth: 120 }}
              >
                {QUESTION_SOURCE_OPTIONS.map((o) => (
                  <MenuItem key={o.value || "all"} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </>
          }
        />
    </Box>
  );
}
