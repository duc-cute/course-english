import { useCallback, useState } from "react";
import {
  apiCancelOnlineClassStart,
  apiSaveMeetingLink,
  apiStartOnlineClass,
  type ClassSessionRecord,
} from "../../../shared/api/classSession";

const MEET_NEW_URL = "https://meet.new";

export function useOnlineClassFlow(onRefresh: () => void | Promise<void>) {
  const [pasteSession, setPasteSession] = useState<ClassSessionRecord | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [flowError, setFlowError] = useState("");

  const handleStartOnlineClass = useCallback(async (session: ClassSessionRecord) => {
    setFlowError("");
    setStartingId(session.id);
    try {
      const updated = await apiStartOnlineClass(session.id);
      window.open(MEET_NEW_URL, "_blank", "noopener,noreferrer");
      setPasteSession(updated);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        "Không thể bắt đầu lớp online.";
      setFlowError(message);
    } finally {
      setStartingId(null);
    }
  }, []);

  const openPasteDialog = useCallback((session: ClassSessionRecord) => {
    setFlowError("");
    setPasteSession(session);
  }, []);

  const closePasteDialog = useCallback(() => {
    setPasteSession(null);
  }, []);

  const handleSaveMeetingLink = useCallback(
    async (meetLink: string) => {
      if (!pasteSession) return;
      setFlowError("");
      const saved = await apiSaveMeetingLink(pasteSession.id, meetLink);
      setPasteSession(null);
      await onRefresh();
      return saved;
    },
    [onRefresh, pasteSession],
  );

  const handleCancelOnlineClassStart = useCallback(async () => {
    if (!pasteSession) return;
    setFlowError("");
    await apiCancelOnlineClassStart(pasteSession.id);
    setPasteSession(null);
    await onRefresh();
  }, [onRefresh, pasteSession]);

  return {
    pasteSession,
    startingId,
    flowError,
    setFlowError,
    handleStartOnlineClass,
    openPasteDialog,
    closePasteDialog,
    handleSaveMeetingLink,
    handleCancelOnlineClassStart,
  };
}
