import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusConfig = {
  active: { label: 'กำลังผ่อน', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'ผ่อนครบ', className: 'bg-green-50 text-green-700 border-green-200' },
  overdue: { label: 'เลยกำหนด', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  cancelled: { label: 'ยกเลิก', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  pending: { label: 'รอจ่าย', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  paid: { label: 'จ่ายแล้ว', className: 'bg-green-50 text-green-700 border-green-200' },
  upcoming: { label: 'ยังไม่ถึง', className: 'bg-gray-50 text-gray-500 border-gray-200' },
  paid_off: { label: 'ชำระครบ', className: 'bg-green-50 text-green-700 border-green-200' },
  defaulted: { label: 'ผิดนัด', className: 'bg-red-50 text-red-700 border-red-200' },
} as const

interface StatusBadgeProps {
  status: keyof typeof statusConfig
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  if (!config) return <Badge variant="outline">{status}</Badge>

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
