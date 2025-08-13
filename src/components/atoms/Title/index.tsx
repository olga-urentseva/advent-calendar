import type { ReactNode } from 'react'
import './styles.css'

interface TitleProps {
  children: ReactNode
  className?: string
}

export function Title({ children, className = '' }: TitleProps) {
  const processChildren = (content: ReactNode): ReactNode => {
    if (typeof content === 'string') {
      const words = content.split(' ')
      return words.map((word, index) => {
        if (word.toLowerCase() === 'magic') {
          return (
            <span key={index} className="title__magic-word">
              {word}
              {index < words.length - 1 ? ' ' : ''}
            </span>
          )
        }
        return (
          <span key={index}>
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </span>
        )
      })
    }
    return content
  }

  return (
    <h1 className={`title ${className}`}>
      {processChildren(children)}
    </h1>
  )
}
