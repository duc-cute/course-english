import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiCreateAiConversation,
  apiDeleteAiConversation,
  apiGetAiConversations,
  apiGetAiMessages,
  apiSendAiMessageStream,
  apiUpdateAiConversation,
  type AiConversationRecord,
  type AiMessageRecord,
} from "../api/ai";
import { MAX_AI_INPUT_LENGTH, sortMessagesChronologically } from "./aiChatUtils";

type UseAiChatOptions = {
  enabled?: boolean;
  autoSelectConversation?: boolean;
};

export function useAiChat({ enabled = true, autoSelectConversation = true }: UseAiChatOptions = {}) {
  const [conversations, setConversations] = useState<AiConversationRecord[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState<AiMessageRecord[]>([]);
  const [input, setInput] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const sortedMessages = useMemo(() => sortMessagesChronologically(messages), [messages]);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setError("");
    try {
      const response = await apiGetAiConversations({ page: 0, size: 30 });
      const rows = response.data?.result ?? response.result ?? [];
      const list = Array.isArray(rows) ? rows : [];
      setConversations(list);
      return list;
    } catch (err) {
      setError((err as { message?: string })?.message || "Không tải được hội thoại AI.");
      return [];
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    setError("");
    try {
      const response = await apiGetAiMessages(conversationId, { limit: 30 });
      const rows = response.data?.items ?? response.result?.items ?? [];
      setMessages(sortMessagesChronologically(Array.isArray(rows) ? rows : []));
    } catch (err) {
      setError((err as { message?: string })?.message || "Không tải được tin nhắn.");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void loadConversations().then((list) => {
      if (!autoSelectConversation) return;
      setActiveConversationId((current) => current || list[0]?.id || "");
    });
  }, [enabled, autoSelectConversation, loadConversations]);

  useEffect(() => {
    if (!enabled || !activeConversationId) return;
    void loadMessages(activeConversationId);
  }, [enabled, activeConversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const createConversation = useCallback(async () => {
    setError("");
    try {
      const response = await apiCreateAiConversation();
      const id = response.data?.id ?? response.result?.id;
      if (!id) return null;
      await loadConversations();
      setActiveConversationId(id);
      setMessages([]);
      return id;
    } catch (err) {
      setError((err as { message?: string })?.message || "Không tạo được cuộc hội thoại.");
      return null;
    }
  }, [loadConversations]);

  const ensureConversation = useCallback(async () => {
    if (activeConversationId) return activeConversationId;
    const list = conversations.length ? conversations : await loadConversations();
    const existingId = list[0]?.id;
    if (existingId) {
      setActiveConversationId(existingId);
      return existingId;
    }
    return createConversation();
  }, [activeConversationId, conversations, createConversation, loadConversations]);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const renameConversation = useCallback(
    async (conversationId: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return false;
      setError("");
      try {
        const response = await apiUpdateAiConversation(conversationId, trimmed);
        const updated = response.data ?? response.result;
        setConversations((prev) =>
          prev.map((item) =>
            item.id === conversationId ? { ...item, title: updated?.title ?? trimmed } : item,
          ),
        );
        return true;
      } catch (err) {
        setError((err as { message?: string })?.message || "Không đổi được tên hội thoại.");
        return false;
      }
    },
    [],
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      setError("");
      try {
        await apiDeleteAiConversation(conversationId);
        const list = await loadConversations();
        if (activeConversationId === conversationId) {
          const nextId = list[0]?.id ?? "";
          setActiveConversationId(nextId);
          setMessages([]);
        }
        return true;
      } catch (err) {
        setError((err as { message?: string })?.message || "Không xóa được hội thoại.");
        return false;
      }
    },
    [activeConversationId, loadConversations],
  );

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || sending) return;

      let conversationId = activeConversationId;
      if (!conversationId) {
        conversationId = (await ensureConversation()) ?? "";
      }
      if (!conversationId || content.length > MAX_AI_INPUT_LENGTH) return;

      setSending(true);
      setError("");
      const optimistic: AiMessageRecord = {
        id: `local-${Date.now()}`,
        conversationId,
        role: "USER",
        contentType: "TEXT",
        content,
        createdAt: new Date().toISOString(),
      };
      const streamId = `stream-${Date.now()}`;
      const streamingAssistant: AiMessageRecord = {
        id: streamId,
        conversationId,
        role: "ASSISTANT",
        contentType: "MARKDOWN",
        content: "",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic, streamingAssistant]);
      setInput("");

      try {
        await apiSendAiMessageStream(conversationId, content, {
          onChunk: (delta) => {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === streamId ? { ...item, content: item.content + delta } : item,
              ),
            );
          },
          onDone: (assistant) => {
            setMessages((prev) => {
              const withoutStream = prev.filter((item) => item.id !== streamId);
              const next = assistant ? [...withoutStream, assistant] : withoutStream;
              return sortMessagesChronologically(next);
            });
          },
          onError: (message) => {
            throw new Error(message);
          },
        });
        await loadConversations();
      } catch (err) {
        setError((err as { message?: string })?.message || "Không gửi được tin nhắn.");
        setMessages((prev) => prev.filter((item) => item.id !== optimistic.id && item.id !== streamId));
        setInput(content);
      } finally {
        setSending(false);
      }
    },
    [activeConversationId, ensureConversation, input, loadConversations, sending],
  );

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  return {
    conversations,
    activeConversationId,
    activeConversation,
    messages: sortedMessages,
    input,
    setInput,
    loadingConversations,
    loadingMessages,
    sending,
    error,
    messagesEndRef,
    textareaRef,
    loadConversations,
    loadMessages,
    createConversation,
    ensureConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
    handleCopy,
    resizeTextarea,
  };
}
