# Bookly

A full-stack service marketplace connecting clients and providers, built as
a learning project to practice production-grade patterns: real-time
messaging, payments, notifications, and an AI-assisted dashboard.

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix primitives)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Payments:** Stripe Connect
- **Data fetching:** TanStack Query
- **AI:** Claude API (smart reply suggestions in chat)

## Getting started

\`\`\`bash
npm install
cp .env.example .env.local # fill in your Supabase & Stripe keys
npm run dev
\`\`\`

## Project status

🚧 Work in progress — built incrementally, feature by feature.

## Roadmap

- [x] Project setup (Next.js, TypeScript, Tailwind, shadcn/ui)
- [ ] Supabase schema & authentication
- [ ] Dashboard shell (bookings, profile, settings)
- [ ] Real-time messaging
- [ ] In-app notifications
- [ ] Payments & PDF invoicing
- [ ] AI-assisted chat replies