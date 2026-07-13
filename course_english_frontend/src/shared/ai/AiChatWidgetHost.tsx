import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { paths } from "../constants/paths";
import { getAccessToken } from "../auth/token";
import { AiChatFab, AiChatWidget } from "./AiChatWidget";

const AUTH_PATHS = new Set([
  `/${paths.LOGIN}`,
  `/${paths.REGISTER}`,
  `/${paths.FORGOT_PASSWORD}`,
  `/${paths.RESET_PASSWORD}`,
]);

const FULL_PAGE_PATH = `/${paths.ADMIN}/${paths.AI_ASSISTANT}`;

export function AiChatWidgetHost() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => Boolean(getAccessToken()));

  useEffect(() => {
    setAuthenticated(Boolean(getAccessToken()));
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const visible = useMemo(() => {
    if (!authenticated) return false;
    if (AUTH_PATHS.has(location.pathname)) return false;
    if (location.pathname === FULL_PAGE_PATH) return false;
    // Immersive story reader has its own layout — FAB overlaps the journey panel.
    if (/^\/student\/stories\/[^/]+$/.test(location.pathname)) return false;
    return true;
  }, [authenticated, location.pathname]);

  if (!visible) return null;

  return (
    <div className={`ai-chat-widget-host${open ? " is-open" : ""}`}>
      {open ? <AiChatWidget onClose={() => setOpen(false)} /> : <AiChatFab onClick={() => setOpen(true)} />}
    </div>
  );
}
