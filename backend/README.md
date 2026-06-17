# Vehicle Management System - Backend

This backend uses Node.js, Express, and MySQL (mysql2). It exposes a simple REST API for managing vehicles.

Setup

1. Install dependencies

```bash
cd backend
npm install
```

2. Create the database (using XAMPP phpMyAdmin or mysql CLI)

- Import `schema.sql` into your MySQL server (create the `vms_db` database and `vehicles` table).

3. Copy `.env.example` to `.env` and edit values (DB credentials)

4. Run the server

```bash
npm run dev
# or
npm start
```

> The backend now auto-creates the `vms_db` database and required tables on startup if they do not already exist.

API Endpoints

- `GET /api/vehicles` — list all vehicles
- `GET /api/vehicles/:id` — get a vehicle
- `POST /api/vehicles` — create a vehicle (JSON body)
- `PUT /api/vehicles/:id` — update a vehicle (JSON body)
- `DELETE /api/vehicles/:id` — delete a vehicle
- `GET /api/bills` — read billing records from vms_db
- `POST /api/bills` — create a billing record directly in vms_db
- `PUT /api/bills/:id` — update a billing record in vms_db
- `DELETE /api/bills/:id` — delete a billing record from vms_db
- `GET /api/business-profile` — read business profile from vms_db
- `PUT /api/business-profile` — save business profile directly to vms_db

Notes

- Uses `mysql2` promise pool and `dotenv` for configuration.
- CORS and `express.json()` are enabled in `server.js`.
