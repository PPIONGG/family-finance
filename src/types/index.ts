export type UserRole = 'admin' | 'member'
export type TransactionType = 'income' | 'expense'
export type InterestType = 'flat' | 'reducing' | 'reducing_daily' | 'none'
export type InstallmentStatus = 'active' | 'completed' | 'overdue' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'upcoming'
export type DebtStatus = 'active' | 'paid_off' | 'defaulted'
export type SplitType = 'equal' | 'percentage' | 'fixed'
export type RecurringType = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'
export type BillingCycle = 'monthly' | 'yearly'

export interface DashboardSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  totalInstallmentDue: number
  totalDebtRemaining: number
  upcomingPayments: UpcomingPayment[]
  overduePayments: OverduePayment[]
}

export interface UpcomingPayment {
  id: string
  installmentName: string
  platform: string
  amountDue: number
  dueDate: Date
  installmentNumber: number
}

export interface OverduePayment {
  id: string
  installmentName: string
  platform: string
  amountDue: number
  dueDate: Date
  daysOverdue: number
}

export interface SplitMember {
  profileId: string
  displayName: string
  splitType: SplitType
  splitValue?: number
  amountPerMonth: number
}
