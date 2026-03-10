'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { updateInstallmentSplits } from '@/actions/installments'
import { toast } from 'sonner'
import { Settings2 } from 'lucide-react'
import type { SplitType } from '@/types'

interface Member {
  profileId: string
  displayName: string
}

interface ExistingSplit {
  profileId: string
  splitType: string
  splitValue: number | null
  amountPerMonth: number | unknown
  profile: { displayName: string }
}

interface ManageSplitsDialogProps {
  installmentId: string
  monthlyPayment: number
  members: Member[]
  existingSplits: ExistingSplit[]
}

interface SplitEntry {
  profileId: string
  splitType: SplitType
  splitValue?: number
  enabled: boolean
}

export function ManageSplitsDialog({
  installmentId,
  monthlyPayment,
  members,
  existingSplits,
}: ManageSplitsDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // สร้าง initial splits จาก existing หรือ default เป็น equal
  const [splits, setSplits] = useState<SplitEntry[]>(() =>
    members.map((m) => {
      const existing = existingSplits.find((s) => s.profileId === m.profileId)
      if (existing) {
        return {
          profileId: m.profileId,
          splitType: existing.splitType as SplitType,
          splitValue: existing.splitValue ?? undefined,
          enabled: true,
        }
      }
      return {
        profileId: m.profileId,
        splitType: 'equal' as SplitType,
        enabled: false,
      }
    })
  )

  const enabledSplits = splits.filter((s) => s.enabled)

  const getAmount = (split: SplitEntry) => {
    if (!split.enabled) return 0
    switch (split.splitType) {
      case 'equal':
        return enabledSplits.length > 0 ? monthlyPayment / enabledSplits.length : 0
      case 'percentage':
        return monthlyPayment * ((split.splitValue ?? 0) / 100)
      case 'fixed':
        return split.splitValue ?? 0
    }
  }

  const totalAssigned = enabledSplits.reduce((sum, s) => sum + getAmount(s), 0)
  const allEqual = enabledSplits.every((s) => s.splitType === 'equal')

  const toggleMember = (profileId: string) => {
    setSplits((prev) =>
      prev.map((s) =>
        s.profileId === profileId ? { ...s, enabled: !s.enabled } : s
      )
    )
  }

  const updateSplit = (profileId: string, field: 'splitType' | 'splitValue', value: string | number) => {
    setSplits((prev) =>
      prev.map((s) => {
        if (s.profileId !== profileId) return s
        if (field === 'splitType') return { ...s, splitType: value as SplitType, splitValue: undefined }
        return { ...s, splitValue: value as number }
      })
    )
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const data = enabledSplits.map((s) => ({
        profileId: s.profileId,
        splitType: s.splitType,
        splitValue: s.splitValue,
      }))
      await updateInstallmentSplits(installmentId, data)
      toast.success('บันทึกการหารค่าผ่อนสำเร็จ')
      setOpen(false)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Settings2 className="h-4 w-4 mr-2" />
        จัดการการหาร
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>จัดการการหารค่าผ่อน</DialogTitle>
          <p className="text-sm text-muted-foreground">
            งวดละ {formatCurrency(monthlyPayment)} — เลือกสมาชิกและกำหนดสัดส่วน
          </p>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {splits.map((split) => {
            const member = members.find((m) => m.profileId === split.profileId)
            const amount = getAmount(split)

            return (
              <div
                key={split.profileId}
                className={`p-3 rounded-lg border transition-colors ${
                  split.enabled ? 'bg-card' : 'bg-muted/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={split.enabled}
                    onChange={() => toggleMember(split.profileId)}
                    className="h-4 w-4 rounded"
                  />
                  <span className="font-medium text-sm flex-1">
                    {member?.displayName}
                  </span>
                  {split.enabled && (
                    <span className="text-sm font-bold text-blue-600">
                      {formatCurrency(Math.round(amount * 100) / 100)}
                    </span>
                  )}
                </div>

                {split.enabled && (
                  <div className="flex items-end gap-3 ml-7">
                    <div className="w-[140px]">
                      <Label className="text-xs text-muted-foreground">วิธีหาร</Label>
                      <Select
                        value={split.splitType}
                        onValueChange={(v) => v && updateSplit(split.profileId, 'splitType', v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue>
                            {split.splitType === 'equal' ? 'เท่ากัน' : split.splitType === 'percentage' ? 'เปอร์เซ็นต์' : 'กำหนดเอง'}
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
                      <div className="w-[100px]">
                        <Label className="text-xs text-muted-foreground">
                          {split.splitType === 'percentage' ? '%' : 'บาท'}
                        </Label>
                        <Input
                          type="number"
                          step={split.splitType === 'percentage' ? '1' : '0.01'}
                          className="h-8 text-xs"
                          value={split.splitValue ?? ''}
                          onChange={(e) =>
                            updateSplit(split.profileId, 'splitValue', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="border-t pt-3 mt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ยอดงวดละ</span>
            <span>{formatCurrency(monthlyPayment)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">หารแล้วรวม</span>
            <span className={Math.abs(totalAssigned - monthlyPayment) > 1 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
              {formatCurrency(Math.round(totalAssigned * 100) / 100)}
            </span>
          </div>
          {!allEqual && Math.abs(totalAssigned - monthlyPayment) > 1 && (
            <p className="text-xs text-red-500">
              ยอดรวมไม่ตรงกับค่างวด (ต่างกัน {formatCurrency(Math.abs(totalAssigned - monthlyPayment))})
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            ยกเลิก
          </Button>
          <Button onClick={handleSave} disabled={loading || enabledSplits.length === 0} className="flex-1">
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
