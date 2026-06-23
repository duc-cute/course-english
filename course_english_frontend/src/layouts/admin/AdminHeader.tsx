import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { NotificationBell } from "../../student/notifications/NotificationBell";
import { Box, IconButton, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { AdminUserMenu } from "./AdminUserMenu";
import { useLocation } from "react-router-dom";
import {
  isAiAssistantPath,
  useAiAssistantDrawerOptional,
} from "../../shared/ai/AiAssistantDrawerContext";
import { getAdminPageTitle } from "./adminPageMeta";

type AdminHeaderProps = {
  onToggleSidebar: () => void;
};

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const location = useLocation();
  const pageTitle = getAdminPageTitle(location.pathname);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const aiDrawer = useAiAssistantDrawerOptional();
  const isAiPage = isAiAssistantPath(location.pathname);
  const useChatHistoryNav = isMobile && isAiPage && aiDrawer;

  const handleNavClick = () => {
    if (useChatHistoryNav) {
      aiDrawer.openDrawer();
      return;
    }
    onToggleSidebar();
  };

  return (
    <Box component="header" className="admin-header-root">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
        <IconButton
          edge="start"
          onClick={handleNavClick}
          className="admin-header-icon-btn"
          sx={{ display: { xs: "inline-flex", md: "none" } }}
          aria-label={useChatHistoryNav ? "Lịch sử hội thoại" : "Mở menu"}
        >
          {useChatHistoryNav ? <ChatBubbleOutlineIcon /> : <MenuIcon />}
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--ac-on-surface)" }} noWrap>
          {pageTitle}
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1} className="admin-header-actions">
        <Box className="admin-header-search">
          <SearchIcon className="search-icon" fontSize="small" />
          <input type="search" placeholder="Tìm kiếm..." aria-label="Tìm kiếm" />
        </Box>
        <NotificationBell />
        <AdminUserMenu />
      </Stack>
    </Box>
  );
}
