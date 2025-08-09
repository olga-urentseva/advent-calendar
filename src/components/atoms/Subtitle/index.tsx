import type { ReactNode } from 'react'
import './styles.css'

interface SubtitleProps {
  children: ReactNode
  className?: string
}

export function Subtitle({ children, className = '' }: SubtitleProps) {
  return (
    <p className={`subtitle ${className}`}>
      {children}
    </p>
  )
}
