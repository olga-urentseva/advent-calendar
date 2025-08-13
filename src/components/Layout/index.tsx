import type { ReactNode } from 'react'
import { Header } from '../atoms/Header'
import './styles.css'

interface LayoutProps {
  children: ReactNode
  className?: string
}

export function Layout({ children}: LayoutProps) {
  return (
    <div className="layout">
      <Header />
      <main className="layout__content">
        {children}
      </main>
    </div>
  )
}
