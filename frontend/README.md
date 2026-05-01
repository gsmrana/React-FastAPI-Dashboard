# React + TypeScript Frontend

Modern responsive frontend for the FastAPI dashboard backend.

## Stack

- Vite + React 18 + TypeScript
- Material UI v6
- TanStack Query + Axios (cookie auth via `withCredentials`)
- React Router v6
- Recharts, react-markdown, dayjs

## Development

```bash
npm install
npm run dev
```

The dev server runs at <http://localhost:5173> and proxies `/api` and `/health` to <http://localhost:8000>.

### Backend prerequisites

- Run the backend on port `8000`.
- In the backend `.env`, set:

  ```env
  ALLOWED_ORIGINS=["http://localhost:5173"]
  COOKIE_BASED_AUTH=True
  ```

  (Browsers reject `*` origins together with `allow_credentials=True`, so cannot be left default.)

## Build

```bash
npm run build
```

Output goes to `dist/`. To serve from the FastAPI app, copy or mount `dist/` into the backend's static layout.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | empty | Base URL for API calls. Empty = same-origin (recommended in dev with proxy). Set to `http://your-backend` when serving frontend separately in production. |
| `VITE_BACKEND_PROXY` | `http://localhost:8000` | Used by Vite dev proxy only. |

## Routes

- Public: `/login`, `/register`, `/forgot-password`, `/reset-password?token=...`, `/verify?token=...`
- Authenticated: `/`, `/todos`, `/expenses`, `/notepad`, `/services`, `/files`, `/chatbot`, `/profile`
- Admin only: `/admin/users`, `/admin/llm-manager`, `/admin/app-config`, `/admin/sysinfo`, `/admin/logs`
