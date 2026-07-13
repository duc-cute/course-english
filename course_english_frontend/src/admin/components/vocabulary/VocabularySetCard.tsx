import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HeadphonesOutlinedIcon from "@mui/icons-material/HeadphonesOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import KeyboardOutlinedIcon from "@mui/icons-material/KeyboardOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import SpellcheckOutlinedIcon from "@mui/icons-material/SpellcheckOutlined";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { useState } from "react";
import { resolveStorageAssetUrl } from "../../../shared/api/file";
import type { VocabularySetRecord, VocabularySetStatus } from "../../../shared/api/vocabularySet";

type VocabularySetCardProps = {
  set: VocabularySetRecord;
  onEdit: (set: VocabularySetRecord) => void;
  onDelete: (set: VocabularySetRecord) => void;
  onAssignClassroom?: (set: VocabularySetRecord) => void;
  onGenerateMcq: (set: VocabularySetRecord) => void;
  onGenerateListen: (set: VocabularySetRecord) => void;
  onGenerateSpelling: (set: VocabularySetRecord) => void;
  onGenerateListenType: (set: VocabularySetRecord) => void;
  onGenerateBankAi?: (set: VocabularySetRecord) => void;
};

function statusBadge(status?: VocabularySetStatus) {
  if (status === "PUBLISHED") {
    return (
      <span className="vocab-set-card__status vocab-set-card__status--published">Đã xuất bản</span>
    );
  }
  if (status === "ARCHIVED") {
    return <span className="vocab-set-card__status vocab-set-card__status--archived">Lưu trữ</span>;
  }
  return <span className="vocab-set-card__status vocab-set-card__status--draft">Bản nháp</span>;
}

function previewChips(set: VocabularySetRecord) {
  const preview = set.previewWords?.filter(Boolean) ?? [];
  const total = set.itemCount ?? preview.length;
  if (total === 0) {
    return <span className="vocab-set-card__chip vocab-set-card__chip--empty">Chưa có từ</span>;
  }
  const extra = Math.max(0, total - preview.length);
  return (
    <>
      {preview.map((word) => (
        <span key={word} className="vocab-set-card__chip">
          {word}
        </span>
      ))}
      {extra > 0 ? (
        <span className="vocab-set-card__chip vocab-set-card__chip--more">+{extra} từ khác</span>
      ) : null}
    </>
  );
}

export function VocabularySetCard({
  set,
  onEdit,
  onDelete,
  onAssignClassroom,
  onGenerateMcq,
  onGenerateListen,
  onGenerateSpelling,
  onGenerateListenType,
  onGenerateBankAi,
}: VocabularySetCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const wordCount = set.itemCount ?? 0;

  const closeMenu = () => setMenuAnchor(null);

  const hasCover = !!set.coverImageUrl;

  const renderHeader = (isOverlay: boolean) => (
    <div className={`vocab-set-card__header ${isOverlay ? "vocab-set-card__header--overlay" : "vocab-set-card__header--inline"}`}>
      {statusBadge(set.status)}
      <div className="vocab-set-card__actions">
        {onAssignClassroom ? (
          <Tooltip title="Gán cho lớp">
            <IconButton
              size="small"
              className="vocab-set-card__icon-btn"
              onClick={() => onAssignClassroom(set)}
              aria-label="Gán bộ từ cho lớp"
            >
              <ClassOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
        <Tooltip title="Sửa bộ từ">
          <IconButton
            size="small"
            className="vocab-set-card__icon-btn"
            onClick={() => onEdit(set)}
            aria-label="Sửa bộ từ"
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Xóa">
          <IconButton
            size="small"
            className="vocab-set-card__icon-btn vocab-set-card__icon-btn--danger"
            onClick={() => onDelete(set)}
            aria-label="Xóa bộ từ"
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );

  return (
    <article className={`vocab-set-card ${hasCover ? "vocab-set-card--has-cover" : "vocab-set-card--no-cover"} group`}>
      {hasCover ? (
        <div className="vocab-set-card__cover">
          <img src={resolveStorageAssetUrl(set.coverImageUrl)} alt="" loading="lazy" className="vocab-set-card__image" />
          <div className="vocab-set-card__cover-gradient" />
          {renderHeader(true)}
        </div>
      ) : null}
      <div className="vocab-set-card__body">
        {!hasCover ? renderHeader(false) : null}

        <h3 className="vocab-set-card__title" title={set.title}>{set.title}</h3>
        {set.description?.trim() ? (
          <p className="vocab-set-card__desc">{set.description}</p>
        ) : (
          <p className="vocab-set-card__desc vocab-set-card__desc--placeholder">Chưa có mô tả</p>
        )}

        <div className="vocab-set-card__chips">{previewChips(set)}</div>
      </div>

      <footer className="vocab-set-card__footer">
        <div className="vocab-set-card__count">
          <Inventory2OutlinedIcon className="vocab-set-card__count-icon" fontSize="inherit" />
          {wordCount} từ
        </div>

        <button
          type="button"
          className="vocab-set-card__ai-btn"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          disabled={wordCount === 0}
        >
          ✨ Sinh AI
          <ExpandMoreIcon className="vocab-set-card__ai-chevron" fontSize="inherit" />
        </button>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
          slotProps={{
            paper: { className: "vocab-set-card__menu-paper", elevation: 8 },
          }}
        >
          <MenuItem
            className="vocab-set-card__menu-item"
            onClick={() => {
              closeMenu();
              onGenerateMcq(set);
            }}
          >
            <span className="vocab-set-card__menu-emoji" aria-hidden>
              📝
            </span>
            Trắc nghiệm (MCQ) — lesson
          </MenuItem>
          {onGenerateBankAi ? (
            <MenuItem
              className="vocab-set-card__menu-item"
              onClick={() => {
                closeMenu();
                onGenerateBankAi(set);
              }}
            >
              <QuizOutlinedIcon fontSize="small" className="vocab-set-card__menu-icon" />
              Sinh câu AI → Question Bank
            </MenuItem>
          ) : null}
          <MenuItem
            className="vocab-set-card__menu-item"
            onClick={() => {
              closeMenu();
              onGenerateListen(set);
            }}
          >
            <HeadphonesOutlinedIcon fontSize="small" className="vocab-set-card__menu-icon" />
            Luyện nghe (Audio)
          </MenuItem>
          <MenuItem
            className="vocab-set-card__menu-item"
            onClick={() => {
              closeMenu();
              onGenerateSpelling(set);
            }}
          >
            <SpellcheckOutlinedIcon fontSize="small" className="vocab-set-card__menu-icon" />
            Luyện gõ chính tả
          </MenuItem>
          <MenuItem
            className="vocab-set-card__menu-item"
            onClick={() => {
              closeMenu();
              onGenerateListenType(set);
            }}
          >
            <KeyboardOutlinedIcon fontSize="small" className="vocab-set-card__menu-icon" />
            Luyện nghe-gõ
          </MenuItem>
        </Menu>
      </footer>
    </article>
  );
}

export function VocabularySetCreateCard({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="vocab-set-create-card" onClick={onClick}>
      <span className="vocab-set-create-card__icon" aria-hidden>
        +
      </span>
      <span className="vocab-set-create-card__label">Tạo bộ từ vựng mới</span>
    </button>
  );
}
