import { createTheme } from "@mui/material/styles";

/** Design tokens — Academic Core (design/stitch_lms_teacher_admin_dashboard/DESIGN.md) */
export const academicCore = {
  primary: "#004ac6",
  onPrimary: "#ffffff",
  primaryContainer: "#2563eb",
  primaryFixed: "#dbe1ff",
  primaryFixedDim: "#b4c5ff",
  secondary: "#006c49",
  onSecondaryContainer: "#00714d",
  secondaryFixed: "#6ffbbe",
  secondaryContainer: "#6cf8bb",
  tertiaryFixed: "#ffddb8",
  onTertiaryFixedVariant: "#653e00",
  surface: "#f8f9ff",
  background: "#f8f9ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#eff4ff",
  surfaceContainer: "#e5eeff",
  surfaceContainerHigh: "#dce9ff",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#434655",
  outline: "#737686",
  outlineVariant: "#c3c6d7",
  error: "#ba1a1a",
} as const;

export const ADMIN_DRAWER_WIDTH = 260;
export const ADMIN_HEADER_HEIGHT = 64;

export const academicCoreTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: academicCore.primary,
      contrastText: academicCore.onPrimary,
    },
    secondary: {
      main: academicCore.secondary,
    },
    background: {
      default: academicCore.background,
      paper: academicCore.surfaceContainerLowest,
    },
    text: {
      primary: academicCore.onSurface,
      secondary: academicCore.onSurfaceVariant,
    },
    divider: academicCore.outlineVariant,
    error: {
      main: academicCore.error,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.33 },
    h5: { fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.4 },
    h6: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.5 },
    body1: { fontSize: "1rem", lineHeight: 1.5 },
    body2: { fontSize: "0.875rem", lineHeight: 1.43 },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.05em",
      lineHeight: 1.33,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: academicCore.background,
          color: academicCore.onSurface,
        },
      },
    },
  },
});
