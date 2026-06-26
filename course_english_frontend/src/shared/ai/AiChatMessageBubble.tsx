import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import type { AiMessageRecord } from "../api/ai";
import { AiChatMarkdown } from "./AiChatMarkdown";
import { formatMessageTime } from "./aiChatUtils";

type AiChatMessageBubbleProps = {
  item: AiMessageRecord;
  onCopy: (text: string) => void;
  compact?: boolean;
};

export function AiChatMessageBubble({ item, onCopy, compact = false }: AiChatMessageBubbleProps) {
  const time = formatMessageTime(item.createdAt);
  const isStreaming = item.id.startsWith("stream-");
  const isWaitingForStream = isStreaming && !item.content.trim();

  if (item.role === "USER") {
    return (
      <div className="ai-assistant-msg-user">
        <div className="ai-assistant-bubble-user">
          <p className="ai-assistant-bubble-text">{item.content}</p>
          {time ? (
            <div className="ai-assistant-bubble-time ai-assistant-bubble-time--user">
              <span>{time}</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="ai-assistant-msg-ai">
      <div className="ai-assistant-avatar">
        <AutoAwesomeRoundedIcon sx={{ fontSize: compact ? 14 : 20 }} />
      </div>
      <div className="ai-assistant-msg-ai-body">
        <div
          className={`ai-assistant-bubble-ai${isWaitingForStream ? " ai-assistant-bubble-ai--typing" : ""}`}
        >
          {isWaitingForStream ? (
            <div className="ai-assistant-typing-dots" aria-label="AI is typing">
              <span className="ai-assistant-typing-dot" />
              <span className="ai-assistant-typing-dot" />
              <span className="ai-assistant-typing-dot" />
            </div>
          ) : item.contentType === "MARKDOWN" || isStreaming ? (
            <AiChatMarkdown content={item.content} />
          ) : (
            <p className="ai-assistant-bubble-text">{item.content}</p>
          )}
          {time && !compact && !isStreaming ? (
            <div className="ai-assistant-bubble-time">
              <span>{time}</span>
            </div>
          ) : null}
        </div>
        {!compact && !isStreaming ? (
          <div className="ai-assistant-bubble-actions">
            <button
              type="button"
              className="ai-assistant-bubble-action-btn"
              title="Copy"
              onClick={() => void onCopy(item.content)}
            >
              <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
            </button>
            <button type="button" className="ai-assistant-bubble-action-btn" title="Listen">
              <VolumeUpRoundedIcon sx={{ fontSize: 16 }} />
            </button>
            <button type="button" className="ai-assistant-bubble-action-btn" title="Helpful">
              <ThumbUpAltOutlinedIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
