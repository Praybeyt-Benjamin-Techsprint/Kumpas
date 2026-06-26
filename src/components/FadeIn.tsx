import React, { useEffect, useRef, useState } from 'react'

interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up'
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  className = '',
  delay = 0,
  direction: _direction = 'up',
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`fade-in ${isVisible ? 'fade-in-visible' : ''} ${className}`}
      data-direction={_direction}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default FadeIn
