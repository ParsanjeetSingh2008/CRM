# KINETIQ: Product Requirements Document

**Project:** SHL Tech Internship, Task 1 (Mini CRM Dashboard)
**Product name:** KINETIQ
**Phase:** 3, Deployment & submission
**Status:** In progress · last updated 24 Nov 2026

---

## 1. Purpose

Deliver KINETIQ, a working lead-tracking CRM, to the SHL Tech team in a form they can **test live, inspect in code, and run themselves**. This document turns the five submission requirements into concrete, checkable acceptance criteria, and traces every feature asked for in the brief to where it is implemented and how it is verified.

## 2. Users

| User | Need |
|---|---|
| **SHL reviewer** (primary for this phase) | Open a link, try every feature in minutes without setup, read clean code, run it locally from the README, understand the choices made. |
| **Small-business owner** (product user) | Track enquiries from first contact to customer, see how the pipeline is doing, find any lead quickly. |

## 3. Submission deliverables

| ID | Deliverable (from the brief) | Acceptance criteria | How it's met | Status |
|---|---|---|---|---|
| **D1** | A live link where we can test the project | Public HTTPS URL. Loads on desktop and mobile. **"Try the demo account"** logs in with no setup. Every brief feature works there. Page URLs (`/leads`, `/about`) open directly and survive refresh. | One Vercel project serves the React app and the FastAPI API on the same domain. The demo account and 70 sample leads are created automatically on startup. SPA rewrite for page URLs. | ⏳ Deploying |
| **D2** | A GitHub repository containing the code | Public repo, full source for frontend, backend, tests and docs. **No secrets** in any commit (`.env` ignored; `.env.example` templates only). Clear commit history. | `.gitignore` covers `.env`, databases, `node_modules`, virtualenvs. A secret scan runs before the first push. | ⏳ Creating |
| **D3** | README explaining what was built and how to run it | Live link + demo login at the top. Feature list. Step-by-step local setup for backend and frontend (Windows and macOS/Linux). API reference. | `README.md` | ✅ |
| **D4** | Instructions for setting up the database | Works with zero manual steps locally. Explains the schema, seeding, resetting, and where data lives in production and its limits. | README → *Database setup*: SQLite created automatically, `python -m scripts.seed`, `--reset`, Vercel note. | ✅ |
| **D5** | Short explanation of technologies and challenges | Each technology with *why* it was chosen. Real challenges met during the build and how they were solved. | README → *Tech choices* and *Challenges & how they were solved*. | ✅ |

## 4. Feature requirements from the brief (traceability)

| Brief requirement | Implemented as | Verified by |
|---|---|---|
| **Dashboard:** total, new, converted leads | Dashboard page: four animated stat cards (Total, New, Contacted, Converted + conversion rate) | `test_stats*`, browser check |
| **Add / edit / delete leads** | "Add lead" on the Leads page and Dashboard; edit and delete on every lead and in its profile card; delete asks for confirmation | `test_leads_crud.py` (15 tests) |
| Lead fields: name, email, phone, business, status | `leads` table + validation on both sides (email format, 7–15-digit phone, unique email per account) | `test_validation.py` |
| **Search by name or email** | Debounced search box, case-insensitive, partial match | `test_search_*` |
| **Filter by status** (New / Contacted / Converted) | Status filter buttons, also reachable from dashboard cards (`/leads?status=New`) | `test_filter_*`, browser check |
| **Update a lead's status** | Status dropdown on every row, card and profile (updates instantly, rolls back on error) | `test_update_status` |
| **Data persists** in a database | SQLite via SQLAlchemy, see risk R1 for hosting | `test_leads_crud.py` |
| **Frontend ↔ backend API** | REST API under `/api`, documented at `/api/docs` | 102 automated tests |
| **Responsive** design | Table → cards on phones; nav becomes a tab row; tested at 375 px and desktop | Browser checks |
| **Loading message** | Skeletons + "Loading leads…" text | Browser check |
| **Empty state** | "No leads yet" (with "Add" / "Load sample leads") and "No matching leads" (with "Clear filters") | Browser check |
| **Clear error messages** | One JSON error shape from the API; friendly messages and "Try again" in the UI | `test_app.py`, backend-down browser test |
| **Form validation** | Same rules in the browser (zod) and on the server (Pydantic); server errors shown on the right field | `test_validation.py`, browser check |

**Beyond the brief** (requested during the build): login/sign-up with private accounts, analytics page (trend graph, status donut, enquiry heatmap), lead profile card, **Clive** AI assistant (Groq), top navigation with Dashboard / Analytics / Leads / About pages, KINETIQ branding.

## 5. Non-functional requirements

| Area | Requirement |
|---|---|
| Security | Passwords hashed with Argon2; session in an httpOnly, Secure, SameSite=Lax cookie; production refuses to start without a strong `SECRET_KEY`; every query scoped to the logged-in account; login and Clive rate-limited; no secrets in the repo. |
| Reliability | Uniform API error format; the UI never shows a blank or broken screen (loading, empty and error states everywhere). |
| Performance | Pages load on demand (code-split); search debounced; Groq answers in ~1–3 s. |
| Accessibility | Keyboard-reachable controls, visible focus, labelled inputs, table views for every chart, `prefers-reduced-motion` respected. |
| Maintainability | Backend split into routes → services → models; frontend into pages / components / hooks; 102 automated backend tests. |

## 6. Deployment design

- **Host:** Vercel, one project, one domain.
  - Static React build from `frontend/dist`.
  - `api/index.py` runs the FastAPI app as a Python serverless function.
  - `vercel.json` rewrites `/api/*` to the function and every other path to `index.html`.
- **Database:** SQLite, as decided for this submission. On Vercel the file lives in the function's temporary storage (`/tmp`) because the code folder is read-only.
- **Environment variables (set in the Vercel dashboard by the owner, never committed):**

| Variable | Required | Purpose |
|---|---|---|
| `SECRET_KEY` | Yes (production) | Signs login sessions. 32+ random characters. |
| `GROQ_API_KEY` | For Clive | Clive's LLM. Without it Clive shows a setup notice; everything else works. |

## 7. Risks

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| **R1** | **SQLite on serverless is temporary.** Vercel's `/tmp` is wiped when a function instance goes cold, and parallel instances don't share it. | Leads a reviewer adds, and new sign-ups, can disappear after a period of inactivity. This touches the brief's "doesn't disappear on refresh" check (a plain refresh while the app is active keeps data). | The demo account + sample data are re-created on every start, so the live link always works. The README states the limitation honestly. **Upgrade path:** point `DATABASE_URL` at Turso (hosted SQLite, same SQL) by changing one setting and adding its driver. |
| R2 | Groq free-tier rate limits | Bursts of questions wait 6–10 s | Clive retries automatically; per-user cap of 30 questions / 10 min. |
| R3 | Cold starts | First request after idle takes a few seconds | Loading skeletons; the client retries 5xx/network errors. |
| R4 | Secret leakage | Compromised keys | `.env` git-ignored, secret scan before push, keys only in the Vercel dashboard. The Groq key shared in chat during development should be rotated. |

## 8. Release checklist

- [x] All brief features implemented and tested (102 backend tests, browser checks on desktop and mobile)
- [x] Production build passes; Vercel startup simulated locally (production mode, temp DB, demo seeding, secure cookie, secret-key guard)
- [x] README covers run instructions, DB setup, tech choices and challenges
- [ ] Secret scan clean; public GitHub repo created and pushed
- [ ] Vercel project imported; `SECRET_KEY` and `GROQ_API_KEY` set
- [ ] Live smoke test: demo login, add/edit/delete, search, filter, status change, charts, Clive, page refresh on `/leads`
- [ ] Live link added to the README and submitted
