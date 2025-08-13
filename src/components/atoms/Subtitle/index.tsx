import type { ReactNode } from 'react'
import './styles.css'

interface SubtitleProps {
  children: ReactNode
  className?: string
}

export function Subtitle({ children}: SubtitleProps) {
  return (
    <p className="subtitle">
      {children}
    </p>
  )
}
