import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

/** GSAP-powered text reveal animation */
export function TextReveal({ children, className = '', delay = 0 }: { children: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-30px' })
  const [words, setWords] = useState<string[]>([])

  useEffect(() => {
    setWords(children.split(' '))
  }, [children])

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block mr-[0.3em] transition-all duration-700"
          style={{
            transform: isInView ? 'translateY(0) rotateX(0)' : 'translateY(110%) rotateX(-20deg)',
            opacity: isInView ? 1 : 0,
            transitionDelay: `${delay + i * 0.06}s`,
            transformOrigin: 'bottom left',
          }}
        >
          {word}
        </span>
      ))}
    </div>
  )
}

/** Glitch text effect for hero */
export function GlitchText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <span
        className="absolute top-0 left-0 opacity-70"
        style={{
          color: '#6b7fa3',
          clipPath: 'polygon(0 0, 100% 0, 100% 33%, 0 33%)',
          transform: 'translate(-2px, -1px)',
        }}
        aria-hidden
      >
        {text}
      </span>
      <span
        className="absolute top-0 left-0 opacity-70"
        style={{
          color: '#5a8a7a',
          clipPath: 'polygon(0 67%, 100% 67%, 100% 100%, 0 100%)',
          transform: 'translate(2px, 1px)',
        }}
        aria-hidden
      >
        {text}
      </span>
    </span>
  )
}

/** Spotlight that follows cursor within a container */
export function Spotlight({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      el!.style.setProperty('--spot-x', `${x}px`)
      el!.style.setProperty('--spot-y', `${y}px`)
    }

    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{
        backgroundImage: 'radial-gradient(600px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(107,127,163,0.06), transparent 40%)',
      }}
    >
      {children}
    </div>
  )
}
