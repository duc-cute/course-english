import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SpellcheckRoundedIcon from "@mui/icons-material/SpellcheckRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { AiConversationRecord } from "../../shared/api/ai";
import { AiChatMessageBubble } from "../../shared/ai/AiChatMessageBubble";
import { useAiAssistantDrawer } from "../../shared/ai/AiAssistantDrawerContext";
import {
  formatRelativeTime,
  MAX_AI_INPUT_LENGTH,
  renderConversationTitle,
} from "../../shared/ai/aiChatUtils";
import { useAiChat } from "../../shared/ai/useAiChat";
import { useStudentAccountProfile } from "../../student/shared/auth/useStudentAccountProfile";
import "../../styles/admin-ai-assistant.css";

// Tạm ẩn gợi ý nhanh — bật lại khi cần
// const DESKTOP_SUGGESTION_CHIPS = [
//   "Explain grammar",
//   "Correct my sentence",
//   "Translate",
//   "Practice Speaking",
// ];
//
// const MOBILE_SUGGESTION_CHIPS = [
//   "Explain grammar",
//   "Correct my sentence",
//   "Translate this",
//   "Give me examples",
// ];

const HISTORY_ICONS = [ChatBubbleOutlineRoundedIcon, SchoolRoundedIcon, SpellcheckRoundedIcon];

function getHistoryIcon(index: number) {
  return HISTORY_ICONS[index % HISTORY_ICONS.length];
}

type ConversationPanelProps = {
  loadingConversations: boolean;
  conversations: AiConversationRecord[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onRenameConversation: (item: AiConversationRecord) => void;
  onDeleteConversation: (item: AiConversationRecord) => void;
  onOpenAdminMenu?: () => void;
  variant?: "sidebar" | "drawer";
};

function ConversationPanel({
  loadingConversations,
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onDeleteConversation,
  onOpenAdminMenu,
  variant = "sidebar",
}: ConversationPanelProps) {
  const isDrawer = variant === "drawer";

  return (
    <>
      <div className={`ai-assistant-brand${isDrawer ? " ai-assistant-brand--drawer" : ""}`}>
        <div className="ai-assistant-brand-icon">
          {isDrawer ? (
            <AutoAwesomeRoundedIcon fontSize="small" />
          ) : (
            <SchoolRoundedIcon fontSize="small" />
          )}
        </div>
        <div>
          <p className="ai-assistant-brand-title">LinguistAI</p>
          <p className="ai-assistant-brand-subtitle">
            {isDrawer ? "Personal Language Tutor" : "AI English Tutor"}
          </p>
        </div>
      </div>

      <button
        type="button"
        className={`ai-assistant-new-btn${isDrawer ? " ai-assistant-new-btn--drawer" : ""}`}
        onClick={onCreateConversation}
      >
        <AddRoundedIcon fontSize="small" />
        <span>{isDrawer ? "New Chat" : "New conversation"}</span>
      </button>

      <div className="ai-assistant-history-label">{isDrawer ? "Recent" : "Recent Chats"}</div>

      {loadingConversations ? (
        <div className="ai-assistant-loading">
          <CircularProgress size={24} />
        </div>
      ) : (
        <nav className="ai-assistant-history-list">
          {conversations.map((item, index) => {
            const Icon = getHistoryIcon(index);
            const isActive = item.id === activeConversationId;
            return (
              <div
                key={item.id}
                className={`ai-assistant-history-row${isActive ? " is-active" : ""}${isDrawer ? " ai-assistant-history-row--drawer" : ""}`}
              >
                <button
                  type="button"
                  className={`ai-assistant-history-item${isActive ? " is-active" : ""}${isDrawer ? " ai-assistant-history-item--drawer" : ""}`}
                  onClick={() => onSelectConversation(item.id)}
                >
                  <Icon fontSize="small" />
                  <div className="ai-assistant-history-item-body">
                    <div className="ai-assistant-history-item-title">{renderConversationTitle(item)}</div>
                    <div className="ai-assistant-history-item-time">
                      {formatRelativeTime(item.lastMessageAt ?? item.createdAt)}
                    </div>
                  </div>
                </button>
                <div className="ai-assistant-history-item-actions">
                  <IconButton
                    size="small"
                    aria-label="Đổi tên hội thoại"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRenameConversation(item);
                    }}
                  >
                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label="Xóa hội thoại"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteConversation(item);
                    }}
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </div>
              </div>
            );
          })}
        </nav>
      )}

      {isDrawer && onOpenAdminMenu ? (
        <div className="ai-assistant-drawer-footer">
          <button type="button" className="ai-assistant-drawer-admin-btn" onClick={onOpenAdminMenu}>
            <MenuRoundedIcon fontSize="small" />
            <span>Menu quản trị</span>
          </button>
        </div>
      ) : null}
    </>
  );
}

// function SuggestionChips({
//   chips,
//   className,
//   onSelect,
// }: {
//   chips: string[];
//   className: string;
//   onSelect: (chip: string) => void;
// }) {
//   return (
//     <div className={className}>
//       {chips.map((chip) => (
//         <button key={chip} type="button" className="ai-assistant-suggestion-chip" onClick={() => onSelect(chip)}>
//           {chip}
//         </button>
//       ))}
//     </div>
//   );
// }

function WelcomeSection({ greeting }: { greeting: string }) {
  return (
    <div className="ai-assistant-welcome">
      <div className="ai-assistant-welcome-icon">
        <TranslateRoundedIcon sx={{ fontSize: 36 }} />
      </div>
      <h2 className="ai-assistant-welcome-title">{greeting}</h2>
      <p className="ai-assistant-welcome-text">
        Ready to practice your English today? Let&apos;s start with a conversation.
      </p>
    </div>
  );
}

export function AiAssistantPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<AiConversationRecord | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 900px)").matches : false,
  );
  const { displayName } = useStudentAccountProfile();
  const chat = useAiChat();
  const { registerDrawer, unregisterDrawer, requestOpenAdminMenu } = useAiAssistantDrawer();

  const greeting = useMemo(() => {
    const name = displayName?.trim();
    return name ? `Hello, ${name.split(" ")[0]}!` : "Hello!";
  }, [displayName]);

  useEffect(() => {
    registerDrawer({
      open: () => setDrawerOpen(true),
      close: () => setDrawerOpen(false),
    });
    return unregisterDrawer;
  }, [registerDrawer, unregisterDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const createConversation = async () => {
    await chat.createConversation();
    setDrawerOpen(false);
  };

  const selectConversation = (id: string) => {
    chat.selectConversation(id);
    setDrawerOpen(false);
  };

  const openRenameDialog = (item: AiConversationRecord) => {
    setRenameTarget(item);
    setRenameTitle(renderConversationTitle(item));
  };

  const closeRenameDialog = () => {
    if (renameSaving) return;
    setRenameTarget(null);
    setRenameTitle("");
  };

  const submitRename = async () => {
    if (!renameTarget) return;
    setRenameSaving(true);
    const ok = await chat.renameConversation(renameTarget.id, renameTitle);
    setRenameSaving(false);
    if (ok) closeRenameDialog();
  };

  const handleDeleteConversation = async (item: AiConversationRecord) => {
    const title = renderConversationTitle(item);
    const confirmed = window.confirm(`Xóa hội thoại "${title}"? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;
    await chat.deleteConversation(item.id);
    setDrawerOpen(false);
  };

  // const handleSuggestionClick = (suggestion: string) => {
  //   chat.setInput(suggestion);
  //   chat.textareaRef.current?.focus();
  // };

  const renderMessages = (): ReactNode => {
    if (chat.loadingMessages) {
      return (
        <div className="ai-assistant-loading">
          <CircularProgress size={24} />
        </div>
      );
    }

    if (chat.messages.length === 0 && !chat.sending) {
      return <WelcomeSection greeting={greeting} />;
    }

    return (
      <>
        {chat.messages.length > 0 ? <div className="ai-assistant-day-label">Today</div> : null}
        {chat.messages.map((item) => (
          <AiChatMessageBubble key={item.id} item={item} onCopy={chat.handleCopy} />
        ))}
      </>
    );
  };

  return (
    <div className="ai-assistant-page">
      <aside className="ai-assistant-sidebar" aria-label="Conversation history">
        <ConversationPanel
          loadingConversations={chat.loadingConversations}
          conversations={chat.conversations}
          activeConversationId={chat.activeConversationId}
          onSelectConversation={selectConversation}
          onCreateConversation={() => void createConversation()}
          onRenameConversation={openRenameDialog}
          onDeleteConversation={(item) => void handleDeleteConversation(item)}
        />
      </aside>

      <div
        className={`ai-assistant-drawer-backdrop${drawerOpen ? " is-open" : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
      />

      <aside
        className={`ai-assistant-drawer${drawerOpen ? " is-open" : ""}`}
        aria-label="Chat navigation"
        aria-hidden={!drawerOpen}
      >
        <ConversationPanel
          variant="drawer"
          loadingConversations={chat.loadingConversations}
          conversations={chat.conversations}
          activeConversationId={chat.activeConversationId}
          onSelectConversation={selectConversation}
          onCreateConversation={() => void createConversation()}
          onRenameConversation={openRenameDialog}
          onDeleteConversation={(item) => void handleDeleteConversation(item)}
          onOpenAdminMenu={requestOpenAdminMenu}
        />
      </aside>

      <main className="ai-assistant-main">
        <header className="ai-assistant-header">
          <div className="ai-assistant-header-badge">
            <span className="ai-assistant-header-badge-dot" />
            AI Assistant for English Learning
          </div>
          {chat.activeConversation ? (
            <span className="ai-assistant-header-conversation">
              {renderConversationTitle(chat.activeConversation)}
            </span>
          ) : null}
        </header>

        <div className="ai-assistant-messages-wrap">
          <div
            className={`ai-assistant-messages${chat.messages.length === 0 && !chat.sending ? " ai-assistant-messages--empty" : ""}`}
          >
            <div className="ai-assistant-messages-inner">
              {renderMessages()}

              <div ref={chat.messagesEndRef} />
            </div>
          </div>
        </div>

        <footer className="ai-assistant-footer">
          {chat.error ? <div className="ai-assistant-error">{chat.error}</div> : null}

          {/* Tạm ẩn gợi ý nhanh
          <SuggestionChips
            chips={DESKTOP_SUGGESTION_CHIPS}
            className="ai-assistant-suggestions ai-assistant-suggestions--desktop"
            onSelect={handleSuggestionClick}
          />
          <SuggestionChips
            chips={MOBILE_SUGGESTION_CHIPS}
            className="ai-assistant-suggestions ai-assistant-suggestions--mobile"
            onSelect={handleSuggestionClick}
          />
          */}

          <div className="ai-assistant-input-panel">
            <div className="ai-assistant-input-inner">
              <button type="button" className="ai-assistant-input-icon-btn" title="Attach file">
                <AttachFileRoundedIcon fontSize="small" />
              </button>
              <textarea
                ref={chat.textareaRef}
                className="ai-assistant-textarea"
                rows={1}
                placeholder={isMobile ? "Type a message..." : "Ask anything about English learning..."}
                value={chat.input}
                maxLength={MAX_AI_INPUT_LENGTH}
                onChange={(event) => chat.setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void chat.sendMessage();
                  }
                }}
              />
              <button type="button" className="ai-assistant-input-icon-btn" title="Voice input">
                <MicRoundedIcon fontSize="small" />
              </button>
              <button
                type="button"
                className="ai-assistant-send-btn"
                disabled={!chat.activeConversationId || !chat.input.trim() || chat.sending}
                onClick={() => void chat.sendMessage()}
                title="Send"
              >
                {chat.sending ? <CircularProgress size={20} color="inherit" /> : <SendRoundedIcon fontSize="small" />}
              </button>
            </div>
            <div className="ai-assistant-input-meta">
              <span>LinguistAI can make mistakes. Verify important info.</span>
              <span className="ai-assistant-input-count">
                {chat.input.length} / {MAX_AI_INPUT_LENGTH}
              </span>
            </div>
          </div>
        </footer>
      </main>

      <Dialog open={Boolean(renameTarget)} onClose={closeRenameDialog} fullWidth maxWidth="xs">
        <DialogTitle>Đổi tên hội thoại</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Tiêu đề"
            value={renameTitle}
            onChange={(event) => setRenameTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submitRename();
            }}
            inputProps={{ maxLength: 255 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRenameDialog} disabled={renameSaving}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitRename()}
            disabled={renameSaving || !renameTitle.trim()}
          >
            {renameSaving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
