# CMC SportBooking - Run Guide

This repository contains two apps:
- `backend/` -> Laravel API
- `frontend/` -> React + Vite UI

## 1) Prerequisites

Install these tools first:
- PHP 8.2+
- Composer
- MySQL or MariaDB
- Node.js 18+
- npm

## 2) First-Time Setup

### Backend (Laravel)

Open terminal in `backend/`:

```powershell
cd backend
composer install
```

Create env file:

```powershell
copy .env.example .env
```

Edit `backend/.env` and set at least:
- `DB_CONNECTION=mysql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_DATABASE=cmc_sportbooking`
- `DB_USERNAME=...`
- `DB_PASSWORD=...`

Generate app key + run migrations:

```powershell
php artisan key:generate
php artisan migrate
```

Optional seed data:

```powershell
php artisan db:seed
```

Run backend API:

```powershell
php artisan serve
```

Backend URL: `http://127.0.0.1:8000`

### Frontend (React)

Open another terminal in `frontend/`:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend URL: `http://127.0.0.1:5173`

Notes:
- Frontend proxies `/api` to `http://127.0.0.1:8000`.
- On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.

## 3) Login Pages

Use these routes in browser:
- Stagiaire: `http://127.0.0.1:5173/login_stagiaire`
- Admin: `http://127.0.0.1:5173/login_admin`
- Monitor: `http://127.0.0.1:5173/login_monitor`

## 4) Production Build (Frontend)

```powershell
cd frontend
npm.cmd run build
```

## 5) Common Troubleshooting

- `401 Unauthorized` after role changes:
  - Logout and login again, or clear local storage token.
- Email/verification issues:
  - Check `MAIL_*` settings in `backend/.env`.
- Migration issues:
  - Verify DB credentials and DB exists before `php artisan migrate`.
