# Solvio Backend API

Solvio adalah platform **Booking Management System** untuk pemesanan jasa servis/teknisi. Pengguna dapat memesan layanan, admin mengelola booking dan assign teknisi, dan teknisi memperbarui status pekerjaan mereka.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** NestJS
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** JWT (JSON Web Token) + Passport
- **Validation:** class-validator + class-transformer
- **Deployment:** Render / Railway

---

## Features

- **Authentication & Authorization**
  - Register & Login dengan email/password
  - JWT-based authentication
  - Role-based access control: `CUSTOMER`, `ADMIN`, `TECHNICIAN`

- **Users**
  - Admin: lihat semua user, lihat detail user, hapus user, lihat daftar teknisi
  - Semua role: lihat & update profil sendiri

- **Categories**
  - Public: browse semua kategori beserta layanannya
  - Admin: buat, edit, hapus kategori

- **Services (Layanan)**
  - Public: browse semua layanan, filter by kategori
  - Admin: buat, edit, hapus layanan

- **Bookings**
  - Customer: buat booking, lihat riwayat booking sendiri, cancel booking
  - Admin: lihat semua booking, update status booking, assign teknisi
  - Teknisi: lihat tugas yang di-assign ke mereka, update status ke ON_PROGRESS / COMPLETED

- **Payments**
  - Customer: buat data pembayaran untuk booking yang sudah CONFIRMED, lihat riwayat pembayaran
  - Admin: lihat semua pembayaran, konfirmasi/tolak pembayaran

---

## Installation & Usage

### 1. Clone repo

```bash
git clone <repo-url>
cd <project-folder>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Buat file `.env` di root project:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="your_super_secret_key_here"
PORT=3000
```

### 4. Jalankan migrasi database

```bash
npx prisma migrate deploy
```

### 5. Jalankan server

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

Server akan berjalan di `http://localhost:3000`

---

## API Endpoints

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Daftar akun baru |
| POST | `/auth/login` | Public | Login |
| GET | `/auth/me` | Authenticated | Cek profil dari token |

**POST /auth/register**
```json
{
  "email": "user@email.com",
  "full_name": "Budi Santoso",
  "password": "password123",
  "role": "CUSTOMER" // opsional, default CUSTOMER
}
```

**POST /auth/login**
```json
{
  "email": "user@email.com",
  "password": "password123"
}
```

---

### Users

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/users` | ADMIN | Lihat semua user |
| GET | `/users/me` | Authenticated | Lihat profil sendiri |
| PATCH | `/users/me` | Authenticated | Update profil sendiri |
| GET | `/users/technicians` | ADMIN | Lihat daftar teknisi |
| GET | `/users/:id` | ADMIN | Lihat detail user tertentu |
| DELETE | `/users/:id` | ADMIN | Hapus user |

---

### Categories

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/categories` | Public | Lihat semua kategori |
| GET | `/categories/:id` | Public | Lihat detail kategori |
| POST | `/categories` | ADMIN | Buat kategori baru |
| PATCH | `/categories/:id` | ADMIN | Update kategori |
| DELETE | `/categories/:id` | ADMIN | Hapus kategori |

**POST /categories**
```json
{
  "category_name": "Perbaikan AC"
}
```

---

### Services

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/services` | Public | Lihat semua layanan (support `?category_id=xxx`) |
| GET | `/services/:id` | Public | Lihat detail layanan |
| POST | `/services` | ADMIN | Buat layanan baru |
| PATCH | `/services/:id` | ADMIN | Update layanan |
| DELETE | `/services/:id` | ADMIN | Hapus layanan |

**POST /services**
```json
{
  "services_name": "Cuci AC 1/2 PK",
  "price": 150000,
  "category_id": "clxxx..."
}
```

---

### Bookings

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/bookings` | CUSTOMER | Buat booking baru |
| GET | `/bookings` | ADMIN | Lihat semua booking (support `?status=PENDING`) |
| GET | `/bookings/my` | CUSTOMER | Lihat booking milik sendiri |
| GET | `/bookings/tasks` | TECHNICIAN | Lihat tugas yang di-assign |
| GET | `/bookings/:id` | Authenticated | Lihat detail booking |
| PATCH | `/bookings/:id/status` | ADMIN | Update status & assign teknisi |
| PATCH | `/bookings/:id/progress` | TECHNICIAN | Update status tugas |
| PATCH | `/bookings/:id/cancel` | CUSTOMER | Cancel booking |

**POST /bookings**
```json
{
  "services_id": "clxxx...",
  "schedule": "2026-06-15T10:00:00.000Z"
}
```

**PATCH /bookings/:id/status** (Admin)
```json
{
  "status": "CONFIRMED",
  "provider_id": "clxxx..." // opsional, ID teknisi
}
```

**PATCH /bookings/:id/progress** (Teknisi)
```json
{
  "status": "ON_PROGRESS"
}
```

---

### Payments

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/payments` | CUSTOMER | Buat data pembayaran |
| GET | `/payments` | ADMIN | Lihat semua pembayaran |
| GET | `/payments/my` | CUSTOMER | Lihat riwayat pembayaran sendiri |
| GET | `/payments/:id` | Authenticated | Lihat detail pembayaran |
| PATCH | `/payments/:id/status` | ADMIN | Konfirmasi / tolak pembayaran |

**POST /payments**
```json
{
  "booking_id": "clxxx...",
  "method": "Transfer Bank BCA"
}
```

**PATCH /payments/:id/status** (Admin)
```json
{
  "status": "SUCCESS"
}
```

---

## Booking Flow

```
Customer buat Booking → status: PENDING
     ↓
Admin konfirmasi → status: CONFIRMED + assign Teknisi
     ↓
Customer buat Payment (method bayar)
     ↓
Admin konfirmasi Payment → status: SUCCESS
     ↓
Teknisi update → status: ON_PROGRESS
     ↓
Teknisi selesai → status: COMPLETED
```

---

## Database Diagram

> Link ERD: [dbdiagram.io](https://dbdiagram.io) ← ganti dengan link ERD kamu

Relasi antar tabel:
- `User` (1) → (many) `Booking` sebagai customer
- `User` (1) → (many) `Booking` sebagai provider/teknisi
- `Category` (1) → (many) `Services`
- `Services` (1) → (many) `Booking`
- `Booking` (1) → (1) `Payment`

---

## Deployment

- **Backend:** [https://your-app.render.com](https://your-app.render.com) ← ganti dengan URL deploy kamu
- **Frontend:** [https://your-app.vercel.app](https://your-app.vercel.app)
