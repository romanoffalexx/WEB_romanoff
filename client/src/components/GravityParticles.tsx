import { useEffect, useRef } from 'react'

/**
 * Gravity particles — fall, hit the bottom, bounce like a ball losing energy.
 * Triggered on scroll into view.
 */
export default function GravityParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inViewRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const dpr = Math.min(window.devicePixelRatio, 2)
    const isLowEnd = navigator.hardwareConcurrency <= 2
    let w = 0
    let h = 0

    const GRAVITY = 0.12
    const BOUNCE_LOSS = 0.55    // energy kept after bounce (0.55 = 45% lost)
    const FLOOR_FRICTION = 0.98
    const MIN_BOUNCE_V = 0.6    // stop bouncing below this speed
    const COUNT = isLowEnd ? 12 : 25

    const colors = ['#6b7fa3', '#4a6fa5', '#5a8a7a', '#8a9ab5', '#3d6b8a', '#c0c8d8']

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      r: number;
      color: string;
      resting: boolean;   // settled on floor
      settled: number;    // frames since last bounce
    }

    let particles: Particle[] = []

    function resize() {
      if (!canvas) return
      const rect = canvas.parentElement!.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function spawnAll() {
      particles = []
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: -Math.random() * h * 0.8 - 20,  // start above the section
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 1.5,
          r: Math.random() * 2.2 + 0.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          resting: false,
          settled: 0,
        })
      }
    }

    resize()

    function draw() {
      animId = requestAnimationFrame(draw)
      if (!inViewRef.current) return
      ctx!.clearRect(0, 0, w, h)

      const floor = h - 2
      let allSettled = true

      for (const p of particles) {
        if (p.resting) continue
        allSettled = false

        // Gravity
        p.vy += GRAVITY
        p.x += p.vx
        p.y += p.vy

        // Floor collision & bounce
        if (p.y + p.r >= floor) {
          p.y = floor - p.r
          p.vy = -Math.abs(p.vy) * BOUNCE_LOSS
          p.vx *= FLOOR_FRICTION
          p.settled++

          if (Math.abs(p.vy) < MIN_BOUNCE_V) {
            p.vy = 0
            p.vx *= 0.9
            if (Math.abs(p.vx) < 0.1) {
              p.resting = true
              p.vx = 0
            }
          }
        }

        // Walls
        if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx) * 0.7 }
        if (p.x > w - p.r) { p.x = w - p.r; p.vx = -Math.abs(p.vx) * 0.7 }
      }

      // Draw settled particles as dim floor dots
      for (const p of particles) {
        // Glow
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2)
        ctx!.fillStyle = p.color + '10'
        ctx!.fill()

        // Core
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = p.resting ? p.color + '60' : p.color
        ctx!.shadowBlur = p.resting ? 0 : 6
        ctx!.shadowColor = p.color
        ctx!.fill()
        ctx!.shadowBlur = 0
      }

      // Draw connections between moving particles
      const connectDist = 60
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].resting) continue
        for (let j = i + 1; j < particles.length; j++) {
          if (particles[j].resting) continue
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectDist) {
            const alpha = (1 - dist / connectDist) * 0.12
            ctx!.beginPath()
            ctx!.moveTo(particles[i].x, particles[i].y)
            ctx!.lineTo(particles[j].x, particles[j].y)
            ctx!.strokeStyle = `rgba(147, 111, 255, ${alpha})`
            ctx!.lineWidth = 0.5
            ctx!.stroke()
          }
        }
      }

      // Respawn when all settled
      if (allSettled) {
        // Wait a bit then re-drop
        setTimeout(() => {
          if (inViewRef.current) spawnAll()
        }, 3000)
      }
    }

    draw()

    // IntersectionObserver: start physics only when section is visible
    const section = canvas.parentElement
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inViewRef.current) {
          inViewRef.current = true
          spawnAll()
        } else if (!entry.isIntersecting) {
          inViewRef.current = false
        }
      },
      { threshold: 0.15 }
    )
    if (section) observer.observe(section)

    const ro = new ResizeObserver(resize)
    if (section) ro.observe(section)

    return () => {
      cancelAnimationFrame(animId)
      observer.disconnect()
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  )
}
