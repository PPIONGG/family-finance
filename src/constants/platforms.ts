export const PLATFORMS = [
  { value: 'shopee', label: 'Shopee', icon: '🛒' },
  { value: 'uob', label: 'UOB', icon: '🏦' },
  { value: 'ktc', label: 'KTC', icon: '💳' },
  { value: 'kbank', label: 'KBank', icon: '🏦' },
  { value: 'scb', label: 'SCB', icon: '🏦' },
  { value: 'bbl', label: 'กรุงเทพ (BBL)', icon: '🏦' },
  { value: 'krungsri', label: 'กรุงศรี', icon: '🏦' },
  { value: 'ttb', label: 'TTB', icon: '🏦' },
  { value: 'lazada', label: 'Lazada PayLater', icon: '🛍️' },
  { value: 'other', label: 'อื่นๆ', icon: '📋' },
] as const

export type PlatformValue = typeof PLATFORMS[number]['value']
