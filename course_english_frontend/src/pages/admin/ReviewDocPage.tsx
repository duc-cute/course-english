import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box, Button, Typography } from "@mui/material";

const reviewDocPath = "/docs/REVIEW.html";

export function ReviewDocPage() {
  return (
    <Box sx={{ height: "100%", minHeight: 480, display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          mb: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          REVIEW tài liệu
        </Typography>
        <Button
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          onClick={() => window.open(reviewDocPath, "_blank", "noopener,noreferrer")}
        >
          Mở tab mới
        </Button>
      </Box>

      <Box sx={{ flex: 1, border: "1px solid #dfe5ef", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
        <iframe
          title="Review Document"
          src={reviewDocPath}
          style={{ width: "100%", height: "100%", border: 0, background: "#fff" }}
        />
      </Box>
    </Box>
  );
}
