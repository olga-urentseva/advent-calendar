import type { InputHTMLAttributes } from 'react'
import './styles.css'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  className?: string
}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`form-input ${className}`}
      {...props}
    />
  )
}
