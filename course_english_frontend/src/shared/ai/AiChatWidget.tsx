import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { CircularProgress } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getRolesFromAccessToken } from "../auth/jwtUtils";
import { isStudentOnlyUser } from "../auth/roleRouting";
import { getAccessToken } from "../auth/token";
import { paths } from "../constants/paths";
import { useStudentAccountProfile } from "../../student/shared/auth/useStudentAccountProfile";
import { AiChatMessageBubble } from "./AiChatMessageBubble";
import { MAX_AI_INPUT_LENGTH } from "./aiChatUtils";
import { useAiChat } from "./useAiChat";

type AiChatWidgetProps = {
  onClose: () => void;
};

function WidgetWelcome({ greeting }: { greeting: string }) {
  return (
    <div className="ai-chat-widget-welcome">
      <img
        src="/images/ai-robot-mascot.png"
        alt="LinguistAI Mascot"
        className="ai-chat-widget-welcome-logo"
        style={{ width: 64, height: 64, objectFit: "contain", marginBottom: 12 }}
      />
      <p className="ai-chat-widget-welcome-title">{greeting}</p>
      <p className="ai-chat-widget-welcome-text">
        I&apos;m your LinguistAI tutor. How can I help you improve your English today?
      </p>
    </div>
  );
}

export function AiChatWidget({ onClose }: AiChatWidgetProps) {
  const [bootstrapping, setBootstrapping] = useState(true);
  const { displayName } = useStudentAccountProfile();
  const chat = useAiChat({ enabled: true, autoSelectConversation: false });

  const greeting = useMemo(() => {
    const name = displayName?.trim();
    return name ? `Hello, ${name.split(" ")[0]}!` : "Hello!";
  }, [displayName]);

  const showFullChatLink = useMemo(() => {
    const token = getAccessToken();
    if (!token) return false;
    return !isStudentOnlyUser(getRolesFromAccessToken(token));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setBootstrapping(true);
      await chat.ensureConversation();
      if (!cancelled) setBootstrapping(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // const handleSuggestionClick = (chip: string) => {
  //   const prompts: Record<string, string> = {
  //     "Grammar check": "Help me with grammar check for: ",
  //     Translate: "Translate this to English: ",
  //     Vocabulary: "Give me vocabulary words for: ",
  //   };
  //   chat.setInput(prompts[chip] ?? chip);
  //   chat.textareaRef.current?.focus();
  // };

  const renderMessages = () => {
    if (bootstrapping || chat.loadingMessages) {
      return (
        <div className="ai-chat-widget-loading">
          <CircularProgress size={22} />
        </div>
      );
    }

    if (chat.messages.length === 0 && !chat.sending) {
      return <WidgetWelcome greeting={greeting} />;
    }

    return chat.messages.map((item) => (
      <AiChatMessageBubble key={item.id} item={item} onCopy={chat.handleCopy} compact />
    ));
  };

  return (
    <div className="ai-chat-widget-panel" role="dialog" aria-label="LinguistAI chat">
      <header className="ai-chat-widget-header">
        <div className="ai-chat-widget-header-brand">
          <div className="ai-chat-widget-avatar-wrap">
            <img
              src="/images/ai-robot-helper-mascot.png"
              alt="LinguistAI"
              className="ai-chat-widget-avatar"
              style={{ width: 32, height: 32, objectFit: "cover", borderRadius: "50%" }}
            />
            <span className="ai-chat-widget-online-dot" aria-hidden />
          </div>
          <div>
            <div className="ai-chat-widget-title">LinguistAI</div>
            <div className="ai-chat-widget-status">Online</div>
          </div>
        </div>
        <div className="ai-chat-widget-header-actions">
          <button type="button" className="ai-chat-widget-icon-btn" aria-label="Minimize" onClick={onClose}>
            <RemoveRoundedIcon sx={{ fontSize: 20 }} />
          </button>
          <button type="button" className="ai-chat-widget-icon-btn" aria-label="Close chat" onClick={onClose}>
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
      </header>

      <div
        className={`ai-chat-widget-messages${chat.messages.length === 0 && !chat.sending ? " ai-chat-widget-messages--empty" : ""}`}
      >
        <div className="ai-chat-widget-messages-inner">
          {renderMessages()}
          <div ref={chat.messagesEndRef} />
        </div>
      </div>

      <footer className="ai-chat-widget-footer">
        {chat.error ? <div className="ai-assistant-error ai-chat-widget-error">{chat.error}</div> : null}

        {/* Tạm ẩn gợi ý nhanh
        <div className="ai-chat-widget-chips">
          {WIDGET_SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className="ai-chat-widget-chip"
              onClick={() => handleSuggestionClick(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
        */}

        <div className="ai-chat-widget-input-row">
          <button type="button" className="ai-chat-widget-input-side-btn" title="Voice input" aria-label="Voice input">
            <MicRoundedIcon sx={{ fontSize: 20 }} />
          </button>
          <input
            className="ai-chat-widget-input"
            type="text"
            placeholder="Ask anything..."
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
          <button
            type="button"
            className="ai-chat-widget-send-btn"
            disabled={!chat.input.trim() || chat.sending || bootstrapping}
            onClick={() => void chat.sendMessage()}
            aria-label="Send message"
          >
            {chat.sending ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon sx={{ fontSize: 20 }} />}
          </button>
        </div>

        <div className="ai-chat-widget-powered">
          Powered by LinguistAI
          {showFullChatLink ? (
            <Link to={`/${paths.ADMIN}/${paths.AI_ASSISTANT}`} className="ai-chat-widget-full-link">
              Open full chat
            </Link>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

type AiChatFabProps = {
  onClick: () => void;
};

export function AiChatFab({ onClick }: AiChatFabProps) {
  return (
    <button
      type="button"
      className="ai-chat-fab"
      aria-label="Open LinguistAI chat"
      onClick={onClick}
    >
      <ChatRoundedIcon sx={{ fontSize: 28 }} />
    </button>
  );
}
