# Northline Build

A full-stack construction, engineering, and project delivery website paired with a secure CMS and enquiry management admin panel.

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query, React Hook Form + Zod, GSAP (`ScrollTrigger`), Lenis smooth scroll, and custom magnetic/roll-up UI interactions.
- **Backend:** Express 5, TypeScript, Prisma ORM, PostgreSQL (Neon), Argon2 password hashing, cookie-based sessions with CSRF protection, Sharp image processing, and Zod request validation.

---

## Project Structure

```text
northline/
├── backend/                  # Express 5 + Prisma API server
│   ├── prisma/
│   │   ├── schema.prisma     # Database models (User, Session, Page, PageSection, Project, Service, Media, Enquiry, SiteSetting, AuditLog)
│   │   └── seed.ts           # Seeds default settings, Home/About/Contact pages, 4 capabilities, and 3 sample projects
│   ├── src/
│   │   ├── config/           # Env, CORS, logger, storage, database, OpenAPI config
│   │   ├── lib/              # Crypto, errors, response envelopes, keep-alive, revalidation
│   │   ├── middlewares/      # Auth, RBAC, CSRF, rate limiting, Zod validation, error handling
│   │   └── modules/          # auth, pages, projects, services, media, enquiries, settings, dashboard, audit, users, health
│   └── tests/                # Unit and integration tests (Vitest + Supertest)
└── frontend/                 # Next.js 16 public site & admin panel
    ├── public/images/        # Local monochrome architectural & project imagery
    ├── src/
    │   ├── app/
    │   │   ├── (public)/     # Public routes: /, /about, /projects, /projects/[slug], /contact
    │   │   ├── admin/        # Protected CMS routes: /admin/login, /admin/dashboard, /admin/pages, /admin/projects, /admin/services, /admin/media, /admin/enquiries, /admin/settings, /admin/users, /admin/audit-logs
    │   │   └── api/revalidate/
    │   ├── components/       # Motion primitives, layout header/footer, public sections, admin editors
    │   ├── services/         # public-api.ts and admin-api.ts clients
    │   └── types/            # Shared API DTOs
    └── tests/                # Vitest unit tests & Playwright E2E specs
```

---

## How It Works

### 1. Public Website (`frontend/src/app/(public)`)
All public pages are dynamically driven by PostgreSQL via the backend API (`/api/v1/...`), so edits saved in the Admin Panel reflect on the live site without code changes:
- **Home (`/`)**: Hero with monochrome architectural backdrop, parallax/masked text reveal, and dual CTAs (`EXPLORE OUR WORK`, `START A PROJECT`), `OUR APPROACH`, `WHAT WE DO` (`01 / PLAN` – `04 / DELIVER`), `WHERE WE WORK` (6 sectors), `SELECTED WORK` (featured projects with category, location, and area), `THE NORTHLINE DIFFERENCE`, closing CTA, and embedded project enquiry form.
- **About Us (`/about`)**: Hero, `Our Story`, `Our Approach`, `What Guides Our Work` (`PURPOSE`, `PRECISION`, `COLLABORATION`, `RESPONSIBILITY`), `Our Process` (`01 / UNDERSTAND` – `04 / COMPLETE`), and closing CTA.
- **Projects (`/projects` & `/projects/[slug]`)**: Filterable and searchable project portfolio with full project detail pages (category, location, area, client, completion year, overview, and gallery).
- **Contact (`/contact`)**: Direct contact channels (populated from Admin Settings when configured) and the structured project enquiry form (`Full Name *`, `Company / Organisation`, `Work Email *`, `Phone Number *`, `Project Type` dropdown, `Project Location`, `Approximate Project Area`, `Expected Project Start`, `Project Brief / Message *`, and consent checkbox).

### 2. Backend API & Security (`backend/src`)
- **Authentication & Sessions**: `POST /api/v1/auth/login` verifies credentials with Argon2, sets an HTTP-only session cookie plus a readable CSRF cookie (`northline_csrf`), and enforces CSRF token headers on state-changing admin requests.
- **Role-Based Access Control (RBAC)**: Supports `ADMIN` and `EDITOR` roles (`requireAuth` and `requireRole` middlewares).
- **Media Pipeline**: Uploaded images are validated for MIME type/size and processed with `sharp` into `thumbnail`, `card`, and `hero` variants.
- **Audit Logging**: Admin mutations across pages, projects, services, enquiries, settings, and users are logged to `AuditLog`.
- **Render Keep-Alive**: `src/lib/keep-alive.ts` periodically pings `/api/v1/health` (every 10 minutes when enabled/configured) to prevent Render free-tier idle spin-downs.

### 3. Admin Panel (`frontend/src/app/admin`)
Protected CMS dashboard for managing the entire site:
- **Dashboard (`/admin/dashboard`)**: Displays published/draft project counts, new/total enquiry counts, media/service totals, recent enquiries, and recent project updates.
- **Pages (`/admin/pages` & `/admin/pages/[slug]`)**: Edit `home`, `about`, and `contact` SEO metadata, visibility, section order, hero copy/CTAs/images, and `IMAGE_TEXT` item lists (e.g., sectors, values, process steps).
- **Projects (`/admin/projects`)**: Create, edit, reorder (`sortOrder`), feature, publish/unpublish, archive, and manage `title`, `category`, `location`, `area`, `excerpt`, `description`, and cover/gallery images.
- **Capabilities / Services (`/admin/services`)**: Add, edit, reorder, and archive the capabilities displayed on the Home page.
- **Enquiries (`/admin/enquiries`)**: Search, filter by status (`NEW`, `IN_PROGRESS`, `RESPONDED`, `CLOSED`), inspect full project brief & metadata, record internal admin notes, update status, or delete records.
- **Media Library (`/admin/media`)**: Upload, search, edit alt text, and delete images.
- **Settings (`/admin/settings`)**: Manage company name, tagline, footer statement, contact email/phone/address/hours, social links (`LinkedIn`, `Instagram`), and default SEO metadata.
- **Users & Audit Logs (`/admin/users`, `/admin/audit-logs`)**: Manage admin/editor accounts and inspect system activity.

---

## Local Setup & Usage

### Prerequisites
- **Node.js** `20+` and **npm**
- A **PostgreSQL** database (e.g., Neon)

### 1. Configure Environment Variables
Create `backend/.env` (based on `backend/.env.example`) with your PostgreSQL `DATABASE_URL`, session/CSRF secrets, and `CORS_ORIGINS` (e.g. `http://localhost:3000`).

Create `frontend/.env.local` (based on `frontend/.env.example`) pointing to the backend API:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

### 2. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Push Schema, Bootstrap Admin & Seed Content
```bash
cd backend
npx prisma db push
npm run prisma:generate
npm run bootstrap:admin
npm run prisma:seed
```

### 4. Run Development Servers
In two terminals:
```bash
# Terminal 1 — Backend API (default port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend App (default port 3000)
cd frontend
npm run dev
```

- **Public Website:** `http://localhost:3000`
- **Admin Panel:** `http://localhost:3000/admin/login`
- **Backend Health Check:** `http://localhost:5000/api/v1/health`

---

## Verification & Testing

### Backend
```bash
cd backend
npm run format:check
npm run typecheck
npm run lint
npm test
```

### Frontend
```bash
cd frontend
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
```

---

## Deployment Notes
- **Backend (Render)**: Build with `npm install && npm run prisma:generate && npm run build`, start with `npm start`. Set `RENDER_EXTERNAL_URL` (or `KEEP_ALIVE_URL`) so the built-in 10-minute keep-alive ping keeps the service awake.
- **Frontend (Vercel / Node host)**: Set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend `/api/v1` URL and ensure `CORS_ORIGINS` on the backend includes your deployed frontend origin.
