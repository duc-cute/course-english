# Innovation Hub / Community Voice — Progress

Mục tiêu: module góp ý cộng đồng — giáo viên/admin gửi ý tưởng, vote, comment, theo dõi roadmap; hiển thị nổi bật trên Dashboard.

Tài liệu tham chiếu: `promt.md`, prototype `Design/Inovation/ChatGPT Image 22_47_58 14 thg 7, 2026.png`.

> **Trạng thái tổng:** MVP ✅ (BE + FE Hub + Dashboard widget + Drawer submit + ảnh minh họa) · **Cập nhật:** 2026-07-16
>
> 2026-07-16: Clone UI prototype giữ style; bỏ 4 tab → filter status + mine; gỡ nút dead (báo cáo/BXH); CTA mở Drawer; bỏ số giả `143` / role cứng / avatar URL chưa có trên BE.
>
> 2026-07-16 (detail): Refactor `InnovationIdeaDetailPage` — giữ layout 2 cột + vote/comment/info/timeline/admin status; bỏ tab fake, gallery, AI box, supporters, related, sticky “đề xuất cập nhật”, đối tượng/ngôn ngữ, số thống kê giả.
>
> 2026-07-16 (images): Upload ảnh optional khi gửi góp ý — folder storage `inovation`, max 3 ảnh PNG/JPG ≤5MB; gallery trên detail.

---

## Phạm vi đã chốt

| Có | Không (phase sau) |
|----|-------------------|
| Menu **Innovation Hub** (admin sidebar) | 4 tab (đã bỏ khỏi clone UI — dùng filter thay) |
| 1 trang list + filter (category, status, sort, **chỉ của tôi**) | AI gợi ý idea trùng trước submit |
| Gửi ý tưởng (Drawer), vote, comment, detail | Roadmap Kanban / trang báo cáo / BXH riêng |
| Upload ảnh minh họa (folder `inovation`, max 3) | Thêm/xóa ảnh sau khi tạo / crop |
| Trang chi tiết + đổi status | Student shell |
| Right rail stats rule-based (không LLM) | |
| **Dashboard:** block Community Voice + nút gửi góp ý | Menu “Ý tưởng của tôi” riêng |

### Phân vai UI

- **Dashboard** — quảng bá + carousel + top vote + shortcut gửi góp ý (Drawer).
- **Innovation Hub** — list đầy đủ, filter, vote, comment, chi tiết.
- **Drawer** — chỉ **submit** góp ý mới (dùng chung Dashboard + Hub).

---

## Backend ✅

Base: `/api/v1/innovation-ideas` · Schema: Hibernate `ddl-auto=update` (3 bảng tự tạo).

### Entities
- `InnovationIdea` — title, description, category, status, priority, `createdByUserId`, `voteCount`, `commentCount`, `imageUrls` (JSON, paths `/storage/inovation/…`)
- `InnovationIdeaVote` — unique `(ideaId, userId)`, toggle hard delete
- `InnovationIdeaComment`

### Enums
- Category: `FEATURE`, `BUG`, `UI`, `PERFORMANCE`, `AI`, `OTHER`
- Status: `UNDER_REVIEW`, `PLANNED`, `IN_PROGRESS`, `TESTING`, `COMPLETED`
- Priority: `LOW`, `MEDIUM`, `HIGH`
- Sort: `FEATURED`, `NEWEST`, `TRENDING` (TRENDING trống tuần → fallback FEATURED)

### API
| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/search` | Paging + keyword, category, status, `mine`, sortMode |
| GET | `/stats/summary` | Hero + right rail + widget (analyzedCount, categoryShares, topContributors, featuredCompleted, mineCompletedCount) |
| GET | `/{id}` | Detail + `viewerHasVoted` |
| POST | `` | Create |
| PUT | `/{id}/status` | Đổi status |
| POST | `/{id}/votes` | Toggle vote |
| GET/POST | `/{id}/comments` | List / create comment |

### File map chính
- `course_english_backend/.../controller/InnovationIdeaController.java`
- `course_english_backend/.../service/impl/InnovationIdeaServiceImpl.java`
- `course_english_backend/.../domain/InnovationIdea*.java`

---

## Frontend ✅

### Routing & nav
- Path: `INNOVATION_HUB` → `/admin/innovation-hub`
- Detail: `/admin/innovation-hub/:ideaId`
- Sidebar: **Innovation Hub** (trước Cấu hình hệ thống)

### Pages
- `InnovationHubPage.tsx` — list, filter, hero, right rail, vote
- `InnovationIdeaDetailPage.tsx` — vote, comment, đổi status

### Shared components
- `admin/components/innovation/InnovationSubmitDrawer.tsx` — form chip category + priority (prototype)
- `admin/components/innovation/CommunityVoiceWidget.tsx` — carousel + top vote (Dashboard)
- `admin/components/innovation/innovationHubLabels.ts` — labels VI dùng chung
- `shared/api/innovationHub.ts`

### Dashboard integration ✅
- Vị trí: **cột phải SECTION 2**, **trên** “Học sinh cần hỗ trợ” (không nhét vào cột weather `span 2` — tránh tràn đè layout)
- Carousel auto 6s, prev/next, dots; click card → detail Hub
- Top 3 theo vote + thanh % (không dùng sao rating)
- Nút **Gửi góp ý mới** → `InnovationSubmitDrawer`
- **Xem tất cả** → Innovation Hub
- Fix 2026-07-15: empty state “Hoạt động gần đây” dùng `.admin-activities-empty` (căn giữa icon + text)

### Styles
- `styles/admin-innovation-hub.css`
- `styles/admin-dashboard.css` (`.admin-community-voice*`)

---

## Chưa làm / backlog

- [x] Upload ảnh minh họa (reuse `FileController` + folder `inovation`)
- [ ] Student shell — Innovation Hub cho học sinh
- [ ] Sidebar badge số idea hot (localStorage `lastSeen` hoặc notification)
- [ ] Seed data mẫu (Dark Mode, AI Speaking…) khi deploy mới
- [ ] Manual test E2E checklist
- [ ] Phân quyền fine-grained (chỉ admin đổi status — hiện mọi staff authenticated)

---

## Manual test gợi ý

1. Restart BE → bảng `innovation_*` được tạo / cột `image_urls` cập nhật.
2. Dashboard: thấy Community Voice dưới weather; carousel chạy; gửi góp ý qua Drawer.
3. Innovation Hub: list, filter **chỉ của tôi**, vote/unvote, comment, detail.
4. Drawer: upload 1–3 ảnh PNG/JPG ≤5MB → detail hiện gallery; click ảnh xem lớn.
5. Đổi status → idea COMPLETED có thể lên hero `featuredCompleted`.
