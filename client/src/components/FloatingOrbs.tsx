import { useEffect, useRef } from 'react'

/** Animated gradient orbs that follow scroll position */
export default function FloatingOrbs() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const orbs = containerRef.current?.querySelectorAll<HTMLDivElement>('.orb')
    if (!orbs) return

    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollY = window.scrollY
        orbs?.forEach((orb, i) => {
          const speed = 0.03 + i * 0.015
          const x = Math.sin(scrollY * 0.001 + i * 2) * 80
          const y = scrollY * speed
          orb.style.transform = `translate(${x}px, ${-y}px)`
        })
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Purple orb */}
      <div
        className="orb absolute w-[500px] h-[500px] rounded-full opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, #6b7fa3, transparent 70%)',
          top: '-10%',
          right: '-5%',
        }}
      />
      {/* Blue orb */}
      <div
        className="orb absolute w-[400px] h-[400px] rounded-full opacity-[0.025]"
        style={{
          background: 'radial-gradient(circle, #4a6fa5, transparent 70%)',
          top: '30%',
          left: '-8%',
        }}
      />
      {/* Teal orb */}
      <div
        className="orb absolute w-[350px] h-[350px] rounded-full opacity-[0.02]"
        style={{
          background: 'radial-gradient(circle, #5a8a7a, transparent 70%)',
          top: '60%',
          right: '10%',
        }}
      />
      {/* Additional small orb */}
      <div
        className="orb absolute w-[200px] h-[200px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #6b7fa3, transparent 70%)',
          top: '80%',
          left: '20%',
        }}
      />
    </div>
  )
}
