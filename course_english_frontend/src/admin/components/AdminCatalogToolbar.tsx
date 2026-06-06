import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import type { ReactNode } from "react";
import {
  muBtnSmOutlined,
  muBtnSmPrimary,
  muToolbarCard,
  muToolbarDivider,
  muToolbarRow,
  muToolbarSearchField,
} from "../../pages/admin/manageUserUiStyles";
import { CatalogImportActions } from "./CatalogImportActions";
import type { CatalogImportType } from "../../shared/api/catalogImport";

type AdminCatalogToolbarProps = {
  searchPlaceholder: string;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  addLabel: string;
  onAdd: () => void;
  importType?: CatalogImportType;
  onImported?: () => void;
  extraFilters?: ReactNode;

};

export function AdminCatalogToolbar({
  searchPlaceholder,
  searchInput,
  onSearchInputChange,
  onSearch,
  onReset,
  addLabel,
  onAdd,
  importType,
  onImported,
  extraFilters,
}: AdminCatalogToolbarProps) {
  return (
    <Box sx={muToolbarCard}>
      <Box sx={muToolbarRow}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          sx={muToolbarSearchField}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16 }} />
              </InputAdornment>
            ),
          }}
        />
        {extraFilters}
        <Button variant="contained" size="small" sx={muBtnSmPrimary} onClick={onSearch}>
          Tìm
        </Button>
        <Button variant="outlined" size="small" sx={muBtnSmOutlined} onClick={onReset}>
          Làm mới
        </Button>
        {importType ? (
          <>
            <Box sx={muToolbarDivider} />
            <CatalogImportActions type={importType} inline onImported={onImported} />
          </>
        ) : null}
        <Box sx={muToolbarDivider} />
        <Button variant="contained" size="small" sx={muBtnSmPrimary} startIcon={<AddIcon sx={{ fontSize: 15 }} />} onClick={onAdd}>
          {addLabel}
        </Button>
      </Box>
    </Box>
  );
}
