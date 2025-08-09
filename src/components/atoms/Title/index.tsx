import type { ReactNode } from 'react'
import './styles.css'

interface TitleProps {
  children: ReactNode
  className?: string
}

export function Title({ children, className = '' }: TitleProps) {
  return (
    <h1 className={`title ${className}`}>
      {children}
    </h1>
  )
}
