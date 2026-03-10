export const SUBSCRIPTION_CATEGORIES = [
  { value: 'entertainment', label: 'บันเทิง', icon: '🎬' },
  { value: 'ai_tools', label: 'AI & เครื่องมือ', icon: '🤖' },
  { value: 'cloud', label: 'Cloud & พื้นที่เก็บ', icon: '☁️' },
  { value: 'gaming', label: 'เกม', icon: '🎮' },
  { value: 'music', label: 'เพลง', icon: '🎵' },
  { value: 'apps', label: 'แอปพลิเคชัน', icon: '📱' },
  { value: 'education', label: 'การศึกษา', icon: '📚' },
  { value: 'news', label: 'ข่าว & สื่อ', icon: '📰' },
  { value: 'other', label: 'อื่นๆ', icon: '📦' },
] as const

export const BILLING_CYCLES = [
  { value: 'monthly', label: 'รายเดือน' },
  { value: 'yearly', label: 'รายปี' },
] as const

export type SubscriptionCategoryValue = typeof SUBSCRIPTION_CATEGORIES[number]['value']
export type BillingCycleValue = typeof BILLING_CYCLES[number]['value']
