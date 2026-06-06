import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { muFieldLabel } from "../../pages/admin/manageUserUiStyles";

type LessonRichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  minHeight?: number;
  disabled?: boolean;
};

function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

export function LessonRichTextEditor({
  value,
  onChange,
  label = "Nội dung",
  minHeight = 180,
  disabled = false,
}: LessonRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const normalized = value || "<p><br></p>";
    if (el.innerHTML !== normalized) {
      el.innerHTML = normalized;
    }
  }, [value]);

  const emitChange = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML.trim() || "<p><br></p>";
    onChange(html);
  };

  return (
    <Box>
      <Typography sx={{ ...muFieldLabel, mb: 0.5 }}>{label}</Typography>
      <Box
        sx={{
          border: "1px solid #D3D1C7",
          borderRadius: "8px",
          overflow: "hidden",
          bgcolor: "#fff",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 0.25,
            flexWrap: "wrap",
            px: 0.5,
            py: 0.25,
            borderBottom: "1px solid #ECEAE3",
            bgcolor: "#F9F8F5",
          }}
        >
          {[
            { icon: <FormatBoldIcon fontSize="small" />, title: "Đậm", cmd: "bold" },
            { icon: <FormatItalicIcon fontSize="small" />, title: "Nghiêng", cmd: "italic" },
            { icon: <FormatUnderlinedIcon fontSize="small" />, title: "Gạch chân", cmd: "underline" },
            { icon: <FormatListBulletedIcon fontSize="small" />, title: "Danh sách", cmd: "insertUnorderedList" },
            { icon: <FormatListNumberedIcon fontSize="small" />, title: "Đánh số", cmd: "insertOrderedList" },
          ].map((item) => (
            <Tooltip key={item.cmd} title={item.title}>
              <span>
                <IconButton
                  size="small"
                  disabled={disabled}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editorRef.current?.focus();
                    exec(item.cmd);
                    emitChange();
                  }}
                >
                  {item.icon}
                </IconButton>
              </span>
            </Tooltip>
          ))}
        </Box>
        <Box
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          sx={{
            minHeight,
            px: 1.5,
            py: 1.25,
            fontSize: 14,
            lineHeight: 1.55,
            color: "#333",
            outline: "none",
            "&:empty:before": {
              content: '"Nhập nội dung bài học..."',
              color: "#888780",
            },
            "& p": { margin: "0 0 8px" },
            "& ul, & ol": { margin: "0 0 8px", pl: 2.5 },
          }}
        />
      </Box>
    </Box>
  );
}
