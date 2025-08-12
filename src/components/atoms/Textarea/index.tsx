import type { TextareaHTMLAttributes } from 'react'
import './styles.css'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  className?: string
}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`form-textarea ${className}`}
      {...props}
    />
  )
}
