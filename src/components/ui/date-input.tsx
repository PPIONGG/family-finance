'use client'

import { useState, useEffect, forwardRef } from 'react'
import { Input } from './input'
import { Button } from './button'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { CalendarIcon } from 'lucide-react'

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
    const [open, setOpen] = useState(false)

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

    const handleCalendarSelect = (date: Date | undefined) => {
      if (!date) return
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      onChange?.(`${y}-${m}-${d}`)
      setOpen(false)
    }

    const selectedDate = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(value + 'T00:00:00')
      : undefined

    return (
      <div className="flex gap-1">
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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={<Button type="button" variant="outline" size="icon" className="shrink-0" />}
          >
            <CalendarIcon className="h-4 w-4" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              defaultMonth={selectedDate}
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)

DateInput.displayName = 'DateInput'
