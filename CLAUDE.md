# CLAUDE.md - Family Finance App

## Project Overview
ระบบจัดการค่าใช้จ่ายครอบครัว — Next.js 16 App Router + Supabase + Prisma 7
รายละเอียดเพิ่มเติมดูที่ [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

## Quick Commands
- `npm run dev` — Start dev server
- `npm run build` — Build (runs `prisma generate` first)
- `npm run lint` — ESLint
- `npx prisma db push` — Push schema to database
- `npx prisma studio` — Open Prisma Studio

## Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 + Shadcn UI (Base UI variant — uses `render` prop, NOT `asChild`)
- **Database**: PostgreSQL (Supabase) + Prisma 7 ORM
- **Auth**: Supabase Auth (Email/Password, cookie-based sessions)
- **Forms**: React Hook Form + Zod validation
- **Deploy**: Vercel

## Project Structure
```
src/
├── app/(auth)/          # Login, Register pages
├── app/(protected)/     # Installments, Subscriptions, Debts, Settings
├── app/api/cron/        # Vercel Cron (check-overdue)
├── actions/             # Server Actions (auth, debts, family, installments, subscriptions)
├── components/          # React components
│   ├── installments/    # Form, list, card, payment-table, edit, splits, platform-row, pay-platform
│   ├── subscriptions/   # Form, card
│   ├── debts/           # Form, card
│   ├── settings/        # Leave group button
│   ├── layout/          # Sidebar, header, mobile-nav
│   ├── shared/          # Confirm dialog, status badge, setup prompt
│   └── ui/              # Shadcn UI components (DO NOT manually edit)
├── lib/                 # Prisma client, Supabase clients, validations (Zod), calculations, utils
├── types/               # TypeScript types
├── constants/           # Categories, platforms, subscriptions
└── generated/           # Prisma generated client (DO NOT EDIT)
```

## Key Architecture Decisions
- **Server Actions** over API routes — all data mutations go through `src/actions/`
- **Supabase Auth** with middleware (`middleware.ts`) handles route protection
- **Prisma client** output to `src/generated/prisma` (custom path)
- **No REST API** — only 1 API route for Vercel Cron job
- **Personal vs Family scope**: Subscriptions are personal (tied to Profile), Installments/Debts are family-scoped (tied to FamilyGroup)
- **Payment status sync**: `syncPaymentStatuses()` in installments.ts runs on every data fetch to ensure statuses are always current

## Database
- Schema: `prisma/schema.prisma`
- 10 models: Profile, FamilyGroup, FamilyMember, Category, Transaction, Installment, InstallmentPayment, InstallmentSplit, Debt, Subscription
- After schema changes: run `npx prisma db push` then `npx prisma generate`

## Menu Structure
- **ส่วนตัว**: สมัครสมาชิก (Subscriptions), หนี้สิน (Debts)
- **ครอบครัว**: การผ่อนชำระ (Installments)
- **อื่นๆ**: ตั้งค่า (Settings)

## Coding Conventions
- UI text and validation messages are in **Thai** (ภาษาไทย)
- Zod schemas live in `src/lib/validations.ts`
- Interest calculations in `src/lib/calculations.ts`
- Currency formatting uses Thai Baht (฿)
- Component naming: PascalCase files, organized by feature folder
- Shadcn UI components in `src/components/ui/` — do not manually edit, use CLI to add new ones
- All server actions that mutate data must call `getCurrentUser()` and verify ownership/group membership

## Important Patterns
- `getCurrentUser()` from `src/actions/auth.ts` — use in every protected server action
- `syncPaymentStatuses()` — auto-syncs payment statuses based on current date (called in getInstallments/getInstallmentById)
- Supabase client: server → `src/lib/supabase/server.ts`, browser → `src/lib/supabase/client.ts`
- Prisma client: `src/lib/prisma.ts` (uses PostgreSQL adapter)
- All forms use React Hook Form + Zod resolver pattern
- Toast notifications via Sonner
- Default landing page: `/installments`

## Environment Variables
Required in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (PostgreSQL connection string with `?pgbouncer=true`)
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`

## Things to Watch Out For
- Prisma generated client is at `src/generated/prisma` — NOT the default location
- Build requires `prisma generate` before `next build` (already in build script)
- Installment interest calculations have 4 types: flat, reducing, reducing_daily (Shopee), none
- Shopee has 2 platforms: `shopee` (ผ่อนสินค้า) and `shopee_cash` (กู้เงินสด) — both support SEasyCash fields
- Shadcn UI v4 uses Base UI: use `render` prop instead of `asChild` for component composition
- Dashboard and Reports pages are redirects to `/installments` (features removed)
- Transaction feature code was removed but DB model kept for historical data
