import { forwardRef, InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>((
  { label, error, hint, className, id, ...props },
  ref
) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-sv-text mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'w-full px-3 py-2.5 text-sm text-sv-text bg-sv-surface border rounded-lg',
          'placeholder:text-sv-text-secondary/60',
          'focus:outline-none focus:ring-2 focus:ring-sv-primary focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'min-h-[44px]',
          error ? 'border-sv-error' : 'border-sv-border',
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-sv-text-secondary">{hint}</p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-sv-error">{error}</p>
      )}
    </div>
  )
})
Input.displayName = 'Input'
