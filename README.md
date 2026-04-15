# Sarkari Jankari (React + Express + Prisma + PostgreSQL)

A full-stack government jobs portal inspired by the Sarkari Result style:
- Frontend: React + Vite
- Backend API: Node.js + Express
- ORM: Prisma
- Database: PostgreSQL

## 1) Start PostgreSQL

Use Docker (recommended):

```bash
docker compose up -d
```

## 2) Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

API runs at `http://localhost:5000`.

## 3) Frontend Setup

Open a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## API Endpoints

- `GET /api/health`
- `GET /api/categories`
- `GET /api/posts?category=results&featured=true&limit=10`
- `GET /api/stats`
- `POST /api/posts` (multipart form data supported with `attachment` field for PDF/image uploads)

## Notes

- The backend scripts use `npx prisma` commands, so a local Prisma CLI install is not required.
- Update seeded links/content in `backend/prisma/seed.js`.
- Run a new Prisma migration after pulling these changes because the `Post` model now includes attachment metadata fields.
