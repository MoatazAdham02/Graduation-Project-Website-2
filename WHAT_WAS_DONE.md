# What Was Implemented — Auth & Frontend–Backend Connection

This document summarizes what was added so the COROnet app uses real authentication and talks to your Node/MongoDB backend.

---

## 1. Backend (Node.js + Express + MongoDB)

### New dependencies
- **bcryptjs** — hashing passwords before saving to the database  
- **jsonwebtoken** — issuing and verifying JWT tokens for login

### New files

| File | Purpose |
|------|--------|
| **models/User.js** | User schema: `name`, `email`, `password` (hashed with bcrypt on save). Method `comparePassword(candidate)` for login. |
| **middleware/auth.js** | Reads `Authorization: Bearer <token>`, verifies JWT with `JWT_SECRET`, loads the user and sets `req.user`. Returns 401 if missing or invalid. |
| **routes/auth.routes.js** | **POST /api/auth/register** — create user, return token + user. **POST /api/auth/login** — check email/password, return token + user. **GET /api/auth/me** — protected; returns current user. |

### Updated files

| File | Change |
|------|--------|
| **server.js** | Mounted `app.use('/api/auth', authRoutes)`. |
| **.env** | Added `JWT_SECRET=coronet-secret-change-in-production`. |
| **.env.example** | Added `JWT_SECRET=your-secret-key-change-in-production`. |

### Auth flow (backend)
- **Register:** Validate name, email, password (min 8 chars). If email already exists → 400. Otherwise create user (password hashed), sign JWT, return `{ token, user: { id, name, email } }`.
- **Login:** Find user by email, compare password with bcrypt. If invalid → 401. Otherwise sign JWT, return `{ token, user }`.
- **Me:** Requires `Authorization: Bearer <token>`. Verifies token, finds user, returns `{ user: { id, name, email } }`.

---

## 2. Frontend (React + Vite)

### New files

| File | Purpose |
|------|--------|
| **.env.local** | `VITE_API_URL=http://localhost:4000` so the app knows where the API is. |
| **contexts/AuthContext.tsx** | Holds `user`, `token`, `loading`. Provides `login(email, password)`, `register(name, email, password)`, `logout()`. On load, if a token exists in `localStorage` (`coronet-token`), calls **GET /api/auth/me** to restore the user. |
| **components/ProtectedLayout.tsx** | Wraps all `/app/*` routes. If not logged in → redirects to `/login`. If still loading auth → shows “Loading…”. Otherwise renders the app (sidebar, dashboard, etc.). |

### Updated files

| File | Change |
|------|--------|
| **App.tsx** | Wrapped app in **AuthProvider**. `/app` now uses **ProtectedLayout** so that visiting `/app` or any `/app/*` when not logged in sends you to `/login`. |
| **pages/Login.tsx** | Uses `useAuth().login(email, password)`. On submit, calls the backend **POST /api/auth/login**; on success saves token and redirects to `/app`. Shows API error message on failure. |
| **pages/Signup.tsx** | Uses `useAuth().register(name, email, password)`. On submit, calls **POST /api/auth/register**; on success saves token and redirects to `/onboarding` or `/app`. Shows API error (e.g. “Email already registered”) on failure. |
| **components/layout/Header.tsx** | “Sign out” calls `logout()` from AuthContext (clears token and user) and navigates to `/login`. |

---

## 3. How to run and test

1. **Backend**  
   In the `Backend` folder:
   ```bash
   npm run dev
   ```
   You should see “MongoDB connected” and “Server running on http://localhost:4000”.

2. **Frontend**  
   In the project root:
   ```bash
   npm run dev
   ```
   Open the URL shown (e.g. http://localhost:5173).

3. **Test flow**  
   - Go to **Sign up**, create an account (name, email, password 8+ chars).  
   - You should be redirected to onboarding or dashboard and stay logged in.  
   - Open **Sign out** in the header; you should go to the login page.  
   - **Sign in** with the same email/password; you should be back in the app.  
   - If you go to `/app` while logged out, you should be redirected to `/login`.

---

## 4. Summary

- **Backend:** User model in MongoDB, register/login/me API, JWT auth middleware.  
- **Frontend:** Auth context, login/signup wired to the API, token stored in `localStorage`, `/app` protected and sign-out clearing token and redirecting to login.  
- **Connection:** Frontend uses `VITE_API_URL` (http://localhost:4000) for all auth requests; backend CORS allows the frontend origin (http://localhost:5173).

You can change `JWT_SECRET` in Backend `.env` for production and ensure `.env` and `.env.local` are not committed (add them to `.gitignore` if needed).
