# 🚀 Frontend Developer Guide: Connecting to OPA Backend

Welcome to the Office Placement Application (OPA) API! This guide is designed to get you up and running quickly.

Instead of reading a massive document, you can actually **interact with the API directly in your browser** to see exactly what data comes back.

---

## 🧭 1. The Magic Link: Swagger UI

We use `drf-spectacular` to automatically generate documentation. Once the backend is running locally, open this link in your browser:

👉 **[http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)**

**Why this is awesome for you:**
*   It lists **every single endpoint**.
*   It shows the **exact JSON structure** expected for requests and returned in responses.
*   You can click **"Try it out"** to make real API calls directly from the UI!

---

## 🔐 2. Authentication (JWT)

We use JSON Web Tokens (JWT). Most endpoints require you to be logged in.

### Step 1: Login to get tokens
Make a `POST` request to `/api/auth/login/` with username and password.
*(Note: Use `ivy.anderson` and `testpass123` for full Admin access during testing).*

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI...",
  "refresh": "eyJhbGciOiJIUzI...",
  "user": {
    "id": 9,
    "username": "ivy.anderson",
    "staff_profile": {
      "first_name": "Ivy",
      "last_name": "Anderson",
      "system_role": "system_admin",
      "department": "Computer Science"
    }
  }
}
```
*💡 Notice how the login response immediately gives you the user's role and details? Save this in your frontend state (e.g., Redux, Context) so you don't need to fetch it again.*

### Step 2: Attach the token to your requests
For any protected endpoint, send the `access` token in the HTTP Headers:
```http
Authorization: Bearer <your_access_token>
```

### Step 3: Refreshing tokens
Access tokens expire after 30 minutes. When you get a `401 Unauthorized`, send the `refresh` token to `POST /api/auth/refresh/` to get a new access token.

---

## 🏢 3. Core Public Features (No Auth Required)

You don't need a token to build the main directory/search pages.

### Search Offices (`GET /api/offices/search/`)
Use query parameters to build your UI filters.
*   `?search=101` (Search by room number, building, or type)
*   `?min_available=2` (Only show rooms with at least 2 free spots)
*   `?office_type=shared`
The response automatically calculates `current_occupants_count` and `available_capacity` for you.

### View Office Details (`GET /api/offices/{id}/`)
This endpoint gives you everything you need for a single office page in one call:
*   Physical details (room, floor, capacity).
*   `capacity_status` (Is it full? How many free spots?).
*   `current_occupants` (Array of staff currently assigned there).
*   `it_equipment` (Array of tech in the room).

---

## 🛠️ 4. Managing Data (CRUD)

All management endpoints (e.g., assigning a staff member to an office) live at their base URL and follow standard REST patterns:

*   `/api/departments/`
*   `/api/buildings/`
*   `/api/staff/`
*   `/api/equipment/`
*   `/api/assignments/`

**Permissions:** Currently, you need the `system_admin` role (like user `ivy.anderson`) to make `POST`, `PUT`, `PATCH`, or `DELETE` requests. Otherwise, you will get a `403 Forbidden` error.

---

## ⚠️ 5. Common Error Codes

If something fails, the API will return a standard HTTP status code and usually a JSON body explaining why.

*   `400 Bad Request`: Form validation failed.
    *   *Special case:* If you try to create an assignment (`POST /api/assignments/`) for an office that is **already full**, you will get a 400 error.
*   `401 Unauthorized`: Your JWT token is missing or expired. Redirect to login.
*   `403 Forbidden`: You are logged in, but your `system_role` doesn't allow you to do this action.

---
**Happy coding! If an endpoint is missing a field you need, or responds weirdly, let the backend team know!**
