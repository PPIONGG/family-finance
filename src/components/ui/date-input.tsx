'use client'

import { useState, useEffect, forwardRef } from 'react'
import { Input } from './input'

interface DateInputProps {
  value?: string // yyyy-mm-dd
  onChange?: (value: string) => void
  onBlur?: () => void
  name?: string
  placeholder?: string
  className?: string
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, onBlur, name, placeholder, className }, ref) => {
    const [display, setDisplay] = useState('')

    // Sync from form value (yyyy-mm-dd) → display (dd/mm/yyyy)
    useEffect(() => {
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-')
        setDisplay(`${d}/${m}/${y}`)
      } else if (!value) {
        setDisplay('')
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value.replace(/[^\d]/g, '')

      // Auto-insert slashes
      if (raw.length > 2) raw = raw.slice(0, 2) + '/' + raw.slice(2)
      if (raw.length > 5) raw = raw.slice(0, 5) + '/' + raw.slice(5)
      if (raw.length > 10) raw = raw.slice(0, 10)

      setDisplay(raw)

      // Parse dd/mm/yyyy → yyyy-mm-dd
      const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (match) {
        const isoDate = `${match[3]}-${match[2]}-${match[1]}`
        onChange?.(isoDate)
      } else if (raw === '') {
        onChange?.('')
      }
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        name={name}
        placeholder={placeholder || 'dd/mm/yyyy'}
        className={className}
        value={display}
        onChange={handleChange}
        onBlur={onBlur}
        maxLength={10}
      />
    )
  }
)

DateInput.displayName = 'DateInput'
