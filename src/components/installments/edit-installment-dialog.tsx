'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateInstallment } from '@/actions/installments'
import { PLATFORMS } from '@/constants/platforms'
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
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface EditInstallmentDialogProps {
  installment: {
    id: string
    name: string
    platform: string
    dueDay: number
    notes: string | null
  }
}

export function EditInstallmentDialog({ installment }: EditInstallmentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(installment.name)
  const [platform, setPlatform] = useState(installment.platform)
  const [dueDay, setDueDay] = useState(installment.dueDay)
  const [notes, setNotes] = useState(installment.notes || '')

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('กรุณากรอกชื่อสินค้า')
      return
    }
    setLoading(true)
    try {
      await updateInstallment(installment.id, { name, platform, dueDay, notes })
      toast.success('แก้ไขสำเร็จ')
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
        <Pencil className="h-4 w-4 mr-1" />
        แก้ไข
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>แก้ไขรายการผ่อนชำระ</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ชื่อสินค้า</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>แพลตฟอร์ม</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as string)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-56">
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.icon} {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>วันครบกำหนดของทุกเดือน (1-31)</Label>
            <Input
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label>หมายเหตุ</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
