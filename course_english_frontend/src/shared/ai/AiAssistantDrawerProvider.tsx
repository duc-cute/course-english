import { useCallback, useMemo, useRef, type ReactNode } from "react";
import {
  AiAssistantDrawerContext,
  type AiAssistantDrawerContextValue,
  type DrawerApi,
} from "./AiAssistantDrawerContext";

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

  const value = useMemo<AiAssistantDrawerContextValue>(
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
