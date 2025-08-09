import type { ReactNode } from 'react'
import './styles.css'

interface ContainerProps {
  children: ReactNode
  className?: string
}

export function Container({ children, className = '' }: ContainerProps) {
  return (
    <div className={`container ${className}`}>
      {children}
    </div>
  )
}
