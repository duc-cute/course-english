import { Box, Chip, Typography } from "@mui/material";
import type { ExamSectionDraft } from "./ExamSectionListPanel";
import { parseExerciseSetPayload } from "../../../student/lessonPlayer/exercise/parseExerciseSet";

type ExamPaperPreviewStripProps = {
  paperTitle: string;
  paperInstruction?: string;
  sections: ExamSectionDraft[];
};

export function ExamPaperPreviewStrip({
  paperTitle,
  paperInstruction,
  sections,
}: ExamPaperPreviewStripProps) {
  const totalQuestions = sections.reduce((sum, s) => {
    try {
      return sum + parseExerciseSetPayload(s.payloadJson).questions.length;
    } catch {
      return sum;
    }
  }, 0);

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: "10px",
        border: "1px dashed #CBD5E1",
        bgcolor: "#F8FAFC",
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0C447C" }}>
        {paperTitle.trim() || "Đề thi mới"}
      </Typography>
      {paperInstruction?.trim() ? (
        <Typography sx={{ fontSize: 12, color: "#475569", mt: 0.5, fontStyle: "italic" }}>
          {paperInstruction.trim()}
        </Typography>
      ) : null}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
        <Chip size="small" label={`${sections.length} phần`} />
        <Chip size="small" label={`${totalQuestions} câu`} variant="outlined" />
        {sections.map((s, i) => (
          <Chip
            key={s.clientKey}
            size="small"
            variant="outlined"
            label={`${i + 1}. ${s.title?.trim() || "Phần " + (i + 1)}`}
          />
        ))}
      </Box>
    </Box>
  );
}
