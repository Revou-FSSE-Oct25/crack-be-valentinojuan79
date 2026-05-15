# Solvio Backend API

A comprehensive NestJS-based backend service for a technician booking and management platform. The system enables customers to book services, technicians to manage tasks, and admins to oversee the entire platform with integrated payment processing.

## 🎯 Features

- **User Management**
  - Role-based access control (Customer, Admin, Technician)
  - User registration and authentication with JWT
  - User profile management
  - Secure password encryption with bcrypt

- **Service Management**
  - Browse services by category
  - Service variants with different pricing
  - Admin-controlled service creation and updates

- **Booking System**
  - Create and manage bookings
  - Real-time booking status tracking (Pending, Confirmed, On Progress, Completed, Cancelled)
  - Location-based booking with address, province, and city
  - Task assignment to technicians
  - Booking cancellation

- **Payment Processing**
  - Multiple payment methods (Bank transfers, QRIS, E-wallets)
  - Midtrans payment gateway integration
  - Real-time payment status updates via webhooks
  - Virtual account generation
  - QR code payment support

- **Review System**
  - Customer reviews for completed bookings
  - Rating system (1-5 stars)
  - Technician ratings aggregation

- **API Documentation**
  - Swagger/OpenAPI documentation available at `/api-docs`
  - Detailed endpoint descriptions and request/response schemas

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport.js
- **API Documentation**: Swagger/OpenAPI
- **Payment Gateway**: Midtrans Sandbox
- **Password Hashing**: bcrypt

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Midtrans merchant account (for payment processing)

## ⚙️ Installation and Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd crack-be-valentinojuan79
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/solvio_db"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRATION="24h"

# Server
PORT=3000
NODE_ENV=development

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY="your-midtrans-server-key"
MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
```

### 4. Set up the database
```bash
# Run migrations
npx prisma migrate dev --name init

# Optional: Seed the database
npx prisma db seed
```

### 5. Start the application

**Development mode:**
```bash
npm run start:dev
```

**Production mode:**
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`
Swagger documentation: `http://localhost:3000/api-docs`


## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and obtain JWT token | 
| GET | `/auth/me` | Get authenticated user profile |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users | 
| GET | `/users/me` | Get my profile |
| GET | `/users/technicians` | Get all technicians |
| GET | `/users/:id` | Get user by ID |
| PATCH | `/users/me` | Update my profile |
| DELETE | `/users/:id` | Delete user |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|---|---|
| GET | `/categories` | Get all categories |
| GET | `/categories/:id` | Get category by ID |
| POST | `/categories` | Create new category |
| PATCH | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category |

### Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/services` | Get all services (optionally filter by category) |
| GET | `/services/:id` | Get service by ID |
| POST | `/services` | Create new service |
| PATCH | `/services/:id` | Update service |
| DELETE | `/services/:id` | Delete service |

**Query Parameters:**
- `category_id` (GET /services): Filter services by category ID

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Create new booking |
| GET | `/bookings` | Get all bookings (with optional status filter) |
| GET | `/bookings/my` | Get my bookings (with optional status filter) |
| GET | `/bookings/tasks` | Get my tasks (with optional status filter) |
| GET | `/bookings/:id` | Get booking details |
| PATCH | `/bookings/:id/status` | Update booking status |
| PATCH | `/bookings/:id/progress` | Update task progress (ON_PROGRESS or COMPLETED) |
| PATCH | `/bookings/:id/cancel` | Cancel booking |
| POST | `/bookings/webhook/midtrans` | Handle Midtrans payment webhook |

**Query Parameters:**
- `status`: Filter by booking status (PENDING, CONFIRMED, ON_PROGRESS, COMPLETED, CANCELLED)

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments` | Create new payment |
| POST | `/payments/gateway` | Create gateway payment |
| GET | `/payments` | Get all payments |
| GET | `/payments/my` | Get my payments |
| GET | `/payments/:id` | Get payment by ID |
| PATCH | `/payments/:id/status` | Update payment status |
| POST | `/payments/webhook/midtrans` | Handle Midtrans payment webhook |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reviews/:bookingId` | Create review for booking |
| GET | `/reviews/technicians` | Get technician ratings |


## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Here's the database structure:

### Core Models

**User**
- id (String, Primary Key)
- full_name (String)
- email (String, Unique)
- password (String)
- phone_number (String, Optional)
- address (String, Optional)
- province (String, Optional)
- city (String, Optional)
- id_number (String, Optional)
- id_photo (String, Optional)
- specialities (String, Optional)
- role (Role: CUSTOMER, ADMIN, TECHNICIAN)
- createdAt (DateTime)

**Category**
- id (String, Primary Key)
- category_name (String, Unique)

**Services**
- id (String, Primary Key)
- services_name (String)
- price (Float)
- category_id (String, Foreign Key)

**ServiceVariant**
- id (String, Primary Key)
- variant_name (String)
- price (Float)
- service_id (String, Foreign Key)

**Booking**
- id (String, Primary Key)
- status (BookingStatus: PENDING, CONFIRMED, ON_PROGRESS, COMPLETED, CANCELLED)
- schedule (DateTime)
- total_price (Float)
- address (String, Optional)
- province (String, Optional)
- city (String, Optional)
- proof_url (String, Optional)
- user_id (String, Foreign Key)
- services_id (String, Foreign Key)
- provider_id (String, Optional, Foreign Key)

**Payment**
- id (String, Primary Key)
- method (String)
- status (PaymentStatus: PENDING, SUCCESS, FAILED)
- amount_to_pay (Float)
- booking_id (String, Foreign Key, Unique)
- gateway_order_id (String, Optional, Unique)
- snap_token (String, Optional)
- payment_url (String, Optional)
- va_number (String, Optional)
- qr_url (String, Optional)
- paid_at (DateTime, Optional)
- expired_at (DateTime, Optional)

**Review**
- id (String, Primary Key)
- rating (Int: 1-5)
- comment (String, Optional)
- booking_id (String, Foreign Key, Unique)
- technician_id (String, Foreign Key)
- createdAt (DateTime)

### Relationships
- User ↔ Booking (One-to-Many): User can have multiple bookings
- User ↔ User (One-to-Many): Admin/System can assign technicians to bookings
- Category ↔ Services (One-to-Many)
- Services ↔ ServiceVariant (One-to-Many)
- Services ↔ Booking (One-to-Many)
- Booking ↔ Payment (One-to-One)
- Booking ↔ Review (One-to-One)
- User ↔ Review (One-to-Many): Technician can have multiple reviews

Database diagram available at: [Add your dbdiagram.io or draw.io link here]

## 🔐 Authentication & Authorization

The API uses JWT-based authentication with role-based access control (RBAC).

### Authentication Flow
1. User registers with email and password
2. Password is hashed using bcrypt
3. User logs in with credentials
4. Server returns JWT access token
5. Client includes token in Authorization header: `Bearer <token>`

### Roles
- **CUSTOMER**: Can create bookings, make payments, and leave reviews
- **TECHNICIAN**: Can manage assigned tasks and update progress
- **ADMIN**: Full access to manage users, services, categories, and bookings


## 🔗 Deployment Links

- **Backend API**: (https://crack-be-valentinojuan79.onrender.com)
- **API Documentation**: (https://crack-be-valentinojuan79.onrender.com/api-docs)

## 📦 Project Structure

```
src/
├── auth/              # Authentication module (JWT, login, register)
├── users/             # User management module
├── categories/        # Service categories module
├── services/          # Services module
├── bookings/          # Booking management module
├── payments/          # Payment processing module
├── reviews/           # Review system module
├── prisma/            # Prisma ORM module
├── common/            # Shared guards, decorators, utilities
├── app.module.ts      # Root application module
├── app.controller.ts  # Root controller
├── main.ts            # Application entry point
└── app.service.ts     # Root service

prisma/
├── schema.prisma      # Database schema definition
├── migrations/        # Database migration files
└── seed.ts            # Database seed script
```
