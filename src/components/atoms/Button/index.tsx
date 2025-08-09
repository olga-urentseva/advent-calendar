import type { ReactNode } from 'react'
import './styles.css'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export function Button({ 
  variant = 'primary', 
  disabled = false, 
  children, 
  onClick, 
  type = 'button',
  className = ''
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
