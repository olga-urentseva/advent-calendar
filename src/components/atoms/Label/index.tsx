import type { ReactNode } from 'react'
import './styles.css'

interface LabelProps {
  htmlFor?: string
  children: ReactNode
  className?: string
}

export function Label({ htmlFor, children, className = '' }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={`form-label ${className}`}>
      {children}
    </label>
  )
}
