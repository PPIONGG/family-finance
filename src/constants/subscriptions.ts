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

/** Popular subscription services with brand identity */
export const POPULAR_SERVICES = [
  // Entertainment
  { name: 'YouTube Premium', category: 'entertainment', domain: 'youtube.com', initials: 'YT', color: '#FF0000', bgColor: '#FEE2E2', amount: 159, billingCycle: 'monthly' as const },
  { name: 'Netflix', category: 'entertainment', domain: 'netflix.com', initials: 'N', color: '#E50914', bgColor: '#FEE2E2', amount: 419, billingCycle: 'monthly' as const },
  { name: 'Disney+ Hotstar', category: 'entertainment', domain: 'hotstar.com', initials: 'D+', color: '#113CCF', bgColor: '#DBEAFE', amount: 799, billingCycle: 'yearly' as const },
  { name: 'HBO GO', category: 'entertainment', domain: 'hbogo.com', initials: 'HBO', color: '#8B5CF6', bgColor: '#EDE9FE', amount: 149, billingCycle: 'monthly' as const },
  { name: 'Viu', category: 'entertainment', domain: 'viu.com', initials: 'V', color: '#D4A843', bgColor: '#FEF3C7', amount: 119, billingCycle: 'monthly' as const },
  { name: 'WeTV', category: 'entertainment', domain: 'wetv.vip', initials: 'We', color: '#FF6B00', bgColor: '#FED7AA', amount: 59, billingCycle: 'monthly' as const },
  // Music
  { name: 'Spotify', category: 'music', domain: 'spotify.com', initials: 'S', color: '#1DB954', bgColor: '#D1FAE5', amount: 149, billingCycle: 'monthly' as const },
  { name: 'Apple Music', category: 'music', domain: 'music.apple.com', initials: '♪', color: '#FC3C44', bgColor: '#FEE2E2', amount: 119, billingCycle: 'monthly' as const },
  { name: 'YouTube Music', category: 'music', domain: 'music.youtube.com', initials: 'YM', color: '#FF0000', bgColor: '#FEE2E2', amount: 129, billingCycle: 'monthly' as const },
  // AI & Tools
  { name: 'ChatGPT Plus', category: 'ai_tools', domain: 'openai.com', initials: 'AI', color: '#10A37F', bgColor: '#D1FAE5', amount: 700, billingCycle: 'monthly' as const },
  { name: 'Claude Pro', category: 'ai_tools', domain: 'claude.ai', initials: 'C', color: '#D97706', bgColor: '#FEF3C7', amount: 700, billingCycle: 'monthly' as const },
  { name: 'Copilot Pro', category: 'ai_tools', domain: 'copilot.microsoft.com', initials: 'CP', color: '#2563EB', bgColor: '#DBEAFE', amount: 700, billingCycle: 'monthly' as const },
  { name: 'Gemini Advanced', category: 'ai_tools', domain: 'gemini.google.com', initials: 'G', color: '#4285F4', bgColor: '#DBEAFE', amount: 700, billingCycle: 'monthly' as const },
  { name: 'Midjourney', category: 'ai_tools', domain: 'midjourney.com', initials: 'MJ', color: '#000000', bgColor: '#F3F4F6', amount: 350, billingCycle: 'monthly' as const },
  { name: 'Notion', category: 'ai_tools', domain: 'notion.so', initials: 'N', color: '#000000', bgColor: '#F3F4F6', amount: 280, billingCycle: 'monthly' as const },
  { name: 'Canva Pro', category: 'ai_tools', domain: 'canva.com', initials: 'Ca', color: '#7B2FF7', bgColor: '#EDE9FE', amount: 3500, billingCycle: 'yearly' as const },
  // Cloud
  { name: 'iCloud+', category: 'cloud', domain: 'icloud.com', initials: 'iC', color: '#007AFF', bgColor: '#DBEAFE', amount: 35, billingCycle: 'monthly' as const },
  { name: 'Google One', category: 'cloud', domain: 'one.google.com', initials: 'GO', color: '#4285F4', bgColor: '#DBEAFE', amount: 100, billingCycle: 'monthly' as const },
  { name: 'Dropbox', category: 'cloud', domain: 'dropbox.com', initials: 'DB', color: '#0061FF', bgColor: '#DBEAFE', amount: 390, billingCycle: 'monthly' as const },
  // Gaming
  { name: 'PlayStation Plus', category: 'gaming', domain: 'playstation.com', initials: 'PS', color: '#003087', bgColor: '#DBEAFE', amount: 1790, billingCycle: 'yearly' as const },
  { name: 'Nintendo Online', category: 'gaming', domain: 'nintendo.com', initials: 'NS', color: '#E60012', bgColor: '#FEE2E2', amount: 700, billingCycle: 'yearly' as const },
  { name: 'Xbox Game Pass', category: 'gaming', domain: 'xbox.com', initials: 'XB', color: '#107C10', bgColor: '#D1FAE5', amount: 449, billingCycle: 'monthly' as const },
] as const

/** Get brand info by subscription name (case-insensitive partial match) */
export function getServiceBrand(name: string) {
  const lower = name.toLowerCase()
  return POPULAR_SERVICES.find((s) => lower.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(lower))
}

export type SubscriptionCategoryValue = typeof SUBSCRIPTION_CATEGORIES[number]['value']
export type BillingCycleValue = typeof BILLING_CYCLES[number]['value']
