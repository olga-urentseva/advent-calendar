import type { ReactNode } from 'react'
import './styles.css'

interface FormGroupProps {
  children: ReactNode
  className?: string
}

export function FormGroup({ children, className = '' }: FormGroupProps) {
  return (
    <div className={`form-group ${className}`}>
      {children}
    </div>
  )
}
