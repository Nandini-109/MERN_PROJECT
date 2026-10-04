# SkillSwap – Skill Exchange & Learning Platform (v2 · premium redesign)

MERN stack (MongoDB · Express · React + Vite · Node). Users list what they can teach and what they want to learn,
discover compatible people, send swap requests, chat, complete swaps and review each other.

## Quick start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env   (keep your existing .env if you have one)
# edit .env: MONGO_URI and a long random JWT_SECRET
npm run seed:demo           # skill catalogue + demo members, swaps, chats, reviews
npm run dev                 # http://localhost:5000
```

### 2. Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### Demo logins (after `npm run seed:demo`)
| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Member (full dashboard) | riya@skillswap.demo | Demo@123  |
| Other members | kabir@, rohan@, ananya@, arjun@, … `@skillswap.demo` | Demo@123 |
| Admin | admin@skillswap.demo     | Admin@123 |

`npm run cleanup` reports records that point at deleted users (dry run); `npm run cleanup:fix` removes them.
`npm run seed` adds only the skill catalogue. `npm run seed:reset` removes previous demo data and recreates it.
To make your own account an admin, set `role` to `admin` on that user in MongoDB.

## Environment variables
`backend/.env`
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/skillswap
JWT_SECRET=<long random string>
CLIENT_URL=http://localhost:5173      # allowed CORS origin(s), comma separated
```
`frontend/.env` (optional) → `VITE_API_URL=http://localhost:5000/api`

## MongoDB
* **Local:** install MongoDB Community Server, make sure the service is running, use `mongodb://127.0.0.1:27017/skillswap`.
* **Atlas:** create a free cluster, add a database user, allow your IP, paste the `mongodb+srv://…` string into `MONGO_URI`.
* No manual migration is needed. New User fields are optional with safe defaults; existing users keep working.
  New collections (reviews, notifications, messages) are created automatically.

## What's new
* Premium design system (midnight ink + amber, light/dark mode), landing page, responsive navbar with notifications.
* Dashboard with stats, 7-day activity chart, recommendations, profile-completion ring, recently viewed.
* Discover: debounced search with suggestions, category/level/availability/saved filters, sorting, pagination (URL-synced).
* Public profiles, ratings & reviews, favourites, skill levels, availability, avatar upload.
* Swaps workflow: pending → accepted → completed (or declined/cancelled) with history and review prompts.
* Chat per accepted swap (polling), in-app notifications, toasts, confirm dialogs, skeletons, empty/error states, 404 page.
* Backend hardening: central error handler, ObjectId validation, escaped regex search, helmet, rate limiting on auth,
  CORS allow-list, input sanitising, cascade cleanup on admin user delete.

## REST API summary
| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `PUT /auth/password` |
| Users | `GET/PUT /users/me`, `GET /users/discover`, `GET /users/recommended`, `GET /users/favorites`, `POST /users/:id/favorite`, `GET /users/:id`, admin: `GET /users/admin/all`, `DELETE /users/admin/:id` |
| Skills | `GET /skills`, `/skills/popular`, `/skills/categories`, `/skills/suggest`, admin CRUD |
| Requests | `POST /requests`, `GET /requests/mine`, `PATCH /requests/:id` (accepted · rejected · cancelled · completed) |
| Reviews | `POST /reviews`, `GET /reviews/user/:id` |
| Notifications | `GET /notifications`, `/unread-count`, `PATCH /read-all`, `PATCH /:id/read` |
| Messages | `GET /messages/conversations`, `/unread-count`, `GET/POST /messages/:exchangeId` |
| Stats | `GET /stats/public`, `/stats/dashboard`, `/stats/admin` |

## Project structure
```
Mern_109Project/
├── backend/src/{config,middleware,models,routes,utils,seed.js,server.js}
└── frontend/src/{components,context,hooks,lib,pages,styles,App.jsx,api.js,main.jsx}
```
