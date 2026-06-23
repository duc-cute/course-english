import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import { paths } from "../constants/paths";

type DrawerApi = {
  open: () => void;
  close: () => void;
};

type AiAssistantDrawerContextValue = {
  registerDrawer: (api: DrawerApi) => void;
  unregisterDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  registerOpenAdminMenu: (handler: () => void) => void;
  unregisterOpenAdminMenu: () => void;
  requestOpenAdminMenu: () => void;
};

const AiAssistantDrawerContext = createContext<AiAssistantDrawerContextValue | null>(null);

export function isAiAssistantPath(pathname: string): boolean {
  return pathname.includes(`/${paths.ADMIN}/${paths.AI_ASSISTANT}`);
}

type AiAssistantDrawerProviderProps = {
  children: ReactNode;
  onBeforeOpenDrawer?: () => void;
};

export function AiAssistantDrawerProvider({ children, onBeforeOpenDrawer }: AiAssistantDrawerProviderProps) {
  const drawerRef = useRef<DrawerApi | null>(null);
  const adminMenuRef = useRef<(() => void) | null>(null);

  const registerDrawer = useCallback((api: DrawerApi) => {
    drawerRef.current = api;
  }, []);

  const unregisterDrawer = useCallback(() => {
    drawerRef.current = null;
  }, []);

  const openDrawer = useCallback(() => {
    onBeforeOpenDrawer?.();
    drawerRef.current?.open();
  }, [onBeforeOpenDrawer]);

  const closeDrawer = useCallback(() => {
    drawerRef.current?.close();
  }, []);

  const registerOpenAdminMenu = useCallback((handler: () => void) => {
    adminMenuRef.current = handler;
  }, []);

  const unregisterOpenAdminMenu = useCallback(() => {
    adminMenuRef.current = null;
  }, []);

  const requestOpenAdminMenu = useCallback(() => {
    drawerRef.current?.close();
    adminMenuRef.current?.();
  }, []);

  const value = useMemo(
    () => ({
      registerDrawer,
      unregisterDrawer,
      openDrawer,
      closeDrawer,
      registerOpenAdminMenu,
      unregisterOpenAdminMenu,
      requestOpenAdminMenu,
    }),
    [
      registerDrawer,
      unregisterDrawer,
      openDrawer,
      closeDrawer,
      registerOpenAdminMenu,
      unregisterOpenAdminMenu,
      requestOpenAdminMenu,
    ],
  );

  return <AiAssistantDrawerContext.Provider value={value}>{children}</AiAssistantDrawerContext.Provider>;
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
