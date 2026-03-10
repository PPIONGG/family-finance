# Family Finance - สรุปโปรเจค

> อัปเดตล่าสุด: 2026-03-10

## ภาพรวม

ระบบจัดการค่าใช้จ่ายครอบครัว (Family Expense Management) สร้างด้วย Next.js 16 + TypeScript รองรับการติดตามรายรับ-รายจ่าย, ผ่อนชำระ, หนี้สิน และรายงานสรุป สำหรับใช้งานร่วมกันในครอบครัว

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, Shadcn UI |
| Charts | Recharts 3.8 |
| Forms | React Hook Form 7 + Zod 4 |
| State | Zustand 5 (มีแต่ยังไม่ได้ใช้งานจริง) |
| Auth | Supabase Auth (Email/Password) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7.4 |
| Hosting | Vercel |

---

## โครงสร้างโปรเจค

```
family-finance/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Login, Register, Forgot Password
│   │   ├── (protected)/        # Dashboard, Transactions, Installments, Debts, Reports, Settings
│   │   └── api/cron/           # Cron job สำหรับเช็ค overdue
│   ├── actions/                # Server actions
│   ├── components/             # React components
│   │   ├── dashboard/          # Summary cards, charts, upcoming payments
│   │   ├── installments/       # Form, list, card, payment table, split config
│   │   ├── transactions/       # Form, table
│   │   ├── debts/              # Form, card
│   │   ├── layout/             # Sidebar, header, mobile nav
│   │   ├── shared/             # Confirm dialog, currency display, status badge
│   │   └── ui/                 # Shadcn UI components
│   ├── lib/                    # Utilities (Prisma, Supabase clients, validations, utils)
│   ├── types/                  # TypeScript type definitions
│   ├── constants/              # App constants (categories, platforms)
│   └── generated/              # Generated Prisma client
├── prisma/                     # Prisma schema
├── supabase/                   # Supabase config
├── middleware.ts               # Auth middleware
└── prisma.config.ts            # Prisma config
```

---

## Database Schema (9 Models)

### Profile
- ข้อมูลผู้ใช้: displayName, avatarUrl, role (admin/member)
- สร้างอัตโนมัติตอน signup ผ่าน Supabase trigger

### FamilyGroup
- กลุ่มครอบครัว: name, inviteCode (unique)
- เป็น owner ของ transactions, installments, debts ทั้งหมด

### FamilyMember
- ตารางเชื่อม Profile ↔ FamilyGroup
- มี nickname, joinedAt
- Unique constraint: (familyGroupId, profileId)

### Category
- หมวดหมู่รายรับ-รายจ่าย: name, icon, color
- มี 13 default categories (อาหาร, ขนส่ง, ที่พัก, ฯลฯ)

### Transaction
- รายการรายรับ/รายจ่าย: type (income/expense), amount, description, date
- รองรับ recurring (daily/weekly/monthly/yearly)
- เชื่อมกับ installment ได้ (optional)

### Installment
- แผนผ่อนชำระ: platform, totalAmount, principalAmount, interestRate
- คำนวณ: monthlyPayment, totalInterest, totalInstallments, paidInstallments
- Status: active/completed/overdue/cancelled

### InstallmentPayment
- บันทึกการจ่ายแต่ละงวด: installmentNumber, amountDue, amountPaid
- Status: pending/paid/overdue/upcoming

### InstallmentSplit
- แบ่งค่าผ่อนระหว่างสมาชิก: splitType (equal/percentage/fixed)
- Unique constraint: (installmentId, profileId)

### Debt
- หนี้สินส่วนตัว: creditorName, totalAmount, remainingAmount
- มี interestRate, minimumPayment, dueDate
- Status: active/paid_off/defaulted

---

## หน้าหลัก & Features

### Authentication (`/login`, `/register`)
- Supabase Email/Password Auth
- Middleware ป้องกัน route ที่ต้อง login
- Auto-redirect ตาม auth state

### Dashboard (`/dashboard`)
- **Summary Cards**: รายรับ, รายจ่าย, ยอดคงเหลือ, ค่าผ่อนที่ต้องจ่าย, หนี้คงเหลือ
- **Monthly Chart**: กราฟเส้น 6 เดือนย้อนหลัง (รายรับ vs รายจ่าย)
- **Category Pie Chart**: วงกลมแสดงสัดส่วนรายจ่ายตามหมวดหมู่
- **Upcoming Payments**: รายการผ่อนที่ใกล้ถึงกำหนด
- **Overdue Alerts**: แจ้งเตือนค่าผ่อนที่เลยกำหนด
- **Setup Prompt**: แจ้งให้สร้าง/เข้าร่วมกลุ่มครอบครัว

### Transactions (`/transactions`)
- เพิ่ม/ดูรายรับ-รายจ่าย
- กรองตาม type, category, วันที่
- 13 หมวดหมู่ default พร้อม icon + สี

### Installments (`/installments`)
- **รายการผ่อน**: แสดง card พร้อม progress bar
- **สร้างผ่อนใหม่** (`/installments/new`):
  - รองรับหลาย platform: Shopee SEasyCash, UOB, KTC, KBank, SCB, BBL, KrungSri, TTB, Lazada
  - คำนวณดอกเบี้ย 4 แบบ: Flat, Reducing Monthly, Reducing Daily (Shopee), None
  - ตั้งค่าการแบ่งจ่าย: เท่ากัน, ตามเปอร์เซ็นต์, จำนวนคงที่
- **รายละเอียดผ่อน** (`/installments/[id]`):
  - ตารางงวดชำระ + สถานะแต่ละงวด
  - จ่ายค่างวด + แก้ไขการแบ่ง

### Debts (`/debts`)
- บันทึกหนี้: ชื่อเจ้าหนี้, จำนวน, ดอกเบี้ย, จ่ายขั้นต่ำ
- ปุ่มจ่ายหนี้, ติดตามยอดคงเหลือ

### Reports (`/reports`)
- สรุปผ่อนชำระรายเดือนแยกตาม platform
- สรุปรายสมาชิก (ภาระแต่ละคน)
- ประวัติรายรับ-รายจ่าย 6 เดือน
- สถิติผ่อนชำระรวม (ทั้งหมด, active, จ่ายแล้ว, คงเหลือ)

### Settings (`/settings`)
- ตั้งค่าโปรไฟล์
- จัดการกลุ่มครอบครัว (สร้าง/เข้าร่วมด้วย invite code)

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/cron/check-overdue` | GET | Vercel Cron: อัปเดต payment status เป็น overdue ถ้าเลยกำหนด |

---

## Server Actions (src/actions/)

ใช้ Next.js Server Actions แทน API routes สำหรับ data operations:
- **auth**: login, register, logout, getCurrentUser
- **family**: createFamilyGroup, joinFamilyGroup, getMembers
- **transactions**: create, list, delete
- **installments**: create, list, getById, delete, recordPayment
- **debts**: create, list, payDebt
- **dashboard**: getSummary, getChartData
- **reports**: getReportData

---

## Authentication Flow

1. User signup → Supabase Auth สร้าง user
2. Supabase trigger สร้าง Profile อัตโนมัติ
3. Login → Cookie-based session
4. Middleware ตรวจ session → redirect ถ้าไม่ login
5. Server actions ใช้ `getCurrentUser()` ดึงข้อมูล user

---

## Shopee SEasyCash Integration

ฟีเจอร์พิเศษสำหรับ Shopee:
- กรอกยอดจ่ายรายเดือนเอง (ไม่คำนวณอัตโนมัติ)
- กรอกยอดรวมและดอกเบี้ยรวม manual
- เลือกวันเริ่มจ่ายงวดแรก
- คำนวณดอกเบี้ยแบบ reducing daily

---

## Deployment

- **Host**: Vercel
- **Database**: Supabase (PostgreSQL, ap-southeast-2)
- **Build**: `prisma generate && next build`
- **Cron**: Vercel Cron สำหรับเช็ค overdue payments

---

## สถานะโปรเจค

- อยู่ระหว่างพัฒนา (active development)
- Commit ล่าสุดเน้น: แก้ไข installment features + ปรับปรุงหน้า reports
- UI เป็นภาษาไทย, error messages เป็นภาษาไทย
- Responsive design (mobile + desktop)
