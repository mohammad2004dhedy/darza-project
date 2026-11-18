import { forwardRef, type AnchorHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'
import { buttonStyles, type ButtonSize, type ButtonVariant } from './buttonStyles'

interface SharedProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}
export type ButtonLinkProps = SharedProps &
  (
    | (LinkProps & { href?: never })
    | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; to?: never })
  )
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant = 'primary', size = 'md', fullWidth = false, className = '', ...props },
  ref,
) {
  const classes = buttonStyles(variant, size, fullWidth, className)
  if (props.href !== undefined) {
    return (
      <a
        {...props}
        ref={ref}
        className={classes}
        rel={
          props.target === '_blank' ? `${props.rel ?? ''} noopener noreferrer`.trim() : props.rel
        }
      />
    )
  }
  return <Link {...props} ref={ref} className={classes} />
})
