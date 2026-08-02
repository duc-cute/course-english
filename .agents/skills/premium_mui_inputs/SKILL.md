---
name: premium_mui_inputs
description: Guide and CSS snippets for styling Material UI inputs, TextFields, Select dropdowns, and active tab chips to achieve a premium, modern design with continuous borders and no notched labels.
---

# Redesigning Material UI (MUI) Inputs to a Premium Aesthetic

This skill provides the CSS patterns and React implementation practices to style Material UI (MUI) text inputs, select dropdowns, search boxes, and tab selectors into a modern, high-end visual design.

## Core Design Principles

1. **Continuous Rounded Outlines**: Avoid default notched labels that cut through the top border of `TextField`. Instead, keep labels inline, use placeholders, or set prefixes inside option items, leaving the border line continuous and beautifully rounded (`border-radius: 10px` or `12px`).
2. **Soft Borders & Transitions**: Use subtle, low-contrast border colors (e.g. `#cbd5e1`, `#e2e8f0`) by default, and transition smoothly with a soft blue focus state and a translucent glow (`box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1)`).
3. **Pill Tab Selector Chips**: Avoid plain tab lines. Use fully rounded pill-shaped chip buttons (`border-radius: 20px` or `50px`) with high contrast active colors (`#2563eb`) and very soft hover states.

---

## 1. Redesigning Search Inputs and Buttons

### React Component Layout (TSX)
```tsx
import { Box, TextField, Button } from "@mui/material";

<Box className="premium-search-row">
  <TextField
    size="small"
    className="premium-search-field"
    placeholder="Search stories, documents..."
    value={searchInput}
    onChange={(e) => setSearchInput(e.target.value)}
  />
  <Button className="premium-search-btn" onClick={handleSearch}>
    Search
  </Button>
</Box>
```

### CSS Styling
```css
.premium-search-row {
  display: flex;
  gap: 12px;
  max-width: 480px;
}

.premium-search-field {
  flex: 1;
}

.premium-search-field .MuiOutlinedInput-root {
  background: #ffffff;
  border-radius: 10px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.premium-search-field .MuiOutlinedInput-notchedOutline {
  border-color: #e2e8f0;
}

.premium-search-field:hover .MuiOutlinedInput-notchedOutline {
  border-color: #cbd5e1;
}

.premium-search-field .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.premium-search-btn {
  text-transform: uppercase !important;
  font-weight: 700 !important;
  border-radius: 10px !important;
  padding: 0 24px !important;
  border: 1.5px solid #2563eb !important;
  color: #2563eb !important;
  font-size: 0.8125rem !important;
  letter-spacing: 0.05em !important;
  transition: all 0.2s ease !important;
}

.premium-search-btn:hover {
  background: rgba(37, 99, 235, 0.05) !important;
  border-color: #1d4ed8 !important;
  color: #1d4ed8 !important;
}
```

---

## 2. Redesigning Select Dropdowns (No Floating Notched Labels)

To match modern SaaS UIs, remove `label` attributes on MUI Select components so they don't notch the borders. Put contextual labels inside the options instead.

### React Component Layout (TSX)
```tsx
import { Box, TextField, MenuItem } from "@mui/material";

<Box className="premium-select-wrap">
  <TextField
    select
    size="small"
    value={levelFilter}
    onChange={(e) => setLevelFilter(e.target.value)}
    fullWidth
  >
    <MenuItem value="ALL">Cấp độ</MenuItem>
    {["A1", "A2", "B1", "B2"].map((lv) => (
      <MenuItem key={lv} value={lv}>
        Cấp độ: {lv}
      </MenuItem>
    ))}
  </TextField>
</Box>
```

### CSS Styling
```css
.premium-select-wrap {
  min-width: 120px;
}

.premium-select-wrap .MuiOutlinedInput-root {
  background: #ffffff;
  border-radius: 10px;
  height: 38px;
  font-size: 0.825rem;
  font-weight: 500;
  color: #334155;
  transition: all 0.2s ease;
}

.premium-select-wrap .MuiOutlinedInput-notchedOutline {
  border-color: #cbd5e1 !important;
  border-width: 1px !important;
}

.premium-select-wrap:hover .MuiOutlinedInput-notchedOutline {
  border-color: #94a3b8 !important;
}

.premium-select-wrap .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
  border-color: #2563eb !important;
  border-width: 1px !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

---

## 3. Redesigning Pill Tab Chips

### React Component Layout (TSX)
```tsx
import { Box, Button } from "@mui/material";

<Box className="premium-filter-tabs">
  {[
    { id: "ALL", label: "Tất cả" },
    { id: "PUBLISHED", label: "Published" },
  ].map((tab) => (
    <Button
      key={tab.id}
      className={`premium-filter-tab ${activeTab === tab.id ? "premium-filter-tab--active" : ""}`}
      onClick={() => setActiveTab(tab.id)}
    >
      {tab.label}
    </Button>
  ))}
</Box>
```

### CSS Styling
```css
.premium-filter-tabs {
  display: flex;
  gap: 8px;
}

.premium-filter-tab {
  text-transform: none !important;
  font-weight: 500 !important;
  border-radius: 20px !important;
  padding: 5px 16px !important;
  font-size: 0.8125rem !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff;
  color: #64748b !important;
  transition: all 0.2s ease !important;
}

.premium-filter-tab:hover {
  background: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #334155 !important;
}

.premium-filter-tab--active {
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: #ffffff !important;
  font-weight: 600 !important;
}
```
