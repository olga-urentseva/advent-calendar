import type { ReactNode } from 'react'
import './styles.css'
import { Link } from 'react-router-dom'

interface ButtonLinkProps {
  variant?: 'primary' | 'secondary' | 'danger'

  children: ReactNode
  
  className?: string
  key: number
  to: string
}

export function ButtonLink({ 
  variant = 'primary', 
  key,
  to,
  children, 
  className = ''
}: ButtonLinkProps) {
  return (
    <Link key={key} to={to}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </Link>
  )
}
