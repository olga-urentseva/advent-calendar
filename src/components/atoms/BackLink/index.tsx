import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './styles.css'

interface BackLinkProps {
  to: string
  children: ReactNode
  className?: string
}

export function BackLink({ to, children, className = '' }: BackLinkProps) {
  return (
    <Link to={to} className={`back-link ${className}`}>
      {children}
    </Link>
  )
}
