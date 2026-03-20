'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreditCard, Settings, Tv, Landmark, Users, Plus, User, Check } from 'lucide-react'
import { switchGroup } from '@/actions/auth'
import { SetupPrompt } from '@/components/shared/setup-prompt'
import type { Group } from '@/types'

const navItems = [
  { href: '/installments', label: 'การผ่อนชำระ', icon: CreditCard },
  { href: '/debts', label: 'หนี้สิน', icon: Landmark },
  { href: '/subscriptions', label: 'สมัครสมาชิก', icon: Tv },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
]

function NavLink({
  item,
  pathname,
  onClose,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }
  pathname: string
  onClose: () => void
}) {
  const isActive = pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </Link>
  )
}

interface MobileNavProps {
  open: boolean
  onClose: () => void
  groups: Group[]
  activeGroupId: string | null
}

export function MobileNav({ open, onClose, groups, activeGroupId }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSwitch = (groupId: string | null) => {
    startTransition(async () => {
      await switchGroup(groupId)
      router.refresh()
      onClose()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0 flex flex-col">
        <SheetHeader className="h-16 flex items-center px-6 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">PayPlan</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onClose={onClose} />
          ))}

          {/* Context switcher */}
          <div className="pt-3">
            <p className="text-xs font-medium text-muted-foreground px-3 mb-1">บัญชี</p>
            <div className="space-y-0.5">
              {/* ส่วนตัว */}
              <button
                onClick={() => handleSwitch(null)}
                disabled={isPending}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                  !activeGroupId
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="flex-1">ส่วนตัว</span>
                {!activeGroupId && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>

              {/* กลุ่ม */}
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleSwitch(group.id)}
                  disabled={isPending}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                    activeGroupId === group.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">{group.name}</span>
                  {activeGroupId === group.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              ))}

              <button
                onClick={() => setDialogOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
              >
                <Plus className="h-4 w-4 shrink-0" />
                สร้าง / เข้าร่วมกลุ่ม
              </button>
            </div>
          </div>
        </nav>
      </SheetContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>จัดการกลุ่ม</DialogTitle>
          </DialogHeader>
          <SetupPrompt compact onSuccess={() => { setDialogOpen(false); onClose() }} />
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
