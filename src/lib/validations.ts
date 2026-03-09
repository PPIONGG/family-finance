import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
})

export const registerSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirmPassword: z.string(),
  displayName: z.string().min(1, 'กรุณากรอกชื่อที่แสดง'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
})

export const installmentSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อสินค้า'),
  platform: z.string().min(1, 'กรุณาเลือกแพลตฟอร์ม'),
  principalAmount: z.number().positive('ราคาต้องมากกว่า 0'),
  totalInstallments: z.number().int().min(1, 'จำนวนงวดต้องมากกว่า 0'),
  interestRate: z.number().min(0, 'ดอกเบี้ยต้องไม่ติดลบ'),
  interestType: z.enum(['flat', 'reducing', 'reducing_daily', 'none']),
  monthlyPayment: z.preprocess((v) => (v === '' || Number.isNaN(v) ? undefined : v), z.number().positive().optional()),
  shopeeTotalPayment: z.preprocess((v) => (v === '' || Number.isNaN(v) ? undefined : v), z.number().positive().optional()),
  shopeeTotalInterest: z.preprocess((v) => (v === '' || Number.isNaN(v) ? undefined : v), z.number().min(0).optional()),
  shopeeFirstPayDate: z.string().optional(),
  startDate: z.string().min(1, 'กรุณาเลือกวันที่เริ่มผ่อน'),
  dueDay: z.number().int().min(1).max(31, 'วันครบกำหนดต้องอยู่ระหว่าง 1-31'),
  notes: z.string().optional(),
})

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  description: z.string().min(1, 'กรุณากรอกรายละเอียด'),
  categoryId: z.string().uuid('กรุณาเลือกหมวดหมู่'),
  date: z.string().min(1, 'กรุณาเลือกวันที่'),
  isRecurring: z.boolean().optional(),
  recurringType: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
})

export const debtSchema = z.object({
  creditorName: z.string().min(1, 'กรุณากรอกชื่อเจ้าหนี้'),
  debtorId: z.string().uuid('กรุณาเลือกผู้รับผิดชอบ'),
  totalAmount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  interestRate: z.number().min(0).optional(),
  minimumPayment: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

export const familyGroupSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อกลุ่ม'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type InstallmentInput = z.infer<typeof installmentSchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type DebtInput = z.infer<typeof debtSchema>
export type FamilyGroupInput = z.infer<typeof familyGroupSchema>
