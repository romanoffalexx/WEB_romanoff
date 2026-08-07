import { useEffect, useRef } from 'react'

/** Canvas neural network animation — floating brain/network visualization */
export default function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const isLowEnd = navigator.hardwareConcurrency <= 2
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const dpr = Math.min(window.devicePixelRatio, 2)
    let w = 0
    let h = 0

    function resize() {
      if (!canvas) return
      const rect = canvas.parentElement!.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx!.scale(dpr, dpr)
    }
    resize()

    // Nodes
    const nodeCount = isLowEnd ? 18 : 35
    const nodes: { x: number; y: number; vx: number; vy: number; r: number; pulse: number; color: string }[] = []
    const colors = ['#6b7fa3', '#4a6fa5', '#5a8a7a', '#8a9ab5', '#3d6b8a']

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 3 + 1.5,
        pulse: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    // Signals traveling along connections
    const signals: { from: number; to: number; progress: number; speed: number; color: string }[] = []

    function spawnSignal() {
      if (signals.length > (isLowEnd ? 5 : 12)) return
      const from = Math.floor(Math.random() * nodeCount)
      let to = Math.floor(Math.random() * nodeCount)
      while (to === from) to = Math.floor(Math.random() * nodeCount)
      signals.push({
        from,
        to,
        progress: 0,
        speed: 0.008 + Math.random() * 0.012,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    let time = 0

    function draw() {
      animId = requestAnimationFrame(draw)
      time += 0.016
      ctx!.clearRect(0, 0, w, h)

      // Update nodes
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy
        node.pulse += 0.03
        if (node.x < 0 || node.x > w) node.vx *= -1
        if (node.y < 0 || node.y > h) node.vy *= -1
        node.x = Math.max(0, Math.min(w, node.x))
        node.y = Math.max(0, Math.min(h, node.y))
      }

      // Draw connections
      const threshold = isLowEnd ? 150 : 180
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < threshold) {
            const alpha = (1 - dist / threshold) * 0.15
            ctx!.beginPath()
            ctx!.moveTo(nodes[i].x, nodes[i].y)
            ctx!.lineTo(nodes[j].x, nodes[j].y)
            ctx!.strokeStyle = `rgba(147, 111, 255, ${alpha})`
            ctx!.lineWidth = 0.5
            ctx!.stroke()
          }
        }
      }

      // Draw signals
      if (Math.random() < 0.04) spawnSignal()
      for (let i = signals.length - 1; i >= 0; i--) {
        const sig = signals[i]
        sig.progress += sig.speed
        if (sig.progress >= 1) {
          signals.splice(i, 1)
          continue
        }
        const fromNode = nodes[sig.from]
        const toNode = nodes[sig.to]
        const sx = fromNode.x + (toNode.x - fromNode.x) * sig.progress
        const sy = fromNode.y + (toNode.y - fromNode.y) * sig.progress

        ctx!.beginPath()
        ctx!.arc(sx, sy, 2.5, 0, Math.PI * 2)
        ctx!.fillStyle = sig.color
        ctx!.shadowBlur = 12
        ctx!.shadowColor = sig.color
        ctx!.fill()
        ctx!.shadowBlur = 0
      }

      // Draw nodes
      for (const node of nodes) {
        const pulseSize = Math.sin(node.pulse) * 1.5
        const r = node.r + pulseSize

        // Glow
        ctx!.beginPath()
        ctx!.arc(node.x, node.y, r + 6, 0, Math.PI * 2)
        ctx!.fillStyle = node.color.replace(')', ', 0.08)').replace('rgb', 'rgba')
        ctx!.fill()

        // Core
        ctx!.beginPath()
        ctx!.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx!.fillStyle = node.color
        ctx!.shadowBlur = 15
        ctx!.shadowColor = node.color
        ctx!.fill()
        ctx!.shadowBlur = 0
      }
    }

    draw()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.5 }}
    />
  )
}
