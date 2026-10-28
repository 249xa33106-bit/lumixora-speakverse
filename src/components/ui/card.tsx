import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export const Card = forwardRef<HTMLDivElement, CardProps>((
  { hover, padding = 'md', className, children, ...props },
  ref
) => (
  <div
    ref={ref}
    className={clsx(
      'bg-sv-surface border border-sv-border rounded-sv shadow-sv-card',
      hover && 'hover:shadow-sv-card-hover transition-shadow cursor-pointer',
      padding === 'sm' && 'p-4',
      padding === 'md' && 'p-6',
      padding === 'lg' && 'p-8',
      className
    )}
    {...props}
  >
    {children}
  </div>
))
Card.displayName = 'Card'

export const CardHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('mb-4', className)} {...props}>{children}</div>
)

export const CardTitle = ({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={clsx('text-lg font-semibold text-sv-text', className)} {...props}>{children}</h3>
)

export const CardDescription = ({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={clsx('text-sm text-sv-text-secondary mt-1', className)} {...props}>{children}</p>
)

export const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx(className)} {...props}>{children}</div>
)

export const CardFooter = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('mt-4 pt-4 border-t border-sv-border', className)} {...props}>{children}</div>
)
