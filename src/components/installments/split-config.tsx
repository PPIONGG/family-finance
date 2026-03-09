'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import type { SplitType } from '@/types'

const SPLIT_TYPE_LABELS: Record<SplitType, string> = {
  equal: 'เท่ากัน',
  percentage: 'เปอร์เซ็นต์',
  fixed: 'กำหนดเอง',
}

interface SplitConfigProps {
  members: { profileId: string; displayName: string; nickname: string }[]
  monthlyPayment: number
  splits: { profileId: string; splitType: SplitType; splitValue?: number }[]
  onSplitsChange: (
    splits: { profileId: string; splitType: SplitType; splitValue?: number }[]
  ) => void
}

export function SplitConfig({
  members,
  monthlyPayment,
  splits,
  onSplitsChange,
}: SplitConfigProps) {
  const updateSplit = (
    index: number,
    field: 'splitType' | 'splitValue',
    value: string | number
  ) => {
    const newSplits = [...splits]
    if (field === 'splitType') {
      const newType = value as SplitType
      newSplits[index] = { ...newSplits[index], splitType: newType }

      // Auto sync: ถ้าเปลี่ยนเป็น percentage ให้คนอื่นเปลี่ยนด้วย + แบ่งให้ครบ 100%
      if (newType === 'percentage') {
        const equalPct = Math.round(100 / members.length)
        newSplits.forEach((s, i) => {
          if (i === index) {
            newSplits[i] = { ...s, splitType: 'percentage', splitValue: equalPct }
          } else if (s.splitType === 'equal') {
            newSplits[i] = { ...s, splitType: 'percentage', splitValue: equalPct }
          }
        })
        // ปรับให้ครบ 100%
        const totalPct = newSplits.reduce((sum, s) => sum + (s.splitType === 'percentage' ? (s.splitValue ?? 0) : 0), 0)
        if (totalPct !== 100) {
          const lastPctIdx = newSplits.findLastIndex(s => s.splitType === 'percentage')
          if (lastPctIdx >= 0) {
            newSplits[lastPctIdx] = {
              ...newSplits[lastPctIdx],
              splitValue: (newSplits[lastPctIdx].splitValue ?? 0) + (100 - totalPct),
            }
          }
        }
      }

      // Auto sync: ถ้าเปลี่ยนเป็น equal ให้คนอื่นที่เป็น percentage เปลี่ยนเป็น equal ด้วย
      if (newType === 'equal') {
        newSplits.forEach((s, i) => {
          if (s.splitType === 'percentage') {
            newSplits[i] = { ...s, splitType: 'equal', splitValue: undefined }
          }
        })
      }
    } else {
      newSplits[index] = { ...newSplits[index], splitValue: value as number }

      // Auto: ถ้าเป็น percentage ปรับคนอื่นให้ครบ 100%
      if (newSplits[index].splitType === 'percentage') {
        // หาคนที่จะ auto-adjust (คนสุดท้ายที่เป็น percentage ที่ไม่ใช่คนที่กำลังแก้)
        const autoIdx = newSplits.findLastIndex((s, i) => i !== index && s.splitType === 'percentage')
        if (autoIdx >= 0) {
          // รวม % ของคนอื่นทั้งหมด ยกเว้นคนที่แก้ และคนที่จะ auto-adjust
          const fixedTotal = newSplits.reduce((sum, s, i) => {
            if (i === index || i === autoIdx || s.splitType !== 'percentage') return sum
            return sum + (s.splitValue ?? 0)
          }, 0)
          const remaining = 100 - (value as number) - fixedTotal
          if (remaining >= 0) {
            newSplits[autoIdx] = { ...newSplits[autoIdx], splitValue: remaining }
          }
        }
      }
    }
    onSplitsChange(newSplits)
  }

  const getAmount = (split: { splitType: SplitType; splitValue?: number }) => {
    switch (split.splitType) {
      case 'equal':
        return monthlyPayment / members.length
      case 'percentage':
        return monthlyPayment * ((split.splitValue ?? 0) / 100)
      case 'fixed':
        return split.splitValue ?? 0
    }
  }

  return (
    <div className="space-y-4">
        {splits.map((split, index) => {
          const member = members.find((m) => m.profileId === split.profileId)
          const amount = getAmount(split)

          return (
            <div
              key={split.profileId}
              className="flex flex-wrap items-end gap-3 p-3 rounded-lg border"
            >
              <div className="flex-1 min-w-[120px]">
                <Label className="text-xs text-muted-foreground">สมาชิก</Label>
                <p className="font-medium text-sm">{member?.nickname || member?.displayName}</p>
              </div>

              <div className="w-[140px]">
                <Label className="text-xs text-muted-foreground">วิธีหาร</Label>
                <Select
                  value={split.splitType}
                  onValueChange={(v) => v && updateSplit(index, 'splitType', v as string)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue>
                      {SPLIT_TYPE_LABELS[split.splitType]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">เท่ากัน</SelectItem>
                    <SelectItem value="percentage">เปอร์เซ็นต์</SelectItem>
                    <SelectItem value="fixed">กำหนดเอง</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {split.splitType !== 'equal' && (
                <div className="w-[120px]">
                  <Label className="text-xs text-muted-foreground">
                    {split.splitType === 'percentage' ? '%' : 'บาท'}
                  </Label>
                  <Input
                    type="number"
                    step={split.splitType === 'percentage' ? '1' : '0.01'}
                    className="h-9"
                    value={split.splitValue ?? ''}
                    onChange={(e) =>
                      updateSplit(index, 'splitValue', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              )}

              <div className="min-w-[100px] text-right">
                <Label className="text-xs text-muted-foreground">จ่ายต่อเดือน</Label>
                <p className="font-bold text-blue-600 text-sm">
                  {formatCurrency(Math.round(amount * 100) / 100)}
                </p>
              </div>
            </div>
          )
        })}
    </div>
  )
}
