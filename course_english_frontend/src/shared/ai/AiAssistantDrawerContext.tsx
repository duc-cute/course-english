import { createContext, useContext } from "react";
import { paths } from "../constants/paths";

export type DrawerApi = {
  open: () => void;
  close: () => void;
};

export type AiAssistantDrawerContextValue = {
  registerDrawer: (api: DrawerApi) => void;
  unregisterDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  registerOpenAdminMenu: (handler: () => void) => void;
  unregisterOpenAdminMenu: () => void;
  requestOpenAdminMenu: () => void;
};

export const AiAssistantDrawerContext = createContext<AiAssistantDrawerContextValue | null>(null);

export function isAiAssistantPath(pathname: string): boolean {
  return pathname.includes(`/${paths.ADMIN}/${paths.AI_ASSISTANT}`);
}

export function useAiAssistantDrawer() {
  const ctx = useContext(AiAssistantDrawerContext);
  if (!ctx) {
    throw new Error("useAiAssistantDrawer must be used within AiAssistantDrawerProvider");
  }
  return ctx;
}

export function useAiAssistantDrawerOptional() {
  return useContext(AiAssistantDrawerContext);
}
