# Source layout

Single Vite app with React Router. Public gallery and admin stubs share one repo.

```
src/
├── app/
│   ├── App.tsx
│   ├── providers.tsx    # Redux, PersistGate, Toast, loader
│   └── routes.tsx
├── layouts/
│   ├── PublicLayout.tsx
│   └── admin/           # MUI admin shell (from mailer-client, no mail menu)
│       ├── AdminLayout.tsx
│       ├── AdminHeader.tsx
│       └── AdminSidebar.tsx
├── pages/
│   ├── public/biology/CellViewerPage.tsx
│   ├── auth/LoginPage.tsx, RegisterPage.tsx
│   └── admin/ManageUserPage.tsx, AdminDashboardPage.tsx
├── features/biology/    # 3D gallery
├── admin/components/    # AppTable, AppButton, … (ported)
├── shared/
│   ├── api/             # axios + user APIs
│   ├── auth/            # token, RequireAuth
│   └── constants/paths.ts
├── redux/               # user slice (register loading)
├── components/three/CellScene.tsx
└── data/…
```

## Routes

| Path | Page |
|------|------|
| `/biology/cells` | Gallery (public) |
| `/login`, `/register` | Auth |
| `/admin` | → `/admin/manage-user` |
| `/admin/manage-user` | CRUD users (requires login) |

Env: `VITE_API_URL` (see `.env.example`, default `http://localhost:7070/api/v1`).

Ported from `mailer-client` without email/label CMS screens.
