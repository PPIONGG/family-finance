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
- **Styling**: Tailwind CSS 4 + Shadcn UI
- **Database**: PostgreSQL (Supabase) + Prisma 7 ORM
- **Auth**: Supabase Auth (Email/Password, cookie-based sessions)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Deploy**: Vercel

## Project Structure
```
src/
├── app/(auth)/          # Login, Register pages
├── app/(protected)/     # Dashboard, Transactions, Installments, Debts, Reports, Settings
├── app/api/cron/        # Vercel Cron (check-overdue)
├── actions/             # Server Actions (auth, dashboard, debts, family, installments, transactions)
├── components/          # React components (dashboard/, installments/, transactions/, debts/, layout/, shared/, ui/)
├── lib/                 # Prisma client, Supabase clients, validations (Zod), calculations, utils
├── types/               # TypeScript types
├── constants/           # Categories, platforms
└── generated/           # Prisma generated client (DO NOT EDIT)
```

## Key Architecture Decisions
- **Server Actions** over API routes — all data mutations go through `src/actions/`
- **Supabase Auth** with middleware (`middleware.ts`) handles route protection
- **Prisma client** output to `src/generated/prisma` (custom path)
- **No REST API** — only 1 API route for Vercel Cron job

## Database
- Schema: `prisma/schema.prisma`
- 9 models: Profile, FamilyGroup, FamilyMember, Category, Transaction, Installment, InstallmentPayment, InstallmentSplit, Debt
- After schema changes: run `npx prisma db push` then `npx prisma generate`

## Coding Conventions
- UI text and validation messages are in **Thai** (ภาษาไทย)
- Zod schemas live in `src/lib/validations.ts`
- Interest calculations in `src/lib/calculations.ts`
- Currency formatting uses Thai Baht (฿)
- Component naming: PascalCase files, organized by feature folder
- Shadcn UI components in `src/components/ui/` — do not manually edit, use CLI to add new ones

## Important Patterns
- `getCurrentUser()` from `src/actions/auth.ts` — use in every protected server action
- Supabase client: server → `src/lib/supabase/server.ts`, browser → `src/lib/supabase/client.ts`
- Prisma client: `src/lib/prisma.ts` (uses PostgreSQL adapter)
- All forms use React Hook Form + Zod resolver pattern
- Toast notifications via Sonner

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
- Shopee SEasyCash has special form fields (manual monthly payment, total interest input)
