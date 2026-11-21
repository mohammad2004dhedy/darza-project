export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-primary bg-primary text-on-primary hover:border-primary-hover hover:bg-primary-hover',
  outline: 'border-border bg-surface text-primary hover:bg-background',
  ghost: 'border-transparent bg-transparent text-primary hover:bg-background',
  danger: 'border-danger bg-danger text-on-primary hover:opacity-90',
}
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-10 gap-2 px-3 py-2 text-sm',
  md: 'min-h-11 gap-2 px-4 py-2 text-sm',
  lg: 'min-h-12 gap-3 px-6 py-3 text-base',
}
export function buttonStyles(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth = false,
  className = '',
): string {
  return `inline-flex items-center justify-center rounded-md border font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`
}
