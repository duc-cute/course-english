import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { Provider } from "react-redux";
import { academicCore, academicCoreTheme } from "../theme/academicCore";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { HashLoader } from "react-spinners";
import { persistor, store } from "../redux/store";
import { useAppSelector } from "../redux/hooks";

function GlobalLoader() {
  const loading = useAppSelector((state) => state.user.loading);
  if (!loading) {
    return null;
  }
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(255,255,255,0.6)",
      }}
    >
      <HashLoader color={academicCore.primary} size={48} />
    </Box>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <ThemeProvider theme={academicCoreTheme}>
          <CssBaseline />
          {children}
          <GlobalLoader />
          <ToastContainer position="top-right" autoClose={5000} theme="light" />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
