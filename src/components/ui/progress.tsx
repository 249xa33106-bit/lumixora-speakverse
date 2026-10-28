import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number // 0-100
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'error'
  label?: string
  showValue?: boolean
}

const colorClasses = {
  primary: 'bg-sv-primary',
  success: 'bg-sv-success',
  warning: 'bg-sv-warning',
  error: 'bg-sv-error',
}

const sizeClasses = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

export function Progress({ value, max = 100, size = 'md', color = 'primary', label, showValue, className, ...props }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={clsx('w-full', className)} {...props}>
      {(label || showValue) && (
        <div className="flex justify-between text-xs text-sv-text-secondary mb-1">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className={clsx('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}
      >
        <div
          className={clsx('h-full rounded-full transition-all duration-300', colorClasses[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
