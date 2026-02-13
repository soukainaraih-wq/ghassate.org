# Ghassate Organization - Frontend + Shared-Hosting Backend

## Project Structure

- `frontend/` React + Vite app (Arabic-first UI)
- `backend-php/api/` PHP API for shared hosting (Hostinger compatible)
- `backend/` legacy Node/Express backend (kept for reference/migration)
- `frontend/public/cms-store.json` static fallback data for read-only mode

## Active Deployment Mode

- API mode is now the default.
- The admin dashboard route is disabled unless a secret path is configured.
- Static-only mode is optional via `VITE_FORCE_STATIC=true`
- Configure secret route via `VITE_DASHBOARD_SECRET_PATH=<secret-path>`
- Optional explicit switch: `VITE_ENABLE_DASHBOARD=true`
- Optional minimum secret length: `VITE_DASHBOARD_SECRET_MIN_LENGTH=24`

## Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

## Build Frontend

```bash
npm run build
```

Root build script installs frontend dependencies then runs Vite build:

```bash
npm --prefix frontend install && npm --prefix frontend run build
```

## PHP Backend (Hostinger Shared)

Backend entry:

- `backend-php/api/index.php`

Storage (JSON persistence):

- `backend-php/api/storage/cms-store.json`
- `backend-php/api/storage/contact-submissions.json`
- `backend-php/api/storage/newsletter-subscribers.json`
- `backend-php/api/storage/rate/*.json`

Security hardening included:

- CORS allowlist + origin policy for write endpoints
- API rate limit + endpoint-specific rate limits
- Admin token auth (`X-Admin-Token`)
- Strong-token enforcement in production (minimum length)
- Payload size checks + blocked object-key guard
- Honeypot + form timing checks for spam reduction
- Storage access denied via `backend-php/api/storage/.htaccess`

## Deploy to Hostinger Shared (No VPS)

1. Build frontend locally: `npm run build`
2. Upload contents of `frontend/dist/` to `public_html/`
3. Upload `backend-php/api/` to `public_html/api/`
4. Ensure `public_html/api/.htaccess` exists (rewrite to `index.php`)
5. Set token and origins in hosting environment (or edit `backend-php/api/config.php`)

Required production settings:

- `ADMIN_TOKEN` (long random secret, 32+ chars)
- `FRONTEND_ORIGIN=https://your-domain`
- `PUBLIC_ORIGIN=https://your-domain`
- `ENABLE_ADMIN_ENDPOINT=true`

Optional:

- `FRONTEND_EXTRA_ORIGINS=https://www.your-domain`
- `ALLOW_NO_ORIGIN=false`

## GitHub Auto Deploy (No Local Watcher)

Workflow file:

- `.github/workflows/deploy-hostinger.yml`

Runs on:

- push to `main`
- manual run via `workflow_dispatch`

Required GitHub repository secrets:

- `SFTP_HOST` = `72.60.93.27`
- `SFTP_PORT` = `65002`
- `SFTP_USERNAME` = `u393769959`
- `SFTP_PASSWORD` = your Hostinger SSH/SFTP password
- `SFTP_REMOTE_FRONTEND_PATH` = `/home/u393769959/domains/ghassate.org/public_html`
- `SFTP_REMOTE_API_PATH` = `/home/u393769959/domains/ghassate.org/public_html/api`
- `VITE_DASHBOARD_SECRET_PATH` = your secret dashboard route
- `VITE_DASHBOARD_SECRET_MIN_LENGTH` = `24`

## Dashboard Access

URL:

- `https://your-domain/ar/<your-secret-dashboard-path>`
- Set `VITE_DASHBOARD_SECRET_PATH=<your-secret-dashboard-path>` before frontend build.
- Dashboard is hidden from site header/footer and available only via secret URL + admin token.

API auth header required:

- `X-Admin-Token: <your_admin_token>`
- If `ADMIN_TOKEN` is missing (or weak), admin API stays unavailable in production.

## Main API Endpoints

- `GET /api/health`
- `GET /api/projects?lang=ar|zgh|en`
- `GET /api/projects/{slug}?lang=ar|zgh|en`
- `GET /api/news?lang=ar|zgh|en`
- `GET /api/news/{slug}?lang=ar|zgh|en`
- `GET /api/pages?lang=ar|zgh|en`
- `GET /api/pages/{slug}?lang=ar|zgh|en`
- `GET /api/impact?lang=ar|zgh|en`
- `GET /api/settings?lang=ar|zgh|en`
- `POST /api/contact`
- `POST /api/newsletter`

Admin endpoints:

- `GET /api/admin/summary`
- `GET /api/admin/cms`
- `PUT /api/admin/settings`
- `POST /api/admin/projects`
- `PUT /api/admin/projects/{id}`
- `DELETE /api/admin/projects/{id}`
- `POST /api/admin/news`
- `PUT /api/admin/news/{id}`
- `DELETE /api/admin/news/{id}`
- `POST /api/admin/pages`
- `PUT /api/admin/pages/{id}`
- `DELETE /api/admin/pages/{id}`
- `POST /api/admin/media`
- `PUT /api/admin/media/{id}`
- `DELETE /api/admin/media/{id}`

## Language Policy

- Arabic is the primary language.
- Amazigh (`zgh`) is the third language.
- English is secondary.
