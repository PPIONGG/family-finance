# Family Finance - สรุปโปรเจค

> อัปเดตล่าสุด: 2026-03-10

## ภาพรวม

ระบบจัดการค่าใช้จ่ายครอบครัว (Family Expense Management) สร้างด้วย Next.js 16 + TypeScript รองรับการผ่อนชำระ, สมัครสมาชิก (Subscriptions), หนี้สิน สำหรับใช้งานร่วมกันในครอบครัว

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, Shadcn UI (Base UI variant) |
| Forms | React Hook Form 7 + Zod 4 |
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
│   │   ├── (protected)/        # Installments, Subscriptions, Debts, Settings
│   │   └── api/cron/           # Cron job สำหรับเช็ค overdue
│   ├── actions/                # Server actions
│   ├── components/             # React components
│   │   ├── installments/       # Form, list, card, payment table, edit, splits, platform row, bulk pay
│   │   ├── subscriptions/      # Form, card
│   │   ├── debts/              # Form, card
│   │   ├── settings/           # Leave group button
│   │   ├── layout/             # Sidebar, header, mobile nav
│   │   ├── shared/             # Confirm dialog, status badge, setup prompt
│   │   └── ui/                 # Shadcn UI components
│   ├── lib/                    # Utilities (Prisma, Supabase clients, validations, utils)
│   ├── types/                  # TypeScript type definitions
│   ├── constants/              # App constants (categories, platforms, subscriptions)
│   └── generated/              # Generated Prisma client
├── prisma/                     # Prisma schema
├── supabase/                   # Supabase config
├── middleware.ts               # Auth middleware
└── prisma.config.ts            # Prisma config
```

---

## Database Schema (10 Models)

### Profile
- ข้อมูลผู้ใช้: displayName, avatarUrl, role (admin/member)
- สร้างอัตโนมัติตอน signup ผ่าน Supabase trigger
- มี subscriptions (ส่วนตัว)

### FamilyGroup
- กลุ่มครอบครัว: name, inviteCode (unique)
- เป็น owner ของ installments, debts ทั้งหมด

### FamilyMember
- ตารางเชื่อม Profile ↔ FamilyGroup
- มี nickname, joinedAt
- Unique constraint: (familyGroupId, profileId)

### Category
- หมวดหมู่: name, icon, color
- มี 13 default categories

### Transaction (historical — ไม่ใช้งานใน UI แล้ว)
- รายการรายรับ/รายจ่าย: type (income/expense), amount, description, date
- เก็บไว้สำหรับข้อมูลเก่า

### Installment (ครอบครัว)
- แผนผ่อนชำระ: platform, totalAmount, principalAmount, interestRate
- คำนวณ: monthlyPayment, totalInterest, totalInstallments, paidInstallments
- Status: active/completed/overdue/cancelled
- Platforms: Shopee ผ่อนสินค้า, Shopee กู้เงินสด, UOB, KTC, KBank, SCB, BBL, กรุงศรี, TTB, Lazada, อื่นๆ

### InstallmentPayment
- บันทึกการจ่ายแต่ละงวด: installmentNumber, amountDue, amountPaid
- Status: pending/paid/overdue/upcoming
- Auto-sync สถานะทุกครั้งที่โหลดข้อมูล

### InstallmentSplit
- แบ่งค่าผ่อนระหว่างสมาชิก: splitType (equal/percentage/fixed)
- Unique constraint: (installmentId, profileId)

### Subscription (ส่วนตัว)
- สมัครสมาชิก: name, category, amount, billingCycle (monthly/yearly)
- Categories: entertainment, ai_tools, cloud, gaming, music, apps, education, news, other
- Status: active/paused/cancelled
- ผูกกับ Profile ไม่ใช่ FamilyGroup

### Debt (ครอบครัว)
- หนี้สิน: creditorName, totalAmount, remainingAmount
- มี interestRate, minimumPayment, dueDate
- Status: active/paid_off/defaulted

---

## หน้าหลัก & Features

### Authentication (`/login`, `/register`)
- Supabase Email/Password Auth
- Middleware ป้องกัน route ที่ต้อง login
- Auto-redirect ไปหน้า `/installments` หลัง login

### การผ่อนชำระ (`/installments`) — ครอบครัว
- **สรุปรวม**: ค้างชำระ (สีแดง), ยังต้องจ่ายเดือนนี้, จ่ายแล้วเดือนนี้, คงเหลือทั้งหมด
- **แถบเตือนค้างชำระ**: แสดงเมื่อมียอดค้าง พร้อมจำนวนรายการ
- **สรุปแยกแพลตฟอร์ม**: แสดงยอดต่อ platform พร้อมปุ่มจ่ายรวม + ยอด overdue
- **รายการ**: จัดกลุ่มตาม platform, ย่อ/ขยายได้ (collapsible)
- **สร้างผ่อนใหม่** (`/installments/new`):
  - คำนวณดอกเบี้ย 4 แบบ: Flat, Reducing Monthly, Reducing Daily (Shopee), None
  - ตั้งค่าการแบ่งจ่าย: เท่ากัน, ตามเปอร์เซ็นต์, จำนวนคงที่
- **รายละเอียดผ่อน** (`/installments/[id]`):
  - ตารางงวดชำระ + สถานะแต่ละงวด
  - จ่ายค่างวด (ทีละงวด / หลายงวดพร้อมกัน)
  - แก้ไขข้อมูล (ชื่อ, platform, วันครบกำหนด, หมายเหตุ)
  - จัดการแบ่งจ่าย, ลบรายการ

### สมัครสมาชิก (`/subscriptions`) — ส่วนตัว
- จัดการ subscriptions: YouTube, Netflix, AI tools, etc.
- สรุปยอดรายเดือน/รายปี
- จัดกลุ่มตาม category
- เปลี่ยนสถานะ active/paused/cancelled

### หนี้สิน (`/debts`) — ครอบครัว
- บันทึกหนี้: ชื่อเจ้าหนี้, จำนวน, ดอกเบี้ย, จ่ายขั้นต่ำ
- ปุ่มจ่ายหนี้, ติดตามยอดคงเหลือ

### ตั้งค่า (`/settings`)
- ตั้งค่าโปรไฟล์
- จัดการกลุ่มครอบครัว (สร้าง/เข้าร่วมด้วย invite code)
- ออกจากกลุ่ม (ลบ splits ที่เกี่ยวข้อง)

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/cron/check-overdue` | GET | Vercel Cron: อัปเดต payment status เป็น overdue + เลื่อนงวดถัดไปเป็น pending |

---

## Server Actions (src/actions/)

ใช้ Next.js Server Actions แทน API routes สำหรับ data operations:
- **auth**: login, register, logout, getCurrentUser, getUserFamilyGroup
- **family**: createFamilyGroup, joinFamilyGroup, getMembers, removeFamilyMember, leaveFamilyGroup
- **installments**: create, list, getById, pay, payMultiple, updateSplits, update, delete, syncPaymentStatuses
- **subscriptions**: create, list, updateStatus, delete, getSummary
- **debts**: create, list, payDebt, deleteDebt

ทุก action ที่ mutate data มี auth check + ownership verification

---

## Authentication Flow

1. User signup → Supabase Auth สร้าง user
2. Supabase trigger สร้าง Profile อัตโนมัติ
3. Login → Cookie-based session
4. Middleware ตรวจ session → redirect ถ้าไม่ login
5. Server actions ใช้ `getCurrentUser()` ดึงข้อมูล user

---

## Payment Status Sync

ระบบ auto-sync สถานะ payment ทุกครั้งที่โหลดข้อมูล:
1. `upcoming`/`pending` ที่เลย dueDate → `overdue`
2. งวดถัดไปที่ยังไม่ถึงกำหนด → `pending`
3. อัปเดต installment status (active/overdue/completed) + paidInstallments count
4. Cron job ทำเป็น fallback สำหรับกรณีที่ไม่มีคนเปิดดู

---

## Shopee SEasyCash Integration

ฟีเจอร์พิเศษสำหรับ Shopee (ทั้งผ่อนสินค้า + กู้เงินสด):
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
- UI เป็นภาษาไทย, error messages เป็นภาษาไทย
- Responsive design (mobile + desktop)
- Features ที่ถูกลบ: Dashboard/ภาพรวม, รายรับ-รายจ่าย (Transaction), รายงาน (Reports)
