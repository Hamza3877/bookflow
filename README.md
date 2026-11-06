# BookFlow: Multi-Tenant Booking & Rental Platform (MERN + TypeScript)

Customers search cars, villas and apartments on a map, pick dates, pay, and manage bookings.
Businesses (tenants) manage their own listings, prices and bookings from a dashboard.
An admin watches the whole platform.

**Stack:** React 18 + TypeScript + Vite + Tailwind, Redux Toolkit, TanStack Query, Node + Express + TypeScript, MongoDB (Mongoose), JWT auth, Stripe , Leaflet maps, Recharts,  Gemini AI..


BookFlow is a full-stack booking platform for rental businesses like car rental, villas and apartments. Each business manages its own listings, prices and bookings, and customers can search, pick dates, pay and track their trips.

Live: https://bookflow-puce.vercel.app/

What it does
- Customers: search by city, type, dates, guests and price in list or map view. They see the full price (weekend and long-stay rules) before booking, their dates are held for 10 minutes while they pay, and they can cancel or leave a review.
- Business owners: a dashboard with revenue, occupancy and charts, plus listing, pricing and booking management.
- Admin: users, businesses and an audit log.

Problems I focused on
- No double bookings: every night is stored separately with a unique database index, so two people can never book the same night, even at the same moment.
- Booking states (held, confirmed, completed, cancelled, expired) with unpaid holds released automatically.
- Multi-tenant data: owners only see their own business, enforced on the server.
- Secure login: JWT access token with a refresh token in an httpOnly cookie, and role-based access.
- Photo upload: images are uploaded to Cloudinary and the app stores the image link, so pictures load fast from a CDN.

Built with React, TypeScript, Node.js, Express, MongoDB, Redux Toolkit, TanStack Query, Tailwind CSS, Stripe, Leaflet maps and Gemini AI search. Hosted on Vercel, Railway and MongoDB Atlas.

### Demo logins

| Role | Email | Password |
|---|---|---|
| Customer | demo@bookflow.dev | Demo@123 |
| Business owner | owner@bookflow.dev | Owner@123 |
| Business owner 2 | hunza@bookflow.dev | Owner@123 |
| Admin | admin@bookflow.dev | Admin@123 |

## Screenshots

![Home](docs/screenshots/1.png)
![Dashboard](docs/screenshots/2.png)
