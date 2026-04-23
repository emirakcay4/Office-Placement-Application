# Office Placement Application (OPA)
## Software Analysis and Design Documentation

**Date:** April 2026  
**Subject:** Software Analysis and Design  
**Project:** Office Placement Application (OPA)  

---

### 1. Executive Summary
The Office Placement Application (OPA) is a comprehensive, full-stack web-based system designed to streamline the management of faculty office assignments, track room capacities in real-time, and monitor IT equipment across university buildings. This documentation provides an in-depth analysis of the system architecture, database design, API specifications, and frontend integration, fulfilling the requirements for the Software Analysis and Design group project.

---

### 2. System Architecture
The application follows a modern, decoupled Client-Server (3-tier) architecture, ensuring separation of concerns, scalability, and maintainability:

*   **Presentation Layer (Frontend):** Developed using React 19 and React Router v7. It is responsible for rendering a dynamic, responsive User Interface (UI), handling user interactions, and maintaining client-side state (e.g., authentication state via Context API).
*   **Application Layer (Backend):** Built with Python and Django 6.0, leveraging the Django REST Framework (DRF). This layer handles all business logic, data validation, authentication, and exposes data via RESTful APIs.
*   **Data Access Layer (Database):** Powered by PostgreSQL, a robust relational database management system, handling complex queries and ensuring data integrity for entities like departments, buildings, offices, and assignments.

---

### 3. Database Design (Entity-Relationship Model)
The database schema is highly normalized to accurately reflect the university's office management domain. The core structure consists of 6 primary models:

1.  **Department**: Stores department information (`name`, `description`). Has a 1-to-Many relationship with `Staff`.
2.  **Staff**: Represents faculty and administrative users. Includes academic titles and roles. Linked 1-to-1 to the core Django authentication `User` model.
3.  **Building**: Represents physical campus buildings (`name`, `address`). Has a 1-to-Many relationship with `Office`.
4.  **Office**: Represents physical rooms. Tracks `room_number`, `floor`, `capacity`, and `office_type` (`single`, `shared`, `lab`, `conference`). 
5.  **ITEquipment**: Tracks tech assets (computers, printers) within specific offices. Includes `asset_type`, `serial_number`, and lifecycle `status` (`active`, `maintenance`, `retired`).
6.  **OfficeAssignment**: An associative entity that maps `Staff` to an `Office`. Crucially, it tracks `start_date` and `end_date` to manage historical versus active assignments.

**Relationship Diagram Context:**
```text
Department ──┐
             └── Staff ──┐
                         └── OfficeAssignment ──┐
Building ──┐                                    │
           └── Office ──────────────────────────┘
                  └── ITEquipment
```

---

### 4. Business Logic & Constraints
The backend enforces strict business rules to maintain data integrity:

*   **Dynamic Capacity Management:** The system calculates real-time office capacity (`total`, `occupied`, `available`) based entirely on *active* `OfficeAssignment` records (where `end_date` is `null`).
*   **Validation Rules:**
    *   **Over-assignment Prevention:** A staff member cannot be assigned to an office if it has reached its maximum `capacity`. The API intercepts this and returns an `HTTP 400 Bad Request`.
    *   **Duplicate Prevention:** A staff member cannot have duplicate active assignments for the exact same office.
    *   **Historical Accuracy:** When an assignment is terminated (`end_date` is set), it no longer counts against the current capacity, but remains in the database for historical auditing.

---

### 5. Security: Authentication & Role-Based Access Control (RBAC)
The system implements a secure authentication layer using JSON Web Tokens (JWT).

*   **Authentication Flow:** Users authenticate via the `/api/auth/login/` endpoint, receiving short-lived `access` tokens and long-lived `refresh` tokens (via `SimpleJWT`).
*   **Role Hierarchy:** The `Staff.system_role` field defines the user's permissions:
    *   `faculty`, `department_admin`, `resource_manager`, `system_admin`, `it_department`.
*   **Permission Enforcement:**
    *   *Public Access:* Office directory search and detail endpoints are open to all users (authenticated or not).
    *   *Read-Only Authenticated:* Standard users can view internal dashboard data.
    *   *Admin Write Access:* Full CRUD operations (Create, Update, Delete) on buildings, equipment, and assignments are strictly restricted to the `system_admin` role.

---

### 6. API Design & Specifications
The backend exposes a well-documented, RESTful API. Interactive documentation is automatically generated using `drf-spectacular` and is accessible via Swagger UI at `/api/docs/`.

**Key Endpoints:**
*   **Search Engine:** `GET /api/offices/search/`
    *   Supports dynamic filtering via query parameters (e.g., `?search=101`, `?min_available=2`, `?office_type=shared`).
    *   Automatically computes and returns `current_occupants_count` and `available_capacity`.
*   **Detailed View:** `GET /api/offices/{id}/`
    *   Aggregates physical room details, nested occupant profiles, IT equipment arrays, and the computed capacity status into a single cohesive JSON response.
*   **CRUD ViewSets:** Standardized endpoints for administrative data management:
    *   `/api/departments/`, `/api/buildings/`, `/api/staff/`, `/api/equipment/`, `/api/assignments/`.

---

### 7. Frontend Implementation Details
The React 19 frontend is engineered to seamlessly integrate with the DRF backend:

*   **Core Technologies:** React 19, Axios (for API communication), React Router DOM v7, Lucide React (for iconography).
*   **Integration Strategy:** All network requests are routed through a configured `axios` instance. Interceptors are implemented to automatically attach the `Authorization: Bearer <token>` header to protected requests, and to silently catch `401 Unauthorized` errors to execute token refresh cycles seamlessly.
*   **State Management:** An `AuthContext` wraps the application, managing user session states, distributing the active user's profile/role across components, and protecting administrative routing paths.
*   **Styling & UI:** The interface employs responsive, component-based styling methodologies designed to give a premium look with micro-animations and cohesive branding without relying on heavy external CSS frameworks.

---

### 8. Quality Assurance (QA) and Testing
The application adheres to high reliability standards. The backend features a robust unit test suite (`python manage.py test api`) encompassing 22 specialized tests that validate:
*   Search filter accuracy and capacity computations.
*   Nested serialization integrity in detail views.
*   Validation logic preventing over-capacity assignments.
*   Security restrictions and JWT authentication flows.

All tests are designed to ensure the system gracefully handles edge cases, such as previously ended assignments not falsely inflating room occupancy, guaranteeing a robust and resilient system architecture.
