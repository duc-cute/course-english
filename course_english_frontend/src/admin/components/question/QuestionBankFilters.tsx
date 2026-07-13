import SearchIcon from "@mui/icons-material/Search";
import { Box, Button, InputAdornment, MenuItem, TextField } from "@mui/material";
import type { ReactNode } from "react";
import {
  QUESTION_CEFR_OPTIONS,
  QUESTION_DIFFICULTY_OPTIONS,
  QUESTION_SKILLS,
  QUESTION_STATUS_OPTIONS,
  QUESTION_TYPE_FILTER_OPTIONS,
} from "../../../shared/constants/questionBank";

export type QuestionBankFilterState = {
  searchInput: string;
  filterStatus: string;
  filterQuestionType: string;
  filterDifficulty: string;
  filterCefrLevel: string;
  filterSkill: string;
};

type QuestionBankFiltersProps = {
  filters: QuestionBankFilterState;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  onFilterChange: <K extends keyof QuestionBankFilterState>(key: K, value: QuestionBankFilterState[K]) => void;
};

type FilterFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

function FilterField({ label, children, className }: FilterFieldProps) {
  return (
    <Box className={`qb-filters__field ${className ?? ""}`.trim()}>
      <span className="qb-filters__label">{label}</span>
      {children}
    </Box>
  );
}

export function QuestionBankFilters({
  filters,
  onSearchInputChange,
  onSearch,
  onReset,
  onFilterChange,
}: QuestionBankFiltersProps) {
  return (
    <Box className="admin-catalog-page__filter-card qb-filters-card">
      <Box className="qb-filters">
        <Box className="qb-filters__search-row">
        <TextField
          size="small"
          className="qb-filters__search"
          placeholder="Tìm: environment B1, grammar passive voice, animals vocabulary…"
          value={filters.searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" size="small" className="qb-filters__btn qb-filters__btn--primary" onClick={onSearch}>
          Tìm
        </Button>
        <Button variant="outlined" size="small" className="qb-filters__btn qb-filters__btn--outlined" onClick={onReset}>
          Làm mới
        </Button>
        </Box>

        <Box className="qb-filters__grid">
        <FilterField label="Loại câu">
          <TextField
            select
            size="small"
            fullWidth
            value={filters.filterQuestionType}
            onChange={(e) => onFilterChange("filterQuestionType", e.target.value)}
            className="qb-filters__select"
          >
            {QUESTION_TYPE_FILTER_OPTIONS.map((o) => (
              <MenuItem key={o.value || "all"} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </FilterField>

        <FilterField label="Trạng thái">
          <TextField
            select
            size="small"
            fullWidth
            value={filters.filterStatus}
            onChange={(e) => onFilterChange("filterStatus", e.target.value)}
            className="qb-filters__select"
          >
            <MenuItem value="">Mọi trạng thái</MenuItem>
            {QUESTION_STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </FilterField>

        <FilterField label="Độ khó">
          <TextField
            select
            size="small"
            fullWidth
            value={filters.filterDifficulty}
            onChange={(e) => onFilterChange("filterDifficulty", e.target.value)}
            className="qb-filters__select"
          >
            {QUESTION_DIFFICULTY_OPTIONS.map((o) => (
              <MenuItem key={o.value || "all"} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </FilterField>

        <FilterField label="CEFR">
          <TextField
            select
            size="small"
            fullWidth
            value={filters.filterCefrLevel}
            onChange={(e) => onFilterChange("filterCefrLevel", e.target.value)}
            className="qb-filters__select"
          >
            {QUESTION_CEFR_OPTIONS.map((o) => (
              <MenuItem key={o.value || "all"} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </FilterField>

        <FilterField label="Kỹ năng">
          <TextField
            select
            size="small"
            fullWidth
            value={filters.filterSkill}
            onChange={(e) => onFilterChange("filterSkill", e.target.value)}
            className="qb-filters__select"
          >
            {QUESTION_SKILLS.map((o) => (
              <MenuItem key={o.value || "all"} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </FilterField>
      </Box>
      </Box>
    </Box>
  );
}
