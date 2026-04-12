# OPA Test Guide

> **Backend URL:** `https://opa-backend.onrender.com`
> **Swagger UI:** `https://opa-backend.onrender.com/api/docs/`
> **API Base:** `https://opa-backend.onrender.com/api/`

---

## Nasil Test Edilir

1. Tarayicida `https://opa-backend.onrender.com/api/docs/` adresini acin
2. Herkese acik endpointleri dogrudan test edin (ofis arama, detay)
3. Korunmus endpointler icin once login olun:
   - `/api/auth/login/` endpointinde "Try it out" tiklayin
   - `{ "username": "ivy.anderson", "password": "testpass123" }` gonderin
   - Response'taki `access` token'i kopyalayin
4. Sayfanin ustundeki **Authorize** butonuna tiklayin, `Bearer <token>` yazin
5. Artik tum CRUD endpointlerini test edebilirsiniz

---

## Test Hesaplari

Tum sifre: **testpass123**

| Username | Role | Yazma Yetkisi |
|----------|------|---------------|
| ivy.anderson | system_admin | Evet (tam CRUD) |
| alice.johnson | faculty | Hayir |
| bob.smith | department_admin | Hayir |
| frank.miller | resource_manager | Hayir |
| henry.taylor | it_department | Hayir |

---

## Ofis Durumu (Seed Data)

| Oda | Bina | Kapasite | Dolu | Bos | Not |
|-----|------|----------|------|-----|-----|
| 101 | Engineering | 2 | 2 | 0 | DOLU |
| 102 | Engineering | 4 | 2 | 2 | |
| 201 | Engineering | 6 | 0 | 6 | BOS |
| 202 | Engineering | 1 | 0 | 1 | Eski atama bitmis |
| 110 | Science Hall | 2 | 1 | 1 | |
| 210 | Science Hall | 4 | 0 | 4 | BOS |
| 310 | Science Hall | 10 | 0 | 10 | BOS |
| 100 | Business Center | 3 | 1 | 2 | |
| 200 | Business Center | 1 | 0 | 1 | BOS |

---

## API Endpointleri

| Endpoint | Metod | Auth | Aciklama |
|----------|-------|------|----------|
| `/api/auth/login/` | POST | Hayir | Login, token al |
| `/api/auth/refresh/` | POST | Hayir | Token yenile |
| `/api/auth/me/` | GET | Evet | Profil bilgisi |
| `/api/offices/search/` | GET | Hayir | Ofis arama (filtreli) |
| `/api/offices/{id}/` | GET | Hayir | Ofis detay |
| `/api/departments/` | GET/POST | Evet | Departman CRUD |
| `/api/buildings/` | GET/POST | Evet | Bina CRUD |
| `/api/staff/` | GET/POST | Evet | Personel CRUD |
| `/api/equipment/` | GET/POST | Evet | Ekipman CRUD |
| `/api/assignments/` | GET/POST | Evet | Atama CRUD |
