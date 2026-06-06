---
name: emr-disclosure-ui-style
description: >-
  Unified EMR Boarding & clinical UI style: disclosure sheets, InfusionFormula
  popups, Consultation forms, compact tables, sticky footers. Canonical refs —
  DisclosureSheet, DisclosureDailySummary, InfusionFormula.jsx,
  InfusionFlowTab.jsx. Use for phiếu công khai, y lệnh truyền dịch, hội chẩn,
  inpatient popups, or when user asks InfusionFormula / disclosure / clinical form style.
disable-model-invocation: true
---

# EMR Boarding & Clinical UI Style

## Goal

Build or polish **inpatient clinical screens** with one shared visual system: compact density, blue-accent medical palette, card sections, highlight boxes for critical fields, sticky footers — **not** default MUI chrome.

Pick the **archetype** that matches the screen, then copy tokens from the closest reference file.

---

## Canonical references

| Archetype | Primary file | Also see |
| --------- | ------------ | -------- |
| **A** Full-page workspace (list + detail) | `Boarding/DisclosureSheet/` | `disclosureSheetUiStyles.js`, `DisclosurePatientBar.jsx` |
| **B** List / report (search + table) | `Boarding/DisclosureDailySummary/` | `disclosureDailySummaryUtils.js` (status colors) |
| **C** Clinical popup / multi-section form | `Boarding/.../Popup/InfusionFormula.jsx` | `PatientInfo/Tabs/Consultation/ConsultationFormPopup.jsx`, `consultationUiStyles.js` |
| **D** Business-process documentation tab | `Management/BusinessProcess/tabs/InfusionFlowTab.jsx` | `BusinessProcess.scss` (`.bp-infusion`, `.if-*`) |

**Production forms** → Archetype **A**, **B**, or **C**.  
**Internal BA/Dev spec pages** → Archetype **D** only (do not copy `bp-*` into patient-facing popups).

---

## Unified color palette

Do not invent colors outside this set for Archetypes A–C:

| Role | Hex | Usage |
| ---- | --- | ----- |
| Title / section | `#0C447C` | Card titles, section headers, tile labels |
| Value / links / hints | `#185FA5` | Bold stats, inline hints, attended checkbox |
| Muted label | `#888780` | `fieldLabel`, secondary text |
| Body | `#333` / `#5F5E5A` | Content, empty-state copy |
| Border | `#D3D1C7` | Card border, footer top, table header |
| Inner divider | `#ECEAE3` | Split inside card (InfusionFormula) |
| Row divider | `#EEEDEA` | Member rows, tree cells |
| Highlight bg | `#E6F1FB` | Highlight box, selected/chairman row, tiles |
| Highlight border | `#85B7EB` | Highlight box, dashed inner divider |
| Patient bar bg | `#F1EFE8` | BN context strip; infusion table thead |
| Required `*` | `#E24B4A` | Mandatory field marker |
| Error text / delete | `#E24B4A` | Validation, trash icon |
| Warning text | `#B00020` | Over-limit (e.g. infusion speed) |
| Note / empty bg | `#F9F8F5` | Empty members, hint box |
| Allergy alert bg | `#FCEBEB` / text `#791F1F` | PatientBar allergy strip (InfusionFormula) |

Archetype **D** may use `BusinessProcess.scss` role colors (`#1f6feb` doctor, `#1f8a4c` nurse) for diagrams — map to palette above when embedding diagrams inside clinical UI.

---

## Style tokens — `*UiStyles.js`

Create `<Feature>UiStyles.js` beside the feature. **Copy** from an existing file; **do not import** another feature’s styles.

| Source | Export prefix | When to copy from |
| ------ | ------------- | ----------------- |
| `DisclosureSheet/disclosureSheetUiStyles.js` | `ds*` | Full-page disclosure, sticky footer with gradient primary |
| `Consultation/consultationUiStyles.js` | `cn*` | Single-column popup, member rows, compact cards |
| `InfusionFormula.jsx` (inline ~L181–202) | `card`, `cardTitle`, `fieldLabel` | Single popup file only |

### Required token objects

```javascript
export const card = {
  background: "#fff",
  border: "1px solid #D3D1C7",
  borderRadius: 10,
  padding: "12px 14px",
};

export const cardCompact = { ...card, padding: "8px 10px" };

export const cardTitle = {
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 10,
  color: "#0C447C",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

export const fieldLabel = {
  fontSize: 11,
  color: "#888780",
  fontWeight: 500,
  marginBottom: 2,
};

export const highlightBox = {
  padding: "10px 12px",
  background: "#E6F1FB",
  border: "1px solid #85B7EB",
  borderRadius: 8,
  marginBottom: 10,
};

export const patientBar = {
  background: "#F1EFE8",
  borderRadius: 8,
  padding: "7px 14px",
  display: "flex",
  flexWrap: "wrap",
  gap: "2px 22px",
  fontSize: 12.5,
};

export const summaryTile = {
  background: "#E6F1FB",
  borderRadius: 6,
  padding: "8px 10px",
  textAlign: "center",
};

export const stickyFooter = {
  position: "sticky",
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
  flexWrap: "wrap",
  zIndex: 5,
};

export const footerBtnPrimary = {
  borderRadius: 8,
  padding: "7px 18px",
  fontSize: 13,
  fontWeight: 600,
  background: "linear-gradient(135deg, #1a6bb5 0%, #0C447C 100%) !important",
  color: "#fff !important",
  border: "none !important",
};
```

Disclosure-only extras: `dsEmptyState`, `dsSectionRowStyle`, `dsFooterHint`, `dsFooterBtnPrint`.  
Consultation-only: `cnMemberRow`, `cnOpinionInput`, `cnTableFieldProps` (`size: "small"`).

---

## Archetype A — Full-page clinical workspace (DisclosureSheet)

**Use for:** patient list + editable detail, save/print, URL embedded mode.

### Page shell

```javascript
<div style={{ padding: "0 4px" }}>
  <div style={{ ...card, marginBottom: 10, padding: "10px 14px" }}>
    <div style={{ ...cardTitle, marginBottom: 0 }}>📋 Screen title</div>
    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888780" }}>One-line hint</p>
    {episode && <DisclosurePatientBar episode={episode} />}
  </div>
  <div style={{
    display: "grid",
    gridTemplateColumns: showList ? "minmax(280px, 340px) minmax(0, 1fr)" : "minmax(0, 1fr)",
    gap: 10,
    alignItems: "start",
  }}>
    {showList && <LeftPanel />}
    <DetailPanel />
  </div>
</div>
```

### Embedded patient mode

URL `patientId` + `episodeOfCareId`: hide left list, `initFromPatientContext`, show patient bar.  
Always `resetStore()` on unmount.

### Detail inner grid

```javascript
gridTemplateColumns: "minmax(0, 1.35fr) minmax(260px, 0.85fr)";
```

- **Left:** `highlightBox` (date `*`, note) → `card` + `TableComponent` + `stickyFooter`
- **Right:** summary / history cards

### Table

- Section rows: `getRowStyle` → `#E6F1FB`, title `#0C447C`
- Selected row: `#E6F1FB`
- Important numbers: bold `#185FA5`
- `maxHeight: "calc(100vh - 340px)"` on dense tables

---

## Archetype B — List / report (DisclosureDailySummary)

**Use for:** Formik search + paginated `TableComponent`, status legend, row preview/print.

### Shell

Two `section.cards-container` blocks: filters + results.  
Responsive filters: `xs={12} sm={6} md={2}`.  
Status legend above table (colors from utils, not ad-hoc per screen).

### Prefilled URL mode

Hide filters; show compact summary + `← Quay lại lập phiếu` with `patientId` + `episodeOfCareId`.

---

## Archetype C — Clinical popup form (InfusionFormula pattern)

**Use for:** `Popup` / `PopupForm` with Formik, long forms, optional patient context.

**Canonical layout:** `InfusionFormula.jsx` → `InfusionOrderForm`.

### Shell

```javascript
<PopupForm open size="xl" title="..." formik={{...}} hideFooter>
  {(form) => (
    <div style={{ padding: "4px 2px", fontSize: 13 }}>
      <PatientBar />   {/* optional — omit if parent page already shows BN */}
      <MainGrid />
      <StickyFooter />
    </div>
  )}
</PopupForm>
```

Use `hideFooter` on `PopupForm` and place actions in **internal** sticky footer (InfusionFormula L546–579).

### C1 — Two-column popup (default for complex forms)

```javascript
display: "grid",
gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)",
gap: 12,
marginTop: 10,
alignItems: "start",
```

| Column | Content |
| ------ | ------- |
| **Left** | Primary editable block: composition table, member list, main `FieldArray` |
| **Right** | `highlightBox` stack: date + doctor + location/diagnosis; config cards; `ComputedTiles` / summary |

**Highlight box** (InfusionFormula L433–500): single `#E6F1FB` container with internal `gap: 10`, dashed divider `#85B7EB`, subsection titles:

```javascript
<div style={{ fontWeight: 600, color: "#0C447C", fontSize: 12, marginBottom: 4 }}>
  📅 Ngày tạo <span style={{ color: "#E24B4A" }}>*</span>
</div>
```

Optional hint row: `fontSize: 12`, `color: "#185FA5"`.

**Summary tiles** (`ComputedTiles`, `SummaryBox`): 2×2 `summaryTile`; values `#185FA5` 14px bold.

**PatientBar** (InfusionFormula L589–690): `patientInfoStore`; allergy strip `#FCEBEB` when `listAllergySpecialtyPharmacy` present.

### C2 — Single-column stacked popup (Consultation, minutes)

When horizontal space is tight or sections are sequential:

```javascript
<div style={{ padding: "4px 2px", fontSize: 13, color: "#333" }}>
  {highlightBox}      {/* critical fields only */}
  {card}              {/* main text areas */}
  {cardCompact}       {/* members / tables */}
  {stickyFooter}      {/* hint left + cnFooterBtn* right */}
</div>
```

Reference: `ConsultationFormPopup.jsx`, `ConsultationMinutesIndex.jsx`, `consultationUiStyles.js`.

- **No patient bar** if BN already in parent tab header (user preference).
- Textareas: `rows={2}` in popups to avoid scroll.
- Member table: `cn-members-table-wrap` + `cnTableFieldProps` (`consultationMembersTable.scss`).
- Chairman / attended row: `background: "#E6F1FB"`.

### Compact inline table (Infusion additives — prefer for dense edit rows)

Not `v2-table` — native `<table>` inside bordered wrapper:

```javascript
<div style={{ border: "1px solid #ECEAE3", borderRadius: 8, overflow: "hidden" }}>
  <table style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse", tableLayout: "fixed" }}>
```

```javascript
const th = { padding: "6px 8px", fontSize: 11.5, borderBottom: "1px solid #D3D1C7" };
const td = { padding: "4px 6px", verticalAlign: "middle", borderBottom: "1px solid #ECEAE3" };
```

Thead background `#F1EFE8`. Empty row: italic `#888`, `padding: 10`.

### Compact `v2-table` in popup (Consultation members)

```scss
// <Feature>MembersTable.scss — scope under .cn-members-table-wrap
.v2-table th { padding: 4px 6px; font-size: 10px; }
.v2-table td { padding: 3px 5px; }
.MuiFormControl-root { margin: 0 !important; }
.MuiOutlinedInput-root { min-height: 30px; }
```

Pass `size="small"` on Globits fields in cells.

### Sticky footer variants

| Variant | Actions | Hint |
| ------- | ------- | ---- |
| Disclosure | Gradient primary save | Selected row count |
| Infusion | Outlined list / danger cancel / gray close / contained save | Optional — often none |
| Consultation | Print outlined + gradient save + secondary close | Phiếu code + status |

Popup-level footer: reset negative margins (`marginLeft: 0`) when not inside padded card.

### Field grouping title styles

| Style | Use |
| ----- | --- |
| `cardTitle` + emoji | Section header inside `card` |
| `fieldLabel` + control | Standard field |
| `#0C447C` 12px semibold + `*` | Inside `highlightBox` only |

---

## Archetype D — Business process doc (InfusionFlowTab)

**Use for:** `Management/BusinessProcess` tabs documenting workflows — **not** patient data entry.

### Structure

```jsx
<div className="bp-flow-container bp-infusion bp-mode-{view}">
  <div className="bp-view-toggle">...</div>
  <div className="bp-section">
    <div className="bp-section-title">
      <span className="bp-section-num">1</span> Title <span className="bp-tag">Tag</span>
    </div>
    <div className="bp-desc">...</div>
    <div className="bp-callout bp-callout-ok">...</div>
  </div>
</div>
```

### Infusion-specific blocks (from `InfusionFlowTab.jsx` + SCSS)

| Class | Purpose |
| ----- | ------- |
| `.if-state-pipe` + `.if-state` | Order status flow (pill badges) |
| `.if-roles` + `.if-role-card` | Doctor vs nurse responsibility cards |
| `.if-five-rules` + `.if-rule` | “5 đúng” nursing grid |
| `.if-formula` | Monospace formula highlight box |
| `.bp-api-table` | Field spec tables (`FieldTable` helper) |
| `.if-req-yes` / `.if-req-no` | Required column styling |

Toggle: `bp-view-toggle` — `ba` | `dev` | `both` for BA vs developer field specs.

When **implementing** Archetype C from a spec tab, translate `.bp-api-table` rows into real Globits fields — do not render spec tables in production popups.

---

## Shared implementation rules

### Forms & components

| Need | Use |
| ---- | --- |
| Text / number / date | `GlobitsTextField`, `GlobitsNumberInput`, `GlobitsDateTimePicker` |
| Staff / dept / drug | `GlobitsPagingAutocomplete` + service `paging*` |
| Enum | `GlobitsSelectInput` + `LocalConst` |
| Buttons | `CommonButton` — `variant="outlined"` secondary; gradient or `btn-orange` primary |
| Tables (list screens) | `TableComponent` + `dataPagination` |
| State | `observer` + `memo`, `useStore().boardingStore.*` |

### Print & signature

- Hidden: `<div style={{ display: "none" }}><Print ref={...} /></div>`
- `useReactToPrint`; page style from feature print utils
- `IntegratedSignatureModalV3` when `ENABLE_SIGNATURE`

### File layout (new Boarding feature)

```
Boarding/<Feature>/
├── <Feature>Index.jsx
├── <Feature>Store.js
├── <Feature>UiStyles.js          # Archetype A/C
├── <Feature>DetailPanel.jsx
├── <Feature>*Popup.jsx
├── *Print.jsx
├── *MembersTable.scss            # optional compact table
└── *Utils.js
```

### Patient bar — when to show

| Show | Skip |
| ---- | ---- |
| Standalone route (disclosure-sheet) | Tab already shows BN header (Consultation tab) |
| Popup opened from generic list | Read-only view with status card only |

Fields (pick subset): BN, Mã BN, Số BA, Tuổi/Giới, Khoa-Phòng-Giường, Vào viện, BHYT, Địa chỉ, allergy strip.

---

## Quick mapping: reference → new screen

| Reference | Reuse as |
| --------- | ---------- |
| `DisclosureSheetDetailPanel` | Full-page list + detail + disclosure table |
| `DisclosureDailySummary` | Search + legend + paginated list |
| `InfusionFormula` `PatientBar` | Context strip + allergy |
| `InfusionFormula` highlight box | Date + prescriber + location/ICD |
| `InfusionFormula` left card + `AdditivesSection` | Primary list + inline compact table |
| `InfusionFormula` `ComputedTiles` | Live summary tiles |
| `InfusionFormula` sticky footer | Save / cancel / close |
| `ConsultationFormPopup` | Stacked popup + compact member `v2-table` |
| `ConsultationMinutesIndex` | Member opinion grid + highlight prognosis |
| `InfusionFlowTab` | BA documentation only — state pipe, role cards |

---

## Implementation checklist

### Archetype A

- [ ] `*UiStyles.js` (`ds*` tokens)
- [ ] Header card + patient bar + list/detail grid
- [ ] URL embedded mode + `resetStore`
- [ ] Highlight → table card → sticky footer
- [ ] Empty state

### Archetype B

- [ ] `cards-container` filters + results
- [ ] Status legend from utils
- [ ] Row actions (eye/print)
- [ ] Prefilled URL + back link

### Archetype C

- [ ] Tokens in `*UiStyles.js` or inline (Infusion single-file)
- [ ] `padding: "4px 2px", fontSize: 13` shell
- [ ] Critical fields in `highlightBox`; `*` = `#E24B4A`
- [ ] 2-column **or** stacked layout (`minmax(0, …)`)
- [ ] Compact table (inline or scoped `v2-table` SCSS)
- [ ] Internal sticky footer (`hideFooter` on PopupForm)
- [ ] Textarea `rows={2}` in popups when scroll is an issue

### Archetype D

- [ ] `BusinessProcess.scss` classes under `.bp-infusion`
- [ ] `bp-section` numbering + `FieldTable` for dev view
- [ ] No production Formik inside spec-only tab

---

## Anti-patterns

| Avoid | Prefer |
| ----- | ------ |
| Import another feature’s `*UiStyles.js` | Copy tokens locally |
| `bp-*` / `.if-state` in patient popups | Archetype C tokens only |
| MUI `Paper` default elevation/colors | `card` token |
| Footer only in `Popup` chrome when body scrolls | Internal `stickyFooter` |
| Full-width single column for 10+ fields | 2-column grid or stacked cards |
| Default `v2-table` padding in dense popup | `cn-members-table-wrap` or Infusion `th`/`td` |
| `rows={4}` textareas in `size="md"` popup | `rows={2}` |
| New colors per screen | Palette table |
| `framer-motion` unless file already uses it | Plain `div` + inline styles |

---

## Related skills

- Shorter clinical-form focus (points here): `.cursor/skills/emr-clinical-form-ui-style/SKILL.md`
- Print page size: `.cursor/skills/emr-print-page-size/SKILL.md`
- Print dropdown: `.cursor/skills/create-print-dropdown/SKILL.md`
