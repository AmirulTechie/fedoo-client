<!-- BEGIN:nextjs-agent-rules -->

# AGENTS.md

Guidance for AI coding agents working on Fedoo. Read this before changing anything.

## What this project is

Fedoo is a food delivery MVP for Bangladesh. Restaurants pay a flat monthly subscription and keep 100% of food sales (0% order commission). Customers order, restaurant owners manage menus and orders, admins approve restaurants.

This is an MVP to demo to real restaurant owners. Working end to end matters more than being complete. Do not build features that are not listed under "In scope".

## Stack

- Next.js (App Router), TypeScript (strict), Tailwind CSS, `src/` directory
- MongoDB Atlas with Mongoose
- Better Auth (email and password), roles stored on the user
- Zod for validating every request body on the server
- Images hosted externally (imgBB or Cloudinary), served through `next/image`
- Deployed on Vercel
- Cache Components (`cacheComponents`) is NOT enabled. Do not enable it or add `"use cache"` unless asked.

## Commands

```bash
npm run dev      # start dev server on localhost:3000
npm run build    # production build, must pass before deploy
npm run lint     # ESLint
```

## Folder layout

```
src/
  app/            routes, layouts, route handlers (api/)
  components/     shared UI components
  lib/            db.ts, auth.ts, auth-client.ts, config.ts, orderStatus.ts
  models/         Mongoose models: Restaurant, MenuItem, Order, Address
```

- `@/` maps to `src/`. Always use `@/lib/...`, never deep relative paths.
- Better Auth owns the `user` collection. There is no Mongoose User model.
- User ids (`ownerId`, `customerId`, `userId`) are plain strings.
- `.env.local` lives in the project root. Never commit it or print secrets.

## In scope (MVP)

- Auth with roles: `customer`, `owner`, `admin`
- Restaurant registration, admin approve or reject, 15-day trial
- Menu CRUD with image upload
- Customer browse, cart, checkout with cash on delivery
- Owner order dashboard with accept, reject and status updates
- Customer order tracking (poll every 10 seconds) and history

## Out of scope for now

Online payments (bKash, SSLCommerz), real subscription billing, rider panel, websockets or push, verification document uploads, reviews, coupons, chat, full Bangla translation. If a task needs one of these, stop and ask.

## Business rules (never break these)

1. Order commission is always 0. `commissionAmount` stays 0. Never deduct a percentage from restaurant sales.
2. Trial dates are set once, in `restaurant.approve()`. Logging in or editing a restaurant must never reset them.
3. Prices come from the database, never from the client. The create-order route recalculates every line total and the order total on the server.
4. Order items are snapshots (name, variant, unit price copied at order time).
5. Order status changes go through `canTransition(from, to, role)` in `@/lib/orderStatus`. No route may set `status` directly.
6. Creating an order must check `restaurant.canAcceptOrders` and use the `idempotencyKey` to prevent duplicates.
7. Pending decisions (trial days, delivery fee, payment methods, plan prices) live in `@/lib/config`. Never hardcode them elsewhere.
8. Restaurant data and menus are never deleted when a trial expires. Unpublish instead of delete.

## Security rules

- Check the session AND the role on every protected route handler and server action. Hiding a button in the UI is not security.
- Owner routes must also verify the restaurant belongs to the logged-in user (`restaurant.ownerId === session.user.id`).
- Customers can only read their own orders and addresses.
- `role` is set with `input: false` in Better Auth. Never accept a role from a request body.
- Validate all input with Zod. Return clear 400 errors, never raw error objects.
- No secrets in client components. Only `NEXT_PUBLIC_` variables may reach the browser.

## Code conventions

- TypeScript strict. No `any` unless there is a comment explaining why.
- Server components by default. Add `"use client"` only for interactivity (forms, cart, polling).
- Call `await connectDB()` at the top of every route handler and server action that touches the database.
- Use `.lean()` and `.select()` on read-only Mongoose queries. Paginate lists. Never fetch a whole collection.
- Keep route handlers thin: validate, authorize, call a function, return.
- Name things plainly. No clever abstractions for a 3 week MVP.

## UI rules

- Mobile first. Customer pages must work well on a cheap Android phone over slow data.
- Every data screen needs loading (skeleton), empty, error and success states.
- Use `next/image` with proper `sizes` for every photo. No raw `<img>` for food images.
- Buttons disable and show progress while submitting.
- Plain, friendly copy. No emojis in UI text, project descriptions or documentation.
- Respect `prefers-reduced-motion`. Keep keyboard focus visible.

## How to work with me

- The developer is learning TypeScript and Next.js. Explain what you changed and why, briefly.
- Work one feature at a time, UI and backend together (vertical slice). Finish and verify before starting the next.
- Before large changes, say what files you plan to touch.
- If something is ambiguous, ask one clear question instead of guessing.
- When a command or build fails, show the exact error and explain the cause before fixing.
- Do not install new packages without saying why.
- Run `npm run lint` and `npm run build` before saying a task is done.

<!-- END:nextjs-agent-rules -->
