import { getInstallments } from '@/actions/installments'
import { PLATFORMS } from '@/constants/platforms'
import { formatCurrency } from '@/lib/utils'

export async function SidebarSummary() {
  const installments = await getInstallments()
  if (installments.length === 0) return null

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const activeInstallments = installments.filter((i: any) => i.status === 'active')

  // คำนวณยอดเดือนนี้แยกแพลตฟอร์ม — รวมทั้งกลุ่ม
  const platformDue: Record<string, { label: string; icon: string; amount: number }> = {}
  let totalDue = 0

  activeInstallments.forEach((inst: any) => {
    const thisMonthPayment = inst.payments?.find((p: any) => {
      const due = new Date(p.dueDate)
      return due.getMonth() === currentMonth && due.getFullYear() === currentYear
    })

    if (!thisMonthPayment || thisMonthPayment.status === 'paid') return

    const amount = Number(thisMonthPayment.amountDue)
    totalDue += amount

    const pKey = inst.platform
    if (!platformDue[pKey]) {
      const p = PLATFORMS.find((p) => p.value === pKey)
      platformDue[pKey] = {
        label: p?.label ?? pKey,
        icon: p?.icon ?? '📋',
        amount: 0,
      }
    }
    platformDue[pKey].amount += amount
  })

  if (totalDue === 0) return null

  const entries = Object.entries(platformDue).sort((a, b) => b[1].amount - a[1].amount)

  return (
    <div className="px-4 py-3 mx-2 rounded-lg bg-orange-50 border border-orange-200">
      <p className="text-xs font-medium text-orange-700 mb-2">ยอดต้องจ่ายเดือนนี้ (ทั้งกลุ่ม)</p>
      <div className="space-y-1.5">
        {entries.map(([key, data]) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span>{data.icon} {data.label}</span>
            <span className="font-semibold text-orange-700">{formatCurrency(data.amount)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-orange-200 mt-2 pt-2 flex justify-between text-xs font-bold text-orange-800">
        <span>รวม</span>
        <span>{formatCurrency(totalDue)}</span>
      </div>
    </div>
  )
}
