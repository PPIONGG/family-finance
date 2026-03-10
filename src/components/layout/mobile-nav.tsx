'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  CreditCard,
  Settings,
  Tv,
  Landmark,
  User,
  Users,
} from 'lucide-react'

const personalItems = [
  { href: '/subscriptions', label: 'สมัครสมาชิก', icon: Tv },
  { href: '/debts', label: 'หนี้สิน', icon: Landmark },
]

const familyItems = [
  { href: '/installments', label: 'การผ่อนชำระ', icon: CreditCard },
]

const otherItems = [
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
]

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()

  const renderLink = (item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
    const isActive = pathname.startsWith(item.href)
    return (
      <Link
        key={item.href}
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

  const SectionLabel = ({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) => (
    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="h-16 flex items-center px-6 border-b">
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Family Finance</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="px-3 py-4 space-y-1">
          {/* ส่วนตัว */}
          <SectionLabel icon={User} label="ส่วนตัว" />
          {personalItems.map(renderLink)}

          {/* ครอบครัว */}
          <div className="pt-4">
            <SectionLabel icon={Users} label="ครอบครัว" />
            {familyItems.map(renderLink)}
          </div>

          {/* ตั้งค่า */}
          <div className="pt-4">
            {otherItems.map(renderLink)}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
