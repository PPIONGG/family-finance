import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatShortDate(date: Date | string): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_key, value) =>
    typeof value === 'object' && value !== null && 'toNumber' in value
      ? Number(value)
      : value
  ))
}
