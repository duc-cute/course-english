import MenuIcon from "@mui/icons-material/Menu";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import { getStudentPageTitle } from "./studentPageMeta";

type StudentHeaderProps = {
  onToggleSidebar: () => void;
};

export function StudentHeader({ onToggleSidebar }: StudentHeaderProps) {
  const location = useLocation();
  const pageTitle = getStudentPageTitle(location.pathname);

  return (
    <Box component="header" className="student-header-root">
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton
          edge="start"
          onClick={onToggleSidebar}
          sx={{ display: { md: "none" } }}
          aria-label="Mở menu"
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#0b1c30" }}>
          {pageTitle}
        </Typography>
      </Stack>
    </Box>
  );
}
