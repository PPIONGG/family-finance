# Family Finance Manager — Project Prompt

## Project Overview

สร้างเว็บแอปจัดการการเงินครอบครัว (Family Finance Manager) สำหรับใช้งานจริงในครอบครัว โดยเน้นการติดตามค่าใช้จ่าย หนี้สิน และการผ่อนชำระสินค้า (เช่น Shopee PayLater, บัตรเครดิต, สินเชื่อต่างๆ)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) — fullstack |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email/Password + Magic Link) |
| ORM | Prisma |
| Server State | TanStack Query (React Query) |
| Client State | Zustand |
| Charts | Recharts |
| Forms | React Hook Form + Zod validation |
| Date | date-fns |
| Deployment | Vercel |

---

## Backend Architecture

ใช้ Next.js fullstack — ไม่แยก backend server

- **Server Actions** (`"use server"`) — สำหรับ CRUD ทั้งหมด เช่น สร้าง/แก้ไข installment, บันทึกการจ่ายงวด, คำนวณดอกเบี้ย
- **Route Handlers** (`app/api/...`) — สำหรับ webhook, cron job ตรวจ overdue
- **Prisma** — จัดการ query ทั้งหมด type-safe + migration
- **Supabase** — เป็น database + auth เท่านั้น (ใช้ Prisma แทน Supabase client SDK ฝั่ง server)

---

## Database Schema

### profiles (ข้อมูลสมาชิก)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### family_groups (กลุ่มครอบครัว)

```sql
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### family_members (สมาชิกในกลุ่ม)

```sql
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_group_id, profile_id)
);
```

### categories (หมวดหมู่ค่าใช้จ่าย)

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#6366f1',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### transactions (รายรับ-รายจ่าย)

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_type TEXT CHECK (recurring_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  installment_id UUID REFERENCES installments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### installments (การผ่อนชำระ) ⭐ ตารางหลัก

```sql
CREATE TABLE installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  principal_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  interest_type TEXT NOT NULL DEFAULT 'none' CHECK (interest_type IN ('flat', 'reducing', 'none')),
  total_interest DECIMAL(12,2) NOT NULL DEFAULT 0,
  monthly_payment DECIMAL(12,2) NOT NULL,
  total_installments INTEGER NOT NULL,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### installment_payments (ประวัติจ่ายแต่ละงวด)

```sql
CREATE TABLE installment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id UUID NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount_due DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('pending', 'paid', 'overdue', 'upcoming')),
  paid_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### installment_splits (การหารค่าผ่อน)

```sql
CREATE TABLE installment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id UUID NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  split_type TEXT NOT NULL CHECK (split_type IN ('equal', 'percentage', 'fixed')),
  split_value DECIMAL(12,2),
  amount_per_month DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(installment_id, profile_id)
);
```

### debts (หนี้สินอื่นๆ)

```sql
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  creditor_name TEXT NOT NULL,
  debtor_id UUID NOT NULL REFERENCES profiles(id),
  total_amount DECIMAL(12,2) NOT NULL,
  remaining_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  minimum_payment DECIMAL(12,2),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'defaulted')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Row Level Security (RLS)

```sql
-- Helper function: ตรวจสอบว่า user เป็นสมาชิกของ group
CREATE OR REPLACE FUNCTION is_family_member(group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_group_id = group_id
    AND profile_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: ตรวจสอบว่า user เป็น admin ของ group
CREATE OR REPLACE FUNCTION is_family_admin(group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members fm
    JOIN profiles p ON p.id = fm.profile_id
    WHERE fm.family_group_id = group_id
    AND fm.profile_id = auth.uid()
    AND p.role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ตัวอย่าง RLS สำหรับ installments (ใช้แนวเดียวกันกับทุกตาราง)
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group installments"
  ON installments FOR SELECT
  USING (is_family_member(family_group_id));

CREATE POLICY "Members can create installments"
  ON installments FOR INSERT
  WITH CHECK (is_family_member(family_group_id));

CREATE POLICY "Creator or admin can update"
  ON installments FOR UPDATE
  USING (created_by = auth.uid() OR is_family_admin(family_group_id));

CREATE POLICY "Creator or admin can delete"
  ON installments FOR DELETE
  USING (created_by = auth.uid() OR is_family_admin(family_group_id));
```

---

## Pages & Features

### 1. Auth Pages

- `/login` — เข้าสู่ระบบ (Email + Password)
- `/register` — สมัครสมาชิก
- `/forgot-password` — ลืมรหัสผ่าน
- Middleware: ป้องกันหน้าที่ต้อง login

### 2. Dashboard (`/dashboard`)

- สรุปภาพรวมการเงินประจำเดือน
  - รายรับรวม / รายจ่ายรวม / ยอดคงเหลือ
  - ยอดผ่อนชำระที่ต้องจ่ายเดือนนี้
  - หนี้สินคงเหลือทั้งหมด
- กราฟรายรับ-รายจ่ายรายเดือน (Recharts Bar Chart)
- กราฟวงกลมสัดส่วนค่าใช้จ่ายตามหมวดหมู่ (Pie Chart)
- รายการผ่อนที่ใกล้ครบกำหนด (upcoming payments)
- แจ้งเตือนงวดที่เลยกำหนด (overdue alerts)

### 3. รายรับ-รายจ่าย (`/transactions`)

- ตารางรายการ พร้อม filter (เดือน, หมวดหมู่, ประเภท, สมาชิก)
- เพิ่มรายการ → Modal form
- แก้ไข / ลบรายการ
- รองรับ recurring transactions

### 4. การผ่อนชำระ (`/installments`) ⭐ หน้าหลัก

- **รายการผ่อนทั้งหมด** — Card view + progress bar + filter (แพลตฟอร์ม/สถานะ)
- **เพิ่มรายการผ่อนใหม่** (`/installments/new`)
  - Form: ชื่อสินค้า, แพลตฟอร์ม (dropdown + custom), ราคาสินค้า, จำนวนงวด, ดอกเบี้ย
  - Auto-calculate: กรอกราคา + งวด + ดอกเบี้ย → คำนวณยอดต่องวด, ดอกเบี้ยรวม, ยอดรวม
  - ตั้งค่าการหาร: เลือกสมาชิก + วิธีหาร (เท่ากัน / เปอร์เซ็นต์ / กำหนดเอง)
  - Preview ตารางผ่อนทั้งหมดก่อนบันทึก
- **รายละเอียดผ่อน** (`/installments/[id]`)
  - ข้อมูลผ่อน + progress
  - ตารางงวด (งวดที่, วันครบกำหนด, ยอด, สถานะ, ปุ่มจ่าย)
  - ใครหารจ่ายเท่าไหร่
  - ปุ่ม "จ่ายงวดนี้" → บันทึก + อัปเดต paid_installments
  - Timeline / History

### 5. หนี้สิน (`/debts`)

- CRUD + ติดตามยอดคงเหลือ

### 6. รายงาน (`/reports`)

- สรุปรายเดือน / รายปี
- เปรียบเทียบรายจ่ายแต่ละเดือน
- สรุปยอดผ่อน: จ่ายไปแล้ว / เหลือเท่าไหร่
- Export CSV

### 7. ตั้งค่า (`/settings`)

- จัดการโปรไฟล์
- จัดการกลุ่มครอบครัว (เชิญสมาชิก invite code)
- จัดการหมวดหมู่
- จัดการแพลตฟอร์มผ่อน (preset + custom)

---

## Business Logic

### คำนวณดอกเบี้ย

```typescript
// lib/calculations.ts

// Flat Rate: ดอกเบี้ยคิดจากเงินต้นตลอด
export function calculateFlat(principal: number, ratePercent: number, months: number) {
  const totalInterest = principal * (ratePercent / 100) * (months / 12);
  const totalAmount = principal + totalInterest;
  const monthlyPayment = totalAmount / months;
  return { totalInterest, totalAmount, monthlyPayment };
}

// Reducing Balance (PMT): ดอกเบี้ยลดลงตามเงินต้นที่เหลือ
export function calculateReducing(principal: number, annualRatePercent: number, months: number) {
  const monthlyRate = annualRatePercent / 100 / 12;
  const monthlyPayment =
    principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  const totalAmount = monthlyPayment * months;
  const totalInterest = totalAmount - principal;
  return { totalInterest, totalAmount, monthlyPayment };
}

// No Interest
export function calculateNoInterest(principal: number, months: number) {
  return { totalInterest: 0, totalAmount: principal, monthlyPayment: principal / months };
}
```

### คำนวณการหาร

```typescript
export function calculateSplit(
  monthlyPayment: number,
  members: { profileId: string; splitType: 'equal' | 'percentage' | 'fixed'; splitValue?: number }[]
) {
  return members.map((m) => {
    let amountPerMonth: number;
    switch (m.splitType) {
      case 'equal':
        amountPerMonth = monthlyPayment / members.length;
        break;
      case 'percentage':
        amountPerMonth = monthlyPayment * ((m.splitValue ?? 0) / 100);
        break;
      case 'fixed':
        amountPerMonth = m.splitValue ?? 0;
        break;
    }
    return { ...m, amountPerMonth: Math.round(amountPerMonth * 100) / 100 };
  });
}
```

### Auto-generate installment_payments

```typescript
// เมื่อสร้าง installment ใหม่ → สร้าง payment rows ทุกงวด
export function generatePaymentSchedule(
  installmentId: string,
  totalInstallments: number,
  monthlyPayment: number,
  startDate: Date,
  dueDay: number
) {
  const payments = [];
  for (let i = 1; i <= totalInstallments; i++) {
    const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, dueDay);
    payments.push({
      installment_id: installmentId,
      installment_number: i,
      amount_due: monthlyPayment,
      amount_paid: 0,
      due_date: dueDate,
      status: i === 1 ? 'pending' : 'upcoming',
    });
  }
  return payments;
}
```

### Overdue Detection

```typescript
// app/api/cron/check-overdue/route.ts (Vercel Cron)
// ทุกวัน ตรวจ installment_payments ที่ due_date < today AND status = 'pending' → 'overdue'
// + อัปเดต installments.status = 'overdue' ถ้ามีงวดค้าง
```

---

## UI/UX Guidelines

- **ภาษาไทย** ทั้งหมด (labels, placeholder, messages, error messages)
- **สกุลเงินบาท (฿)** — `new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })`
- **Mobile-first** responsive design (ครอบครัวส่วนใหญ่ใช้มือถือ)
- shadcn/ui components: Card, Table, Dialog, Sheet, Badge, Progress, Tabs, Calendar, Skeleton
- Color scheme:
  - รายรับ → `text-green-600 bg-green-50`
  - รายจ่าย → `text-red-600 bg-red-50`
  - ผ่อนชำระ → `text-blue-600 bg-blue-50`
  - Overdue → `text-orange-600 bg-orange-50`
- Loading: Skeleton ทุกหน้า
- Toast: success/error notifications
- Confirmation dialog ก่อนลบข้อมูลทุกครั้ง

---

## Folder Structure

```
family-finance/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (protected)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   ├── installments/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── debts/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx          ← Sidebar + Header + auth guard
│   │   ├── api/
│   │   │   └── cron/
│   │   │       └── check-overdue/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx                ← redirect to /dashboard
│   ├── components/
│   │   ├── ui/                     ← shadcn components
│   │   ├── dashboard/
│   │   │   ├── summary-cards.tsx
│   │   │   ├── monthly-chart.tsx
│   │   │   ├── category-pie.tsx
│   │   │   └── upcoming-payments.tsx
│   │   ├── transactions/
│   │   │   ├── transaction-table.tsx
│   │   │   └── transaction-form.tsx
│   │   ├── installments/
│   │   │   ├── installment-card.tsx
│   │   │   ├── installment-form.tsx
│   │   │   ├── payment-table.tsx
│   │   │   ├── split-config.tsx
│   │   │   └── interest-calculator.tsx
│   │   ├── debts/
│   │   │   ├── debt-card.tsx
│   │   │   └── debt-form.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── mobile-nav.tsx
│   │   └── shared/
│   │       ├── currency-display.tsx
│   │       ├── status-badge.tsx
│   │       ├── date-picker.tsx
│   │       └── confirm-dialog.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           ← browser client
│   │   │   ├── server.ts           ← server client
│   │   │   └── middleware.ts       ← auth middleware
│   │   ├── prisma.ts               ← Prisma client singleton
│   │   ├── utils.ts
│   │   ├── calculations.ts         ← interest + split logic
│   │   └── validations.ts          ← Zod schemas
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── installments.ts
│   │   ├── transactions.ts
│   │   ├── debts.ts
│   │   └── family.ts
│   ├── hooks/
│   │   ├── use-installments.ts
│   │   ├── use-transactions.ts
│   │   ├── use-debts.ts
│   │   └── use-family.ts
│   ├── types/
│   │   └── index.ts
│   └── constants/
│       ├── platforms.ts            ← Shopee, Lazada, KBank, SCB...
│       └── categories.ts           ← default categories
├── prisma/
│   └── schema.prisma
├── .env.local
├── middleware.ts                    ← Next.js auth middleware
└── package.json
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Prisma
DATABASE_URL=your_supabase_postgres_connection_string

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Getting Started

```bash
# 1. สร้างโปรเจค
npx create-next-app@latest family-finance --typescript --tailwind --eslint --app --src-dir

# 2. ติดตั้ง shadcn/ui
cd family-finance
npx shadcn@latest init

# 3. ติดตั้ง dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install prisma @prisma/client
npm install @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install recharts date-fns zustand

# 4. ติดตั้ง shadcn components ที่ใช้
npx shadcn@latest add card table dialog sheet badge progress tabs calendar skeleton toast button input label select separator avatar dropdown-menu

# 5. ตั้งค่า Prisma
npx prisma init
# แก้ schema.prisma ตาม DB schema ด้านบน
# แก้ DATABASE_URL ใน .env

# 6. Push schema ไป Supabase
npx prisma db push

# 7. เริ่ม develop
npm run dev
```

---

## Priority Order

1. ✅ Setup project + Supabase + Auth + Middleware
2. ✅ Prisma schema + DB push + RLS policies
3. ✅ Layout (Sidebar + Header + Mobile Nav)
4. ✅ **Installments** — CRUD + คำนวณดอกเบี้ย + หาร (ฟีเจอร์หลัก)
5. ✅ Dashboard — สรุปภาพรวม + กราฟ
6. ✅ Transactions — รายรับ-รายจ่าย
7. ✅ Debts — หนี้สิน
8. ✅ Reports — รายงาน + export
9. ✅ Settings — โปรไฟล์ + family management
10. ✅ Deploy to Vercel + Vercel Cron for overdue check