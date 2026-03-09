'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  BarChart3,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/transactions', label: 'รายรับ-รายจ่าย', icon: ArrowLeftRight },
  { href: '/installments', label: 'การผ่อนชำระ', icon: CreditCard },
  { href: '/reports', label: 'รายงาน', icon: BarChart3 },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
]

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()

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
          {navItems.map((item) => {
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
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
