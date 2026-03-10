'use client'

import { useState } from 'react'
import { getServiceBrand, SUBSCRIPTION_CATEGORIES } from '@/constants/subscriptions'

interface ServiceIconProps {
  name: string
  category?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ServiceIcon({ name, category, size = 'md' }: ServiceIconProps) {
  const brand = getServiceBrand(name)
  const [imgError, setImgError] = useState(false)

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  const imgSizes = { sm: 24, md: 32, lg: 40 }

  // Brand logo from Google Favicon API
  if (brand && !imgError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center shrink-0 overflow-hidden`}
        style={{ backgroundColor: brand.bgColor }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=${imgSizes[size] * 2}`}
          alt={brand.name}
          width={imgSizes[size]}
          height={imgSizes[size]}
          className="rounded"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  // Fallback: brand initials
  if (brand) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center font-bold shrink-0 text-xs`}
        style={{ backgroundColor: brand.bgColor, color: brand.color }}
      >
        {brand.initials}
      </div>
    )
  }

  // Fallback: category emoji or first letter
  const cat = SUBSCRIPTION_CATEGORIES.find((c) => c.value === category)
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className={`${sizeClasses[size]} rounded-lg flex items-center justify-center font-bold shrink-0 bg-gray-100 text-gray-600`}>
      {cat ? <span className="text-lg">{cat.icon}</span> : initial}
    </div>
  )
}
