# KINETIQ: Lead-Tracking CRM

A lead-tracking CRM built for the **SHL Tech Internship, Task 1 (Mini CRM Dashboard)**. Every enquiry becomes a *lead*, and you move each lead from **New → Contacted → Converted**, with live numbers, charts and an AI assistant (Clive) along the way.

- **Live app:** _link added after deployment_
- **Demo login:** click **Try the demo account** on the login screen (or `demo@kinetiq.app` / `DemoPass123`)
- **API docs (Swagger):** `<live link>/api/docs`

---

## What I built

**Everything the brief asked for**
- **Dashboard overview:** total, New, Contacted and Converted leads, plus the conversion rate. Click a card to see those leads.
- **Manage leads:** add, edit and delete (with confirmation). Every lead has a name, email, phone, business name and status, plus optional notes.
- **Search and filter:** search by name or email, filter by status, sort, page through results, and change a lead's status straight from the list.
- **Database and backend:** a FastAPI REST API with a SQLite database, so data survives a page refresh.
- **User experience:**
  - Clean, responsive layout: a table on desktop, cards on phones.
  - Loading skeletons and messages, helpful empty states, clear errors with **Try again**.
  - Form validation in the browser *and* on the server.

**Extras added during the build**
- **Accounts:** sign up and log in. Each account sees only its own leads. New accounts can load 70 sample leads in one click.
- **Top navigation:** Dashboard, Analytics, Leads and About pages, each with its own URL.
- **Analytics:** a trend graph, a status donut and a heatmap of when enquiries arrive (7/30/90 days). Every chart also has a table view.
- **Lead profile card:** click a lead to see its details, notes, a pipeline-stage tracker and quick actions.
- **Clive, the AI assistant:** ask "Who should I follow up with first?" and Clive looks up *your* leads (read-only) through an LLM on Groq.
- **Motion:** GSAP (counting numbers, chart drawing, heatmap wave, scroll reveals) and Framer Motion (page transitions, dialogs, sliding pills, list animations). Both respect "reduce motion" settings.

## Tech choices (and why)

| Layer | Technology | Why I chose it |
|---|---|---|
| Backend | **Python 3.12 + FastAPI** | Validates every request automatically with Pydantic and generates Swagger docs, so reviewers can try the API in the browser. Fast and readable. |
| Database | **SQLite + SQLAlchemy 2.0** | Zero setup: the database is a single file created on first run. SQLAlchemy keeps queries safe from SQL injection, and moving to another database means changing one setting. |
| Frontend | **React 19 + Vite** | The component model fits tables, forms and dialogs. Vite gives instant reloads and a small production build. |
| Styling | **Tailwind CSS v4** | One set of design tokens (blue = brand, purple = New, yellow = Contacted, orange = Converted), consistent spacing, responsive layouts in markup. |
| Data fetching | **TanStack Query** | Handles loading, error, caching and refetching, which covers several brief requirements cleanly. Status changes update instantly and roll back if the server rejects them. |
| Forms | **react-hook-form + zod** | Instant, field-level validation that mirrors the backend rules. |
| Animation | **GSAP + Framer Motion** | GSAP for timelines and scroll-driven effects; Framer Motion for UI state changes (enter/exit, layout). |
| Charts | **Hand-built SVG** | No chart library: each chart is small, fully explainable code, animated with GSAP. |
| Auth | **Argon2 + JWT in an httpOnly cookie** | Industry-standard password hashing; page scripts can't read the session. |
| AI | **Groq (`openai/gpt-oss-120b`)** | Very fast answers. Clive uses tool calling to look up real data instead of guessing. |
| Hosting | **Vercel** | One project serves the React app and the Python API on the same domain (no CORS or cookie problems). |
| Tests | **pytest** | 102 backend tests covering CRUD, search/filter, validation, auth, data isolation, analytics and Clive. |

## Project structure

```
├── api/index.py             # Vercel entry point → runs backend/app as a serverless function
├── vercel.json              # build, function and rewrite settings for Vercel
├── requirements.txt         # Python packages (Vercel installs from here)
├── docs/PRD.md              # requirements document for the submission
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app: CORS, error handlers, routers, startup
│   │   ├── core/            # settings, database, security (hashing, sessions), errors, rate limiting
│   │   ├── models/          # SQLAlchemy tables: users, leads
│   │   ├── schemas/         # Pydantic request/response models (validation lives here)
│   │   ├── services/        # business logic: leads, auth, analytics, Clive, demo data
│   │   └── api/routes/      # thin HTTP layer: health, auth, leads, clive
│   ├── scripts/             # seed.py (demo data), clive_live_check.py (real-AI test)
│   └── tests/               # pytest suite (102 tests)
└── frontend/
    └── src/
        ├── pages/           # Dashboard, Analytics, Leads, About, Login
        ├── components/      # layout, dashboard, analytics, leads, clive, auth, ui
        ├── hooks/           # data fetching (TanStack Query), auth, helpers
        ├── api/             # fetch wrapper + one function per endpoint
        └── lib/             # validation, constants, formatting, chart and motion helpers
```

## Run it locally

Requirements: **Python 3.12+** and **Node.js 20+**.

### 1. Backend (terminal 1)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
copy .env.example .env                # macOS/Linux: cp .env.example .env
python -m scripts.seed                # creates the demo account with 70 sample leads
uvicorn app.main:app --reload
```

The API runs at http://127.0.0.1:8000/api, and the interactive docs at http://127.0.0.1:8000/api/docs.

### 2. Frontend (terminal 2)

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and click **Try the demo account**, or sign up for a fresh account. In development, Vite forwards `/api` requests to the backend, so no extra configuration is needed.

### 3. Clive, the AI assistant (optional)

Create a free key at https://console.groq.com/keys and put it in **`backend/.env`** (git-ignored), never in `.env.example`:

```
GROQ_API_KEY=gsk_...
```

Restart the backend. Without a key everything else works, and Clive explains how to set it up. To grade Clive against real data, run `python -m scripts.clive_live_check` in `backend/`. It asks 10 questions, covering facts, a follow-up, an invented name, a prompt-injection note, a delete request and an off-topic request, and checks each answer against the database.

### Tests

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
```

Tests use a fresh in-memory database and a fake AI client, so they never touch `crm.db` or call Groq.

## Database setup

**Locally there is nothing to install.** On first start the API creates `backend/crm.db` (SQLite) with two tables:

| Table | Columns |
|---|---|
| `users` | id, name, email (unique), password_hash, created_at |
| `leads` | id, owner_id → users, name, email (unique per owner), phone, business_name, status (`New` / `Contacted` / `Converted`), notes, created_at, updated_at |

| Command (in `backend/`) | What it does |
|---|---|
| `python -m scripts.seed` | Creates the demo account (`demo@kinetiq.app` / `DemoPass123`) with 70 realistic sample leads. Safe to run again. |
| `python -m scripts.seed --reset` | **Deletes everything** (all accounts and leads) and re-creates the demo. |
| `DATABASE_URL=...` in `backend/.env` | Use a different database file or server. |

**In production (Vercel)** the code folder is read-only, so the SQLite file lives in the function's temporary storage (`/tmp`). The demo account and sample leads are re-created automatically whenever the function starts.

> ⚠️ **Limitation:** Vercel clears `/tmp` when the function goes idle, and parallel copies don't share it. Leads you add, and new accounts, can therefore reset after a while (a normal page refresh keeps them). For permanent storage, set `DATABASE_URL` to a hosted SQLite database such as **Turso** (libSQL). The SQL and code stay the same, plus its SQLAlchemy driver.

## Deploying to Vercel

1. Import this GitHub repository at https://vercel.com/new. `vercel.json` already sets the build, the output folder, the Python function and the rewrites. Keep the Root Directory as the repository root.
2. Add the environment variables (Project → Settings → Environment Variables):
   - `SECRET_KEY`: a random string of 32+ characters. Generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"`. The API refuses to start in production without it.
   - `GROQ_API_KEY`: for Clive (optional).
3. Deploy. `/` serves the React app, `/api/*` the FastAPI backend, and page URLs such as `/leads` open directly.

## API reference

All `/api/leads*` and `/api/clive*` endpoints require a logged-in session (cookie) and only see the caller's own leads. Full interactive docs: `/api/docs`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | API + database health |
| POST | `/api/auth/signup` | `{name, email, password}` → creates the account and logs in |
| POST | `/api/auth/login` | `{email, password}` → logs in |
| POST | `/api/auth/logout` | Logs out |
| GET | `/api/auth/me` | The logged-in user |
| GET | `/api/leads` | List leads. Query: `search`, `status`, `page`, `page_size` (≤100), `sort` (`newest`, `oldest`, `name_asc`, `name_desc`) |
| POST | `/api/leads` | Create a lead |
| GET | `/api/leads/{id}` | One lead |
| PUT | `/api/leads/{id}` | Update all fields |
| PATCH | `/api/leads/{id}/status` | Change only the status |
| DELETE | `/api/leads/{id}` | Delete a lead |
| GET | `/api/leads/stats` | `{total, new, contacted, converted, conversion_rate}` |
| GET | `/api/leads/analytics` | Chart data. Query: `days` (7–365), `tz_offset_minutes` |
| POST | `/api/leads/sample-data` | Adds 70 sample leads to your account |
| GET | `/api/clive/status` | Is Clive configured? |
| POST | `/api/clive/chat` | `{messages: [{role, content}], tz_offset_minutes}` → `{reply, tools_used}` |

Every error uses one shape, so the UI can show a message and highlight the right form field:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Some fields are invalid.", "details": [{ "field": "email", "message": "Enter a valid email address." }] } }
```

Codes: `VALIDATION_ERROR` (422), `NOT_FOUND` (404), `DUPLICATE_EMAIL` / `EMAIL_TAKEN` (409), `UNAUTHORIZED` / `INVALID_CREDENTIALS` (401), `TOO_MANY_REQUESTS` (429), `ASSISTANT_UNAVAILABLE` (503), `INTERNAL_ERROR` (500).

## Challenges & how they were solved

1. **Keeping validation consistent on both sides.** Users should see mistakes instantly, but the server must never trust the browser. I wrote the same rules twice (zod in the browser, Pydantic on the server) and made the API return field-level errors, so even server-only checks (like a duplicate email) appear under the right input.
2. **Timestamps without time zones.** SQLite drops time-zone information, so times came back "naive" and the browser read them as local time. A custom column type stores UTC and always returns time-zone-aware values. Analytics are bucketed in the *viewer's* time zone, which is sent with each request.
3. **Errors that the browser can actually read.** A crash inside FastAPI normally skips the CORS headers, so the browser reports a confusing "CORS error" instead of the real message. Catching unexpected errors in middleware inside the CORS layer means every failure, even a 500, reaches the UI as a clean JSON message.
4. **Logout that didn't log out.** The server cleared the session, but the screen stayed on the dashboard. Clearing the whole data cache had also detached the screen from the "who's logged in" query. The fix clears everything *except* that query.
5. **Making the AI assistant trustworthy.** The model could only answer from data it was given, so I built four read-only lookup tools tied to the logged-in account (the model can never choose whose data it reads). I then wrote a live test that grades 10 real questions against the database. It caught a tool that reported the busiest *time slots* instead of the busiest *weekday* (fixed by adding per-day totals) and an invented "bulk delete" feature (fixed by describing the real UI to the model). The same test showed that slow answers were Groq free-tier rate limits, not the model.
6. **SQLite on a serverless host.** Vercel's code folder is read-only and its temporary storage resets. The database moves to `/tmp` automatically on Vercel, the demo account is re-created on startup so the live link always works, and the limitation is documented (see *Database setup*). I also simulated Vercel's startup locally before deploying, which caught a local `.env` file overriding production settings.
7. **Keeping secrets out of the repository.** An API key once ended up in the committed `.env.example` template. Keys now live only in the git-ignored `.env` (locally) and the Vercel dashboard (production), and the repository was scanned for secrets before publishing.

## Requirements document

See [docs/PRD.md](docs/PRD.md) for the submission requirements, acceptance criteria, feature traceability and risks. The original build plan is in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).
