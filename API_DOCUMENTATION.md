# OPA Backend — API Documentation

> **Office Placement Application** — Backend API built with Django + Django REST Framework + PostgreSQL.
> 
> Last updated: March 17, 2026

---

## 📋 Table of Contents

- [Work Summary](#work-summary)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Endpoints Reference](#api-endpoints-reference)
  - [Office Search (SCRUM-21)](#1-office-search--filtering-scrum-21)
  - [Office Detail (SCRUM-22)](#2-office-detail-scrum-22)
  - [CRUD Endpoints (SCRUM-23)](#3-crud-endpoints-scrum-23)
- [Data Models](#data-models)
- [Authentication & Permissions](#authentication--permissions)
- [Running Tests](#running-tests)

---

## Work Summary

### Completed Tasks (March 17, 2026)

| Task | Status | Description |
|------|--------|-------------|
| **SCRUM-21** | ✅ Done | Office search & filtering API with dynamic capacity calculation |
| **SCRUM-22** | ✅ Done | Office detail endpoint with nested occupants, IT equipment, and capacity status |
| **SCRUM-23** | ✅ Done (basic) | Admin panel setup + CRUD ViewSets for all entities |

### What Was Built

1. **Database Layer** — 6 models strictly following the approved DBML schema, with migrations applied to PostgreSQL (`opa_db`).
2. **Serializers** — Flat serializers for CRUD, nested serializers for office detail view, capacity validation on assignments.
3. **API Views** — Search with dynamic filtering, detail with nested data, full CRUD ViewSets.
4. **Permissions** — Role-based access control (`IsAdminOrReadOnly` on CRUD endpoints, public access on search/detail).
5. **Business Logic** — Capacity validation prevents over-assigning offices; duplicate active assignments are rejected with HTTP 400.
6. **Admin Panel** — All models registered with `list_display`, `search_fields`, and `list_filter`.
7. **Test Suite** — 16 unit tests covering search, filtering, detail, and validation logic (all passing).
8. **Seed Data** — Management command to populate the database with realistic test data.

---

## Tech Stack

- **Python 3.x** + **Django 6.0.3**
- **Django REST Framework** (DRF)
- **PostgreSQL** (`opa_db`)
- **django-cors-headers** (configured for React frontend)

---

## Project Structure

```
Office-Placement-Application/
├── manage.py
├── requirements.txt
├── API_DOCUMENTATION.md          ← You are here
├── opa_backend/                  ← Django project config
│   ├── settings.py               ← DB, CORS, DRF, installed apps
│   ├── urls.py                   ← Root URL config (includes /api/)
│   └── ...
└── api/                          ← Main application
    ├── models.py                 ← 6 database models
    ├── serializers.py            ← Flat + nested serializers + validation
    ├── views.py                  ← Search, Detail, CRUD views
    ├── urls.py                   ← API route definitions
    ├── permissions.py            ← Role-based permission classes
    ├── admin.py                  ← Django admin configuration
    ├── tests.py                  ← 16 unit tests
    └── management/commands/
        └── seed_data.py          ← Database seeding command
```

---

## Getting Started

### Prerequisites

- Python 3.x installed
- PostgreSQL running with database `opa_db` created
- Virtual environment activated

### Setup Commands

```bash
# 1. Activate virtual environment
# (Windows)
.\sfwe343\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply migrations
python manage.py migrate

# 4. Create a superuser (for admin panel)
python manage.py createsuperuser

# 5. Seed database with test data
python manage.py seed_data

# 6. Start development server
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/api/`

---

## API Endpoints Reference

**Base URL:** `http://127.0.0.1:8000/api/`

> 💡 **For frontend developers:** All endpoints return JSON. CORS is enabled for all origins during development. You can use `fetch()` or `axios` to call these endpoints directly from your React app.

---

### 1. Office Search & Filtering (SCRUM-21)

**`GET /api/offices/search/`**

Search and filter offices with dynamically computed available capacity.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Full-text search across room number, building name, office type | `?search=Engineering` |
| `building` | integer | Filter by building ID | `?building=1` |
| `office_type` | string | Filter by type: `single`, `shared`, `lab`, `conference` | `?office_type=shared` |
| `room_number` | string | Partial match on room number | `?room_number=10` |
| `floor` | integer | Filter by floor number | `?floor=2` |
| `min_available` | integer | Only offices with at least N available spots | `?min_available=2` |
| `ordering` | string | Sort by: `room_number`, `floor`, `capacity`, `available_capacity` | `?ordering=-available_capacity` |
| `page` | integer | Page number (20 results per page) | `?page=2` |

#### Example Request

```
GET /api/offices/search/?building=1&min_available=1&ordering=-available_capacity
```

#### Example Response

```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 3,
      "building": 1,
      "building_name": "Engineering Building",
      "room_number": "201",
      "floor": 2,
      "capacity": 6,
      "office_type": "lab",
      "current_occupants_count": 0,
      "available_capacity": 6
    },
    {
      "id": 2,
      "building": 1,
      "building_name": "Engineering Building",
      "room_number": "102",
      "floor": 1,
      "capacity": 4,
      "office_type": "shared",
      "current_occupants_count": 2,
      "available_capacity": 2
    }
  ]
}
```

#### Frontend Integration Notes

- Use `current_occupants_count` and `available_capacity` to display capacity bars/badges.
- Use `min_available=1` to show only offices with free spots (e.g., for an "Available Offices" filter toggle).
- Response is **paginated** — check `count`, `next`, `previous` for pagination controls.

---

### 2. Office Detail (SCRUM-22)

**`GET /api/offices/{id}/`**

Get full details for a single office, including current occupants, IT equipment, and capacity status.

#### Example Request

```
GET /api/offices/2/
```

#### Example Response

```json
{
  "id": 2,
  "building": 1,
  "building_name": "Engineering Building",
  "room_number": "102",
  "floor": 1,
  "capacity": 4,
  "office_type": "shared",
  "capacity_status": {
    "total": 4,
    "occupied": 2,
    "available": 2
  },
  "current_occupants": [
    {
      "id": 3,
      "staff": {
        "id": 3,
        "full_name": "Dr. Carol Williams",
        "email": "carol.williams@university.edu",
        "academic_title": "Dr.",
        "system_role": "faculty"
      },
      "start_date": "2025-11-17",
      "end_date": null
    },
    {
      "id": 4,
      "staff": {
        "id": 4,
        "full_name": "Assoc. Prof. David Brown",
        "email": "david.brown@university.edu",
        "academic_title": "Assoc. Prof.",
        "system_role": "faculty"
      },
      "start_date": "2026-01-16",
      "end_date": null
    }
  ],
  "it_equipment": [
    {
      "id": 3,
      "office": 2,
      "asset_type": "computer",
      "serial_number": "PC-ENG-002",
      "status": "active"
    },
    {
      "id": 4,
      "office": 2,
      "asset_type": "computer",
      "serial_number": "PC-ENG-003",
      "status": "active"
    },
    {
      "id": 5,
      "office": 2,
      "asset_type": "printer",
      "serial_number": "PRT-ENG-001",
      "status": "active"
    }
  ]
}
```

#### Frontend Integration Notes

- Use `capacity_status` to render a capacity bar (e.g., 2/4 occupied).
- `current_occupants[].staff.full_name` — ready to display directly.
- `current_occupants[].end_date === null` means the person is currently there.
- `it_equipment[].status` can be `active`, `maintenance`, or `retired`.

---

### 3. CRUD Endpoints (SCRUM-23)

All CRUD endpoints follow the same pattern. **GET** requests are public; **POST/PUT/PATCH/DELETE** require authentication (superuser or system admin).

| Resource | List / Create | Retrieve / Update / Delete |
|----------|--------------|---------------------------|
| Departments | `GET/POST /api/departments/` | `GET/PUT/PATCH/DELETE /api/departments/{id}/` |
| Buildings | `GET/POST /api/buildings/` | `GET/PUT/PATCH/DELETE /api/buildings/{id}/` |
| Staff | `GET/POST /api/staff/` | `GET/PUT/PATCH/DELETE /api/staff/{id}/` |
| IT Equipment | `GET/POST /api/equipment/` | `GET/PUT/PATCH/DELETE /api/equipment/{id}/` |
| Assignments | `GET/POST /api/assignments/` | `GET/PUT/PATCH/DELETE /api/assignments/{id}/` |

#### Creating an Office Assignment

**`POST /api/assignments/`**

```json
{
  "office": 2,
  "staff": 5,
  "start_date": "2026-03-17",
  "end_date": null
}
```

**Validation rules (automatic):**
- ❌ **400 error** if the office is at full capacity.
- ❌ **400 error** if the staff member already has an active assignment in that office.
- ✅ Allowed if a previous assignment to the same office has ended (`end_date` is set).

#### API Root

**`GET /api/`** — returns a navigable list of all CRUD endpoints (DRF browsable API).

---

## Data Models

```
Department (id, name, description)
    └── Staff (id, first_name, last_name, email, academic_title, system_role)

Building (id, name, address)
    └── Office (id, room_number, floor, capacity, office_type)
            ├── IT_Equipment (id, asset_type, serial_number, status)
            └── OfficeAssignment (id, staff_id, start_date, end_date)
```

### Field Enums

| Model | Field | Allowed Values |
|-------|-------|----------------|
| Office | `office_type` | `single`, `shared`, `lab`, `conference` |
| Staff | `system_role` | `faculty`, `department_admin`, `resource_manager`, `system_admin`, `it_department` |
| ITEquipment | `asset_type` | `computer`, `monitor`, `printer`, `phone`, `projector` |
| ITEquipment | `status` | `active`, `maintenance`, `retired` |

---

## Authentication & Permissions

| Endpoint | GET | POST / PUT / DELETE |
|----------|-----|---------------------|
| `/api/offices/search/` | ✅ Public | N/A (read-only) |
| `/api/offices/{id}/` | ✅ Public | N/A (read-only) |
| `/api/departments/` | ✅ Public | 🔒 Superuser / System Admin |
| `/api/buildings/` | ✅ Public | 🔒 Superuser / System Admin |
| `/api/staff/` | ✅ Public | 🔒 Superuser / System Admin |
| `/api/equipment/` | ✅ Public | 🔒 Superuser / System Admin |
| `/api/assignments/` | ✅ Public | 🔒 Superuser / System Admin |
| `/admin/` | 🔒 Superuser | 🔒 Superuser |

> **Note:** During development, CORS is set to allow all origins. This must be restricted before production deployment.

---

## Running Tests

```bash
# Run all 16 tests with verbose output
python manage.py test api -v 2

# Expected result: Ran 16 tests — OK
```

### Test Coverage

| Test Class | Tests | What It Covers |
|------------|-------|----------------|
| `OfficeSearchTests` | 6 | SCRUM-21: list, filter by type/room/capacity, ended assignments |
| `OfficeDetailTests` | 6 | SCRUM-22: detail data, occupants, equipment, capacity status, 404 |
| `OfficeAssignmentValidationTests` | 4 | Business logic: capacity limits, duplicates, ended assignments |

---

## What's Next (Backlog)

- [ ] Link `Staff` model to Django `auth.User` for real login-based permissions
- [ ] Granular permissions: Department Admins manage only their department, IT manages only equipment
- [ ] Swagger / OpenAPI docs (`drf-spectacular`)
- [ ] More edge-case tests
- [ ] Production CORS configuration
