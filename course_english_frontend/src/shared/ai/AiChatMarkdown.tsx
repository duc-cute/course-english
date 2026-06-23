import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AiChatMarkdownProps = {
  content: string;
};

export function AiChatMarkdown({ content }: AiChatMarkdownProps) {
  return (
    <div className="ai-assistant-markdown">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
