import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-sv-text-secondary',
  success: 'bg-green-100 text-sv-success',
  warning: 'bg-amber-100 text-sv-warning',
  error: 'bg-red-100 text-sv-error',
  info: 'bg-blue-100 text-sv-primary',
  outline: 'border border-sv-border text-sv-text-secondary bg-transparent',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
