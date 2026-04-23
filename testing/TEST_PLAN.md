# OPA Test Guide

> **Environment:** Local (cloud deployment planned for next sprint)
> **Backend URL:** `http://127.0.0.1:8000`
> **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
> **API Base:** `http://127.0.0.1:8000/api/`

---

## Backend Setup (One-Time)

1. Pull the latest code: `git pull origin main`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `venv\Scripts\activate` (Windows) / `source venv/bin/activate` (Mac)
4. Install packages: `pip install -r requirements.txt`

> **Note:** This project normally uses PostgreSQL. For local testing without PostgreSQL, we use `opa_backend/settings_local.py` which switches to SQLite.

## Running Backend Unit Tests (22 tests)

```bash
python manage.py test api --settings=opa_backend.settings_local -v 2
```

Django creates a temporary in-memory test database, runs all 22 API tests, and prints the results. Take a screenshot of the terminal output for documentation.

## Running Backend Server + Swagger UI

```bash
python manage.py migrate --settings=opa_backend.settings_local
python manage.py seed_data --settings=opa_backend.settings_local
python manage.py runserver --settings=opa_backend.settings_local
```

1. Open `http://127.0.0.1:8000/api/docs/` in your browser
2. Test public endpoints directly (office search, office detail)
3. For protected endpoints, log in first:
   - Click "Try it out" on the `/api/auth/login/` endpoint
   - Send `{ "username": "ivy.anderson", "password": "testpass123" }`
   - Copy the `access` token from the response
4. Click the **Authorize** button at the top of the page, type `Bearer <token>`
5. You can now test all CRUD endpoints

## Frontend Setup & Testing

```bash
cd opa-frontend
npm install
```

### Run frontend unit tests (7 tests)

```bash
npm test -- --watchAll=false
```

### Run frontend app (manual UI testing)

1. Terminal 1: backend running (see above)
2. Terminal 2: `cd opa-frontend` then `npm start`
3. Open `http://localhost:3000` and log in with `ivy.anderson` / `testpass123`

---

## Test Accounts

All passwords: **testpass123**

| Username | Role | Write Access |
|----------|------|-------------|
| ivy.anderson | system_admin | Yes (full CRUD) |
| alice.johnson | faculty | No |
| bob.smith | department_admin | No |
| frank.miller | resource_manager | No |
| henry.taylor | it_department | No |

---

## Office Status (Seed Data)

| Room | Building | Capacity | Occupied | Available | Note |
|------|----------|----------|----------|-----------|------|
| 101 | Engineering | 2 | 2 | 0 | FULL |
| 102 | Engineering | 4 | 2 | 2 | |
| 201 | Engineering | 6 | 0 | 6 | EMPTY |
| 202 | Engineering | 1 | 0 | 1 | Past assignment ended |
| 110 | Science Hall | 2 | 1 | 1 | |
| 210 | Science Hall | 4 | 0 | 4 | EMPTY |
| 310 | Science Hall | 10 | 0 | 10 | EMPTY |
| 100 | Business Center | 3 | 1 | 2 | |
| 200 | Business Center | 1 | 0 | 1 | EMPTY |

---

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login/` | POST | No | Login, get tokens |
| `/api/auth/refresh/` | POST | No | Refresh token |
| `/api/auth/me/` | GET | Yes | User profile |
| `/api/offices/search/` | GET | No | Office search (filtered) |
| `/api/offices/{id}/` | GET | No | Office detail |
| `/api/departments/` | GET/POST | Yes | Department CRUD |
| `/api/buildings/` | GET/POST | Yes | Building CRUD |
| `/api/staff/` | GET/POST | Yes | Staff CRUD |
| `/api/equipment/` | GET/POST | Yes | Equipment CRUD |
| `/api/assignments/` | GET/POST | Yes | Assignment CRUD |
