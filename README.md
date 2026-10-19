# BookFlow: multi-tenant booking and rental platform

Customers search cars, villas and apartments on a map, pick dates, pay, and manage bookings.
Businesses (tenants) manage their own listings, prices and bookings from a dashboard.
An admin watches the whole platform.

**Stack:** React 18 + TypeScript + Vite + Tailwind, Redux Toolkit, TanStack Query, Node + Express + TypeScript, MongoDB (Mongoose), JWT auth, Stripe (test mode), Leaflet maps, Recharts, optional Gemini AI. Everything has a free option.

## Run it on your computer (about 5 minutes)

You need **Node.js 18.18 or newer** and a MongoDB database (pick one):

* **Free cloud (easiest):** create a free cluster at mongodb.com/atlas, then copy its connection string.
* **Docker:** `docker compose up -d mongo`, then use `mongodb://127.0.0.1:27017/bookflow`.

```bash
npm install                      # installs server and client together
cp server/.env.example server/.env   # Windows: copy server\.env.example server\.env
# open server/.env and set MONGODB_URI and two long random JWT secrets
npm run seed                     # creates demo businesses, listings and bookings
npm run dev                      # API on :5000, website on http://localhost:5173
```

### Demo logins (created by `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Customer | demo@bookflow.dev | Demo@123 |
| Business owner | owner@bookflow.dev | Owner@123 |
| Business owner 2 | hunza@bookflow.dev | Owner@123 |
| Admin | admin@bookflow.dev | Admin@123 |

The login page also has one-click buttons for these accounts.

## What to show an interviewer (2-minute tour)

1. **Home:** type "7 seater in Karachi this weekend under 30k" into Smart search. It becomes filters. Switch to the Map view.
2. **Listing page:** pick dates on the calendar (booked nights are crossed out). The price breakdown shows weekend and long-stay rules.
3. **Reserve:** the dates are held for 10 minutes with a countdown. Pay with the test card.
4. **Owner login:** dashboard with revenue, occupancy and charts; edit listing prices; cancel a booking.
5. **Admin login:** users, businesses and the audit log.

## Folder structure

```
bookflow/
  server/src/
    config/        env.ts (validated settings), db.ts, constants.ts
    models/        User, Tenant, Listing, Booking, BookedDay, Review, AuditLog
    modules/       one folder per feature: auth, listings, bookings, reviews,
                   dashboard, admin, ai, payments, currency
                   (each has routes -> controller -> optional schema)
    services/      business rules: pricing, booking state machine, booking logic,
                   currency, AI search, Stripe
    middleware/    auth (JWT + roles), validate (zod), errorHandler
    jobs/          bookingJobs.ts (expire holds, complete stays)
    seed/          seed.ts (demo data)
  server/tests/    pricing + state machine tests
  client/src/
    api/           client.ts (axios + auto token refresh), endpoints.ts
    store/         Redux Toolkit: auth, currency, booking draft
    pages/         one file per screen (owner/ and admin/ are sub-folders)
    components/    ui/ (Button, Field, Modal...), layout/, listings/, bookings/
    hooks/ lib/ types/
```

**Rule of thumb for reading the code:** a request goes `route -> controller -> service -> model`.
Routes say *which URL*, controllers handle *the request*, services hold *the business rules*, models describe *the data*.

## The five engineering decisions (your talking points)

1. **No double bookings.** Every booked night is one `BookedDay` document, and the collection has a *unique index* on `(listingId, date)`. If two people book the same night at the same moment, MongoDB itself rejects the second one (`services/booking.service.ts`). No locks, no race conditions, works on any MongoDB.
2. **Temporary hold.** Choosing dates creates a `HELD` booking that expires in 10 minutes. A job running every minute frees unpaid holds.
3. **Booking state machine.** `HELD -> CONFIRMED -> COMPLETED`, with `CANCELLED` and `EXPIRED` branches. Illegal moves are rejected (`services/bookingState.ts`, covered by tests).
4. **Multi-tenancy.** Each business is a `Tenant`. Owners can only read and change data with their own `tenantId`; this is checked on the server, not just hidden in the UI.
5. **Safe login.** Short-lived access token (15 min) kept in memory, long-lived refresh token in an httpOnly cookie. Logout bumps `tokenVersion`, which kills old refresh tokens.

Pricing is a pure function (`services/pricing.service.ts`): base price, +X% on Friday/Saturday nights, discount from 7 nights.

## Optional integrations (all free)

* **Stripe test mode:** put your `sk_test_...` key in `STRIPE_SECRET_KEY`. Pay with card `4242 4242 4242 4242`. After redirect the server verifies the payment with Stripe, so it works even without webhooks. For webhooks locally: `stripe listen --forward-to localhost:5000/api/payments/webhook` and copy the `whsec_...` value to `STRIPE_WEBHOOK_SECRET`. Without a key, the app uses a built-in test payment form.
* **Gemini AI search:** a free key from aistudio.google.com in `GEMINI_API_KEY`. Without it, a rule-based parser handles the Smart search. Free quotas and model names change, so check `GEMINI_MODEL` if it stops working.

## Deploy for free

1. **Database:** MongoDB Atlas free cluster. Allow access from anywhere (0.0.0.0/0) in Network Access.
2. **API on Render (free web service):** New Web Service from your GitHub repo, root directory `server`, build command `npm install`, start command `npm start`. Add the env vars from `.env.example`, with `NODE_ENV=production` and `CLIENT_URL` set to your Vercel address. Free services sleep when idle, so the first request can take about 30 seconds. A free UptimeRobot ping every 5 minutes keeps it awake.
3. **Website on Vercel (free Hobby):** import the repo, root directory `client`, framework Vite. Edit `client/vercel.json` and replace `YOUR-API-NAME.onrender.com` with your Render address. This forwards `/api` to the server, so cookies and CORS just work.
4. Run `npm run seed` once against the Atlas database (set `MONGODB_URI` in `server/.env` to the Atlas string) so the demo accounts exist.

Free tier rules change, so check each provider's pricing page before deploying.

## Tests, scripts and Docker

```bash
npm test                      # pricing and state-machine tests
npm run typecheck -w server   # full TypeScript check of the API
npm run typecheck -w client
docker compose up --build     # whole app at http://localhost:8080
```

## Troubleshooting

* **"Invalid environment settings"** at startup: a value in `server/.env` is missing or too short.
* **Cannot connect to MongoDB:** check `MONGODB_URI`, and on Atlas check Network Access and the password (special characters must be URL-encoded).
* **Empty home page:** run `npm run seed`.
* **Port in use:** change `PORT` in `server/.env` and the proxy target in `client/vite.config.ts`.
* **Logged out after deploying:** the website and API are on different domains without the Vercel rewrite. Use the rewrite, or set `CROSS_SITE_COOKIES=true`.

## Not included (honest scope)

Refund handling on cancellation, email notifications, image upload (owners paste image links), Google login, PostgreSQL and Redis/BullMQ. The in-process job and MongoDB cover those needs at this size, and you can describe them as the natural next steps for scaling.
