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
  importAppearance?: "default" | "ghost";
  /** `soft` — nút mảnh, phẳng (trang phân lớp); mặc định EMR compact */
  toolbarVariant?: "default" | "soft";
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
  importAppearance,
  toolbarVariant = "default",
  extraFilters,
}: AdminCatalogToolbarProps) {
  const isSoft = toolbarVariant === "soft";

  return (
    <Box className={`admin-catalog-toolbar${isSoft ? " admin-catalog-toolbar--soft" : ""}`} sx={isSoft ? undefined : muToolbarCard}>
      <Box className="admin-catalog-toolbar__row" sx={isSoft ? undefined : muToolbarRow}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          className="admin-catalog-toolbar__search"
          sx={isSoft ? undefined : muToolbarSearchField}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16 }} />
              </InputAdornment>
            ),
          }}
        />
        {extraFilters}
        <Button
          variant="contained"
          size="small"
          className={isSoft ? "admin-catalog-toolbar__btn admin-catalog-toolbar__btn--primary" : undefined}
          sx={isSoft ? undefined : muBtnSmPrimary}
          onClick={onSearch}
        >
          Tìm
        </Button>
        <Button
          variant="outlined"
          size="small"
          className={isSoft ? "admin-catalog-toolbar__btn admin-catalog-toolbar__btn--outlined" : undefined}
          sx={isSoft ? undefined : muBtnSmOutlined}
          onClick={onReset}
        >
          Làm mới
        </Button>
        {importType ? (
          <>
            <Box className="admin-catalog-toolbar__divider" sx={isSoft ? undefined : muToolbarDivider} />
            <CatalogImportActions type={importType} inline appearance={importAppearance ?? (isSoft ? "ghost" : "default")} onImported={onImported} />
          </>
        ) : null}
        <Box className="admin-catalog-toolbar__divider admin-catalog-toolbar__divider--before-add" sx={isSoft ? undefined : muToolbarDivider} />
        <Button
          variant="contained"
          size="small"
          className={isSoft ? "admin-catalog-toolbar__btn admin-catalog-toolbar__btn--add" : undefined}
          sx={isSoft ? undefined : muBtnSmPrimary}
          startIcon={<AddIcon sx={{ fontSize: 15 }} />}
          onClick={onAdd}
        >
          {addLabel}
        </Button>
      </Box>
    </Box>
  );
}
