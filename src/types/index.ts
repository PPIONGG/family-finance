export type UserRole = 'admin' | 'member'
export type InterestType = 'flat' | 'reducing' | 'reducing_daily' | 'none'
export type InstallmentStatus = 'active' | 'completed' | 'overdue' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'upcoming'
export type DebtStatus = 'active' | 'paid_off' | 'defaulted'
export type SplitType = 'equal' | 'percentage' | 'fixed'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'
export type BillingCycle = 'monthly' | 'yearly'

export interface Group {
  id: string
  name: string
  inviteCode: string | null
}

export interface SplitMember {
  profileId: string
  displayName: string
  splitType: SplitType
  splitValue?: number
  amountPerMonth: number
}
