# OPA Backend — Work Summary

## Overview

The backend for the **Office Placement Application (OPA)** is fully built and operational. It provides a REST API that allows the frontend to manage faculty office assignments, track room capacity in real time, and handle IT equipment records across campus buildings.

**Tech stack:** Django 6 · Django REST Framework · PostgreSQL · SimpleJWT · Swagger

---

## What Was Built

### Database (6 models)

The database follows the approved DBML schema exactly. All models live in `api/models.py`.

```
Department ──┐
             └── Staff ──┐
                         └── OfficeAssignment ──┐
Building ──┐                                    │
           └── Office ──────────────────────────┘
                  └── ITEquipment
```

- **Department** — name, description
- **Building** — name, address
- **Office** — room number, floor, capacity, type (single / shared / lab / conference)
- **Staff** — name, email, academic title, role, linked to a Django User for login
- **ITEquipment** — asset type, serial number, status (active / maintenance / retired)
- **OfficeAssignment** — links a staff member to an office with start/end dates. If `end_date` is null, the person is currently there.

### SCRUM-21 — Office Search & Filtering

**Endpoint:** `GET /api/offices/search/`

Lets the frontend search offices with multiple filters: by building, floor, office type, room number, and free-text search. The key feature is **dynamic capacity calculation** — each office in the response includes how many people are currently assigned and how many spots are available. You can also filter by `min_available` to only show offices with free spots.

### SCRUM-22 — Office Detail

**Endpoint:** `GET /api/offices/{id}/`

Returns full details for a single office: basic info, a `capacity_status` object (total / occupied / available), a list of `current_occupants` with nested staff profiles, and all `it_equipment` in that room.

### SCRUM-23 — Admin Panel & CRUD

Full CRUD endpoints for all entities via Django REST Framework ViewSets:

| Resource | Endpoint |
|----------|----------|
| Departments | `/api/departments/` |
| Buildings | `/api/buildings/` |
| Staff | `/api/staff/` |
| IT Equipment | `/api/equipment/` |
| Assignments | `/api/assignments/` |

All CRUD endpoints support GET (list + detail), POST, PUT, PATCH, DELETE.

The Django Admin panel (`/admin/`) is also configured with search, filters, and display columns for all models.

**Business logic on assignments:**
- Cannot assign someone to an office that's already at full capacity → returns HTTP 400
- Cannot create a duplicate active assignment (same person, same office) → returns HTTP 400
- Ended assignments (where `end_date` is set) don't count toward capacity

### SCRUM-24 — JWT Authentication

Users log in with username + password and receive a JWT token pair (access + refresh).

| Endpoint | Method | What it does |
|----------|--------|-------------|
| `/api/auth/login/` | POST | Returns access token, refresh token, and the user's staff profile (role, name, department) |
| `/api/auth/refresh/` | POST | Exchanges a refresh token for a new access token |
| `/api/auth/me/` | GET | Returns the currently authenticated user's profile |

**How roles work:**
- Each `Staff` record is linked to a Django `User` via a OneToOneField
- The `Staff.system_role` field determines permissions: `faculty`, `department_admin`, `resource_manager`, `system_admin`, `it_department`
- Search and detail endpoints are public (no login needed)
- CRUD endpoints require login: read is open to all authenticated users, write requires `system_admin` role

### SCRUM-25 — Swagger / API Documentation

Interactive API docs are available at:
- **`/api/docs/`** — Swagger UI (try endpoints directly in the browser)
- **`/api/schema/`** — Raw OpenAPI 3.0 schema (JSON/YAML)

Powered by `drf-spectacular`. All endpoints, parameters, and response schemas are auto-generated.

### SCRUM-26 — Environment Variables

Sensitive data (database password, secret key, debug flag) has been moved out of source code into a `.env` file using `python-dotenv`. The `.env` file is excluded from git. A `.env.example` template is committed so new developers know which variables to set.

---

## Test Suite

**22 unit tests — all passing.**

| Test class | Count | Covers |
|-----------|-------|--------|
| OfficeSearchTests | 6 | Search filters, capacity annotation, ended assignments |
| OfficeDetailTests | 6 | Nested occupants, equipment, capacity status, 404 |
| OfficeAssignmentValidationTests | 4 | Full office rejection, duplicate prevention, ended assignment handling |
| JWTAuthTests | 6 | Login flow, bad credentials, /me, 401/403 access control |

Run with: `python manage.py test api -v 2`

---

## Project Structure

```
Office-Placement-Application/
├── .env                  ← Your local secrets (not in git)
├── .env.example          ← Template for teammates
├── requirements.txt      ← All Python dependencies
├── manage.py
├── opa_backend/
│   ├── settings.py       ← Django config (DB, JWT, Swagger, CORS)
│   └── urls.py           ← Root routes (/api/, /admin/, /api/docs/)
└── api/
    ├── models.py         ← 6 database models
    ├── serializers.py    ← Flat + nested + JWT serializers
    ├── views.py          ← Search, Detail, CRUD, Auth views
    ├── urls.py           ← All API routes
    ├── permissions.py    ← Role-based permission classes
    ├── admin.py          ← Django admin config
    ├── tests.py          ← 22 unit tests
    └── management/commands/
        └── seed_data.py  ← Populates DB with test data + user accounts
```

---

## Test Accounts

All seeded users have password: **`testpass123`**

| Username | Role | Can write? |
|----------|------|-----------|
| alice.johnson | faculty | No (read-only) |
| bob.smith | department_admin | No (read-only for now) |
| carol.williams | faculty | No |
| david.brown | faculty | No |
| eva.davis | faculty | No |
| frank.miller | resource_manager | No |
| grace.wilson | faculty | No |
| henry.taylor | it_department | No |
| ivy.anderson | system_admin | **Yes — full CRUD** |

To get full write access, log in as `ivy.anderson` / `testpass123`.
