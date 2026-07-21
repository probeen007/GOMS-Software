import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface ButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline-white'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  className?: string
}

export default function Button({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  fullWidth = false,
  className = '',
}: ButtonProps) {
  const sizeMap = {
    sm: { padding: '9px 20px', fontSize: '11px' },
    md: { padding: '13px 28px', fontSize: '12px' },
    lg: { padding: '16px 36px', fontSize: '13px' },
  }

  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
      ? 'btn-secondary'
      : 'btn-secondary'

  const style = {
    ...sizeMap[size],
    width: fullWidth ? '100%' : 'auto',
    justifyContent: 'center' as const,
  }

  if (href) {
    return (
      <Link to={href} className={`${variantClass} ${className}`} style={style}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${variantClass} ${className}`}
      style={style}
    >
      {children}
    </button>
  )
}

export function ArrowButton({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link
      to={href}
      className="inline-flex items-center gap-2 text-white font-semibold uppercase tracking-widest transition-all duration-200 group"
      style={{ fontSize: '11px' }}
    >
      {children}
      <ArrowRight
        size={16}
        className="transition-transform duration-200 group-hover:translate-x-1"
        color="#E63946"
      />
    </Link>
  )
}
