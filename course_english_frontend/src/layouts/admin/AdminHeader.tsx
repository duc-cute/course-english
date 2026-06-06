import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import { getAdminPageTitle } from "./adminPageMeta";

type AdminHeaderProps = {
  onToggleSidebar: () => void;
};

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const location = useLocation();
  const pageTitle = getAdminPageTitle(location.pathname);

  return (
    <Box component="header" className="admin-header-root">
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton
          edge="start"
          onClick={onToggleSidebar}
          className="admin-header-icon-btn"
          sx={{ display: { md: "none" } }}
          aria-label="Mở menu"
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--ac-on-surface)" }}>
          {pageTitle}
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1}>
        <Box className="admin-header-search">
          <SearchIcon className="search-icon" fontSize="small" />
          <input type="search" placeholder="Tìm kiếm..." aria-label="Tìm kiếm" />
        </Box>
        <IconButton className="admin-header-icon-btn" size="small" aria-label="Thông báo">
          <NotificationsNoneIcon />
        </IconButton>
        <IconButton className="admin-header-icon-btn" size="small" aria-label="Trợ giúp">
          <HelpOutlineIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
