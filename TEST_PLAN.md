# OPA Test Guide

> **Backend URL:** `https://opa-backend.onrender.com`
> **Swagger UI:** `https://opa-backend.onrender.com/api/docs/`
> **API Base:** `https://opa-backend.onrender.com/api/`

---

## How to Test

1. Open `https://opa-backend.onrender.com/api/docs/` in your browser
2. Test public endpoints directly (office search, office detail)
3. For protected endpoints, log in first:
   - Click "Try it out" on the `/api/auth/login/` endpoint
   - Send `{ "username": "ivy.anderson", "password": "testpass123" }`
   - Copy the `access` token from the response
4. Click the **Authorize** button at the top of the page, type `Bearer <token>`
5. You can now test all CRUD endpoints

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
