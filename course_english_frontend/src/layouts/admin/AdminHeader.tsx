import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { NotificationBell } from "../../student/notifications/NotificationBell";
import { Box, IconButton, Stack, Typography, useMediaQuery, useTheme, Button, Menu, MenuItem } from "@mui/material";
import { AdminUserMenu } from "./AdminUserMenu";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  isAiAssistantPath,
  useAiAssistantDrawerOptional,
} from "../../shared/ai/AiAssistantDrawerContext";
import { getAdminPageTitle } from "./adminPageMeta";
import { getAccessToken } from "../../shared/auth/token";
import { getRolesFromAccessToken } from "../../shared/auth/jwtUtils";
import { paths } from "../../shared/constants/paths";

type AdminHeaderProps = {
  desktopCollapsed: boolean;
  onToggleMobileSidebar: () => void;
  onToggleDesktopSidebar: () => void;
};

function getAdminPageSubtitle(pathname: string, roleName: string): string {
  const adminRoot = `/${paths.ADMIN}`;
  if (pathname === adminRoot || pathname === `${adminRoot}/`) {
    return `Dashboard ${roleName.toLowerCase()}`;
  }

  if (/^\/admin\/manage-lesson\/[^/]+\/edit$/.test(pathname)) {
    return "Soạn thảo và thiết kế nội dung bài học";
  }

  const map: Record<string, string> = {
    [`${adminRoot}/${paths.SCHEDULE}`]: "Lịch giảng dạy và ca học trong tuần",
    [`${adminRoot}/${paths.STUDENTS_NEED_SUPPORT}`]: "Danh sách học sinh cần hỗ trợ học tập",
    [`${adminRoot}/${paths.MANAGE_USER}`]: "Quản lý tài khoản người dùng và thông tin",
    [`${adminRoot}/${paths.MANAGE_ROLE}`]: "Phân quyền và quản lý vai trò trong hệ thống",
    [`${adminRoot}/${paths.MANAGE_CLASSROOM}`]: "Quản lý danh sách lớp học và sĩ số",
    [`${adminRoot}/${paths.MANAGE_SUBJECT}`]: "Quản lý danh mục các môn học",
    [`${adminRoot}/${paths.MANAGE_LESSON}`]: "Quản lý bài học và học liệu đi kèm",
    [`${adminRoot}/${paths.MANAGE_ENROLLMENT}`]: "Phân chia học sinh vào các lớp học",
    [`${adminRoot}/${paths.REVIEW_DOC}`]: "Review & định hướng học tập",
    [`${adminRoot}/${paths.MANAGE_QUESTIONS}`]: "Kho câu hỏi và đề bài tập",
    [`${adminRoot}/${paths.MANAGE_VOCABULARY_WORDS}`]: "Thư viện từ vựng tiếng Anh",
    [`${adminRoot}/${paths.MANAGE_VOCABULARY_SETS}`]: "Quản lý các bộ từ vựng theo chủ đề",
    [`${adminRoot}/${paths.MANAGE_SYSTEM_CONFIG}`]: "Cài đặt cấu hình thông số hệ thống",
    [`${adminRoot}/${paths.USAGE_GUIDE}`]: "Tài liệu hướng dẫn sử dụng hệ thống",
    [`${adminRoot}/${paths.AI_ASSISTANT}`]: "Trợ lý học tập AI - LinguistAI",
  };

  return map[pathname] ?? "Quản trị hệ thống Nova English";
}

export function AdminHeader({
  desktopCollapsed,
  onToggleMobileSidebar,
  onToggleDesktopSidebar,
}: AdminHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getAdminPageTitle(location.pathname);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const aiDrawer = useAiAssistantDrawerOptional();
  const isAiPage = isAiAssistantPath(location.pathname);
  const useChatHistoryNav = isMobile && isAiPage && aiDrawer;

  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(null);

  const token = getAccessToken();
  const roles = token ? getRolesFromAccessToken(token) : [];
  const isTeacher = roles.includes("TEACHER_ROLE") || roles.includes("TEACHER") || roles.some(r => r.toUpperCase() === "TEACHER_ROLE" || r.toUpperCase() === "TEACHER");
  const roleName = isTeacher ? "Giáo viên" : "Quản trị viên";
  const pageSubtitle = getAdminPageSubtitle(location.pathname, roleName);

  const handleNavClick = () => {
    if (useChatHistoryNav) {
      aiDrawer.openDrawer();
      return;
    }
    if (isMobile) {
      onToggleMobileSidebar();
      return;
    }
    onToggleDesktopSidebar();
  };

  const handleOpenCreateMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCreateMenuAnchor(event.currentTarget);
  };

  const handleCloseCreateMenu = () => {
    setCreateMenuAnchor(null);
  };

  return (
    <Box component="header" className="admin-header-root">
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
        <IconButton
          edge="start"
          onClick={handleNavClick}
          className="admin-header-icon-btn"
          sx={{ display: "inline-flex" }}
          aria-label={
            useChatHistoryNav
              ? "Lịch sử hội thoại"
              : desktopCollapsed
                ? "Mở thanh điều hướng"
                : "Thu gọn thanh điều hướng"
          }
        >
          {useChatHistoryNav ? <ChatBubbleOutlineIcon /> : <MenuIcon />}
        </IconButton>
        <Stack direction="column" spacing={0} sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: "1.125rem",
              color: "var(--ac-on-surface)",
              lineHeight: 1.2,
            }}
            noWrap
          >
            {pageTitle}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "var(--ac-outline, #737686)",
              fontSize: "0.75rem",
              fontWeight: 500,
              lineHeight: 1.2,
            }}
            noWrap
          >
            {pageSubtitle}
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={2} className="admin-header-actions">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          endIcon={<KeyboardArrowDownIcon />}
          onClick={handleOpenCreateMenu}
          className="admin-header-create-btn"
          sx={{
            bgcolor: "var(--ac-primary, #004ac6)",
            color: "#ffffff",
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "0.875rem",
            px: 2,
            py: 0.75,
            boxShadow: "0 2px 4px rgba(0, 74, 198, 0.08)",
            "&:hover": {
              bgcolor: "var(--ac-primary-container, #2563eb)",
              boxShadow: "0 4px 8px rgba(0, 74, 198, 0.16)",
            },
          }}
        >
          Tạo mới
        </Button>
        <Menu
          anchorEl={createMenuAnchor}
          open={Boolean(createMenuAnchor)}
          onClose={handleCloseCreateMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
              border: "1px solid #e2e8f0",
              minWidth: 160,
              p: 0.5,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              handleCloseCreateMenu();
              navigate(`/${paths.ADMIN}/${paths.MANAGE_CLASSROOM}`);
            }}
            sx={{
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500,
              py: 1,
              color: "#334155",
            }}
          >
            Lớp học mới
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloseCreateMenu();
              navigate(`/${paths.ADMIN}/${paths.MANAGE_LESSON}`);
            }}
            sx={{
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500,
              py: 1,
              color: "#334155",
            }}
          >
            Bài học mới
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloseCreateMenu();
              navigate(`/${paths.ADMIN}/${paths.MANAGE_VOCABULARY_SETS}`);
            }}
            sx={{
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500,
              py: 1,
              color: "#334155",
            }}
          >
            Bộ từ vựng mới
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloseCreateMenu();
              navigate(`/${paths.ADMIN}/${paths.MANAGE_USER}`);
            }}
            sx={{
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500,
              py: 1,
              color: "#334155",
            }}
          >
            Người dùng mới
          </MenuItem>
        </Menu>
        
        <NotificationBell />
        <AdminUserMenu />
      </Stack>
    </Box>
  );
}
