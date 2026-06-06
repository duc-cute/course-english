/** EMR disclosure UI tokens — local copy (Archetype B/C). Do not import from other features. */

export const muCard = {
  background: "#fff",
  border: "1px solid #D3D1C7",
  borderRadius: "10px",
  padding: "12px 14px",
} as const;

/** Panel dùng với MUI `sx` — borderRadius dạng px, tránh nhân theme spacing */
export const muPanelSx = {
  bgcolor: "#fff",
  border: "1px solid #D3D1C7",
  borderRadius: "8px",
  p: { xs: 1.25, md: 1.5 },
  mb: 1.5,
  width: "100%",
  boxSizing: "border-box",
} as const;

export const muCardCompact = {
  ...muCard,
  padding: "8px 10px",
} as const;

/** Trang danh mục — toolbar gọn, ít khoảng trống */
export const muPageShell = {
  p: { xs: 1.5, md: 2 },
} as const;

export const muPageTitle = {
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 8,
  color: "#0C447C",
  display: "flex",
  alignItems: "center",
  gap: 6,
} as const;

export const muToolbarCard = {
  ...muCardCompact,
  borderRadius: 6,
  marginBottom: 8,
  padding: "6px 8px",
} as const;

const muBtnSmBase = {
  borderRadius: 4,
  padding: "2px 8px",
  fontSize: 12,
  fontWeight: 500,
  minHeight: 28,
  lineHeight: 1.3,
  textTransform: "none" as const,
  whiteSpace: "nowrap" as const,
  boxShadow: "none",
  flexShrink: 0,
  "& .MuiButton-startIcon": {
    marginRight: "4px",
    marginLeft: 0,
  },
  "& .MuiButton-startIcon > *:nth-of-type(1)": {
    fontSize: 15,
  },
};

export const muBtnSmPrimary = {
  ...muBtnSmBase,
  background: "linear-gradient(135deg, #1a6bb5 0%, #0C447C 100%)",
  color: "#fff",
  border: "none",
  "&:hover": {
    background: "linear-gradient(135deg, #1a6bb5 0%, #0a3a6a 100%)",
    boxShadow: "none",
  },
};

export const muBtnSmOutlined = {
  ...muBtnSmBase,
  color: "#0C447C",
  borderColor: "#D3D1C7",
  background: "#fff",
  padding: "1px 8px",
  "&:hover": {
    borderColor: "#85B7EB",
    background: "#F9F8F5",
  },
};

export const muToolbarRow = {
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  gap: 0.75,
  rowGap: 0.75,
};

export const muToolbarDivider = {
  width: "1px",
  height: 22,
  bgcolor: "#ECEAE3",
  mx: 0.25,
  flexShrink: 0,
  display: { xs: "none", md: "block" },
};

export const muCardTitle = {
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 10,
  color: "#0C447C",
  display: "flex",
  alignItems: "center",
  gap: 6,
} as const;

export const muFieldLabel = {
  fontSize: 11,
  color: "#888780",
  fontWeight: 500,
  marginBottom: 2,
  display: "block",
} as const;

export const muHighlightBox = {
  padding: "10px 12px",
  background: "#E6F1FB",
  border: "1px solid #85B7EB",
  borderRadius: 8,
  marginBottom: 10,
} as const;

export const muSummaryTile = {
  background: "#E6F1FB",
  borderRadius: 6,
  padding: "8px 10px",
  textAlign: "center" as const,
};

export const muSummaryValue = {
  fontSize: 14,
  fontWeight: 700,
  color: "#185FA5",
  lineHeight: 1.3,
};

export const muSummaryLabel = {
  fontSize: 11,
  color: "#888780",
  marginBottom: 4,
};

export const muStickyFooter = {
  position: "sticky" as const,
  bottom: 0,
  marginTop: 10,
  padding: "10px 12px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, #fff 40%)",
  borderTop: "1px solid #D3D1C7",
  boxShadow: "0 -6px 16px rgba(12, 68, 124, 0.08)",
  display: "flex",
  gap: 12,
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap" as const,
  zIndex: 5,
};

export const muFooterBtnPrimary = {
  borderRadius: 8,
  padding: "7px 18px",
  fontSize: 13,
  fontWeight: 600,
  textTransform: "none" as const,
  background: "linear-gradient(135deg, #1a6bb5 0%, #0C447C 100%)",
  color: "#fff",
  border: "none",
  boxShadow: "none",
  "&:hover": {
    background: "linear-gradient(135deg, #1a6bb5 0%, #0a3a6a 100%)",
    boxShadow: "none",
  },
  "&.Mui-disabled": {
    color: "rgba(255,255,255,0.7)",
    background: "linear-gradient(135deg, #7eb3d8 0%, #5a8ab0 100%)",
  },
};

export const muFooterBtnOutlined = {
  borderRadius: 8,
  padding: "7px 14px",
  fontSize: 13,
  fontWeight: 600,
  textTransform: "none" as const,
  color: "#0C447C",
  borderColor: "#D3D1C7",
  background: "#fff",
  "&:hover": {
    borderColor: "#85B7EB",
    background: "#F9F8F5",
  },
};

export const muFooterBtnDanger = {
  ...muFooterBtnOutlined,
  color: "#E24B4A",
  borderColor: "#E24B4A",
  "&:hover": {
    borderColor: "#E24B4A",
    background: "#FCEBEB",
  },
};

export const muEmptyState = {
  padding: "16px 12px",
  textAlign: "center" as const,
  background: "#F9F8F5",
  borderRadius: 8,
  fontSize: 12.5,
  color: "#5F5E5A",
};

export const muTableWrap = {
  border: "1px solid #ECEAE3",
  borderRadius: 6,
  overflow: "hidden",
  marginTop: 6,
};

/** Bảng danh mục (lớp/môn/phân lớp) — cuộn ngang khi cột rộng */
export const muCatalogTableShell = {
  border: "1px solid #D3D1C7",
  borderRadius: 2,
  bgcolor: "#fff",
  overflowX: "auto",
  overflowY: "visible",
  maxWidth: "100%",
};

export const muTh = {
  padding: "6px 8px",
  fontSize: 11.5,
  fontWeight: 600,
  color: "#0C447C",
  borderBottom: "1px solid #D3D1C7",
  background: "#F1EFE8",
  textAlign: "left" as const,
};

export const muTd = {
  padding: "6px 8px",
  fontSize: 12.5,
  verticalAlign: "middle" as const,
  borderBottom: "1px solid #ECEAE3",
  color: "#333",
};

export const muRoleAdmin = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  background: "#E6F1FB",
  color: "#0C447C",
  border: "1px solid #85B7EB",
};

export const muRoleUser = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  background: "#F9F8F5",
  color: "#5F5E5A",
  border: "1px solid #D3D1C7",
};

export const muTextFieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 32,
    fontSize: 13,
    borderRadius: "8px",
    background: "#fff",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#D3D1C7",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#85B7EB",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#185FA5",
  },
  "& .MuiFormHelperText-root": {
    fontSize: 11,
    marginLeft: 0,
  },
};

export const muToolbarSearchField = {
  ...muTextFieldSx,
  flex: "1 1 200px",
  minWidth: 160,
  maxWidth: 320,
  "& .MuiOutlinedInput-root": {
    minHeight: 28,
    fontSize: 12,
    borderRadius: "4px",
  },
};

export const muDialogPaper = {
  borderRadius: "10px",
  border: "1px solid #D3D1C7",
  boxShadow: "0 12px 40px rgba(12, 68, 124, 0.12)",
  overflow: "hidden",
};

/** Footer cố định dưới dialog — không sticky, không margin âm (tránh scrollbar ngang). */
export const muDialogFooter = {
  margin: 0,
  padding: "10px 16px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, #fff 40%)",
  borderTop: "1px solid #D3D1C7",
  display: "flex",
  gap: 12,
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap" as const,
};

export const muHighlightSubTitle = {
  fontWeight: 600,
  color: "#0C447C",
  fontSize: 12,
  marginBottom: 4,
};

export const muRequired = { color: "#E24B4A" };
