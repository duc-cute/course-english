import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LinkIcon from "@mui/icons-material/Link";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import {
  getQuestionSummary,
  getQuestionTypeLabel,
  validateQuestion,
} from "../../../shared/lesson/exercisePayload";
import type { ExerciseQuestion } from "../../../student/lessonPlayer/exercise/types";
import { muBtnSmPrimary, muTextFieldSx } from "../../../pages/admin/manageUserUiStyles";

type QuestionListPanelProps = {
  questions: ExerciseQuestion[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAddMcq: () => void;
  onAddMatching: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

type SortableQuestionItemProps = {
  question: ExerciseQuestion;
  index: number;
  active: boolean;
  dragDisabled: boolean;
  onSelect: (index: number) => void;
};

function SortableQuestionItem({
  question,
  index,
  active,
  dragDisabled,
  onSelect,
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled: dragDisabled });

  const valid = validateQuestion(question).valid;
  const summary = getQuestionSummary(question);
  const typeLabel = getQuestionTypeLabel(question);
  const TypeIcon = question.type === "MATCHING" ? LinkIcon : QuizOutlinedIcon;

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      onClick={() => onSelect(index)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        p: 1.25,
        borderRadius: "8px",
        cursor: "pointer",
        borderLeft: active ? "4px solid #0C447C" : "4px solid transparent",
        bgcolor: isDragging
          ? "rgba(12, 68, 124, 0.12)"
          : active
            ? "rgba(12, 68, 124, 0.08)"
            : "transparent",
        boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
        "&:hover": {
          bgcolor: isDragging
            ? "rgba(12, 68, 124, 0.12)"
            : active
              ? "rgba(12, 68, 124, 0.08)"
              : "#F0EFEB",
          "& .drag-handle": { opacity: dragDisabled ? 0 : 1 },
        },
        transition: "background 0.15s, box-shadow 0.15s",
      }}
    >
      <Box
        className="drag-handle"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        sx={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          opacity: dragDisabled ? 0.3 : 0,
          cursor: dragDisabled ? "default" : "grab",
          color: "#888780",
          touchAction: "none",
          "&:active": { cursor: "grabbing" },
        }}
      >
        <DragIndicatorIcon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: active ? "#0C447C" : "#888780",
            }}
          >
            CÂU {index + 1}
          </Typography>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.25,
              fontSize: 9,
              fontWeight: 700,
              color: "#0C447C",
              bgcolor: "rgba(12, 68, 124, 0.08)",
              px: 0.75,
              py: 0.125,
              borderRadius: "4px",
            }}
          >
            <TypeIcon sx={{ fontSize: 11 }} />
            {typeLabel}
          </Box>
        </Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: active ? 600 : 400,
            color: "#333",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {summary}
        </Typography>
      </Box>
      {valid ? (
        <CheckCircleIcon sx={{ fontSize: 18, color: active ? "#0C447C" : "#C4C5D5" }} />
      ) : (
        <ErrorOutlineIcon sx={{ fontSize: 18, color: "#BA1A1A" }} />
      )}
    </Box>
  );
}

export function QuestionListPanel({
  questions,
  activeIndex,
  onSelect,
  onAddMcq,
  onAddMatching,
  onReorder,
}: QuestionListPanelProps) {
  const [search, setSearch] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const isFiltering = search.trim().length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questions.map((question, index) => ({ question, index }));
    return questions
      .map((question, index) => ({ question, index }))
      .filter(({ question }) => getQuestionSummary(question).toLowerCase().includes(q));
  }, [questions, search]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: dragged, over } = event;
    if (!over || dragged.id === over.id || isFiltering) return;

    const fromIndex = questions.findIndex((q) => q.id === dragged.id);
    const toIndex = questions.findIndex((q) => q.id === over.id);
    if (fromIndex < 0 || toIndex < 0) return;

    onReorder(fromIndex, toIndex);
  };

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 280 },
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: { md: "1px solid #ECEAE3" },
        borderBottom: { xs: "1px solid #ECEAE3", md: "none" },
        bgcolor: "#FAFAF8",
        maxHeight: { md: 520 },
      }}
    >
      <Box sx={{ p: 1.25, borderBottom: "1px solid #ECEAE3" }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Tìm câu hỏi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={muTextFieldSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "#888780" }} />
              </InputAdornment>
            ),
          }}
        />
        {isFiltering ? (
          <Typography sx={{ fontSize: 10, color: "#888780", mt: 0.5 }}>
            Xóa tìm kiếm để kéo thả sắp xếp
          </Typography>
        ) : null}
      </Box>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 1,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            {filtered.map(({ question, index }) => (
              <SortableQuestionItem
                key={question.id}
                question={question}
                index={index}
                active={index === activeIndex}
                dragDisabled={isFiltering}
                onSelect={onSelect}
              />
            ))}
          </Box>
        </SortableContext>
      </DndContext>

      <Box sx={{ p: 1.25, borderTop: "1px solid #ECEAE3", bgcolor: "#fff", display: "grid", gap: 0.75 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          sx={{
            ...muBtnSmPrimary,
            py: 1,
            borderRadius: "10px",
            fontSize: 13,
            fontWeight: 600,
          }}
          onClick={onAddMcq}
        >
          Thêm trắc nghiệm
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LinkIcon />}
          sx={{
            py: 1,
            borderRadius: "10px",
            fontSize: 13,
            fontWeight: 600,
            textTransform: "none",
            borderColor: "#0C447C",
            color: "#0C447C",
          }}
          onClick={onAddMatching}
        >
          Thêm ghép cặp
        </Button>
      </Box>
    </Box>
  );
}
