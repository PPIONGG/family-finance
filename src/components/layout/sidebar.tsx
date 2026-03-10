'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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

function NavLink({ item, pathname }: { item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }; pathname: string }) {
  const isActive = pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
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

function SectionLabel({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  )
}

export function Sidebar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
      <div className="flex items-center h-16 px-6 border-b">
        <Link href="/installments" className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Family Finance</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* ส่วนตัว */}
        <SectionLabel icon={User} label="ส่วนตัว" />
        {personalItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {/* ครอบครัว */}
        <div className="pt-4">
          <SectionLabel icon={Users} label="ครอบครัว" />
          {familyItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {/* ตั้งค่า */}
        <div className="pt-4">
          {otherItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>
      {children && <div className="pb-4">{children}</div>}
    </aside>
  )
}
