'use client'

import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'accent' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-[#0F2B46] text-white hover:bg-[#0A1F33] shadow-sm',
  secondary: 'bg-[#0EA5A3] text-white hover:bg-[#0C8C8A] shadow-sm',
  outline: 'border border-[#E2E8F0] bg-white text-[#0F2B46] hover:bg-[#F8FAFC] dark:border-[#1E3A55] dark:bg-[#0F2B46] dark:text-white dark:hover:bg-[#0A1F33]',
  accent: 'bg-[#F59E0B] text-white hover:bg-[#D97706] shadow-sm',
  ghost: 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F2B46] dark:hover:bg-white/5 dark:hover:text-white',
  danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled ? 'true' : undefined}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
