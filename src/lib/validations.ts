import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
})

export const registerSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
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
  monthlyPayment: z.number().positive().optional(),
  shopeeTotalPayment: z.number().positive().optional(),
  shopeeTotalInterest: z.number().min(0).optional(),
  shopeeFirstPayDate: z.string().optional(),
  startDate: z.string().min(1, 'กรุณาเลือกวันที่เริ่มผ่อน'),
  dueDay: z.number().int().min(1).max(31, 'วันครบกำหนดต้องอยู่ระหว่าง 1-31'),
  notes: z.string().optional(),
  groupId: z.string().uuid().nullable().optional(),
})

export const debtSchema = z.object({
  creditorName: z.string().min(1, 'กรุณากรอกชื่อเจ้าหนี้'),
  totalAmount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  interestRate: z.number().min(0).optional(),
  minimumPayment: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  groupId: z.string().uuid().nullable().optional(),
})

export const groupSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อกลุ่ม'),
})

export const subscriptionSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อบริการ'),
  category: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  billingCycle: z.enum(['monthly', 'yearly']),
  billingDay: z.number().int().min(1).max(31, 'วันตัดจ่ายต้องอยู่ระหว่าง 1-31'),
  startDate: z.string().min(1, 'กรุณาเลือกวันที่เริ่ม'),
  autoRenew: z.boolean().optional(),
  notes: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type InstallmentInput = z.infer<typeof installmentSchema>
export type DebtInput = z.infer<typeof debtSchema>
export type GroupInput = z.infer<typeof groupSchema>
export type SubscriptionInput = z.infer<typeof subscriptionSchema>
