import { useEffect, useRef } from 'react'

/**
 * Hyper-tunnel starfield — particles spawn at center and fly radially outward.
 * No size scaling, just radial streaking like a hyperspace jump.
 */
export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let animId: number
    let renderer: any
    let scene: any
    let camera: any
    let particles: any
    let linesMesh: any
    const isLowEnd = navigator.hardwareConcurrency <= 2

    // Mouse with inertia
    const mouse = { x: 0.5, y: 0.5, smoothX: 0.5, smoothY: 0.5 }
    const DAMPING = 0.92
    const ATTRACT_RADIUS = 0.35    // normalized 0..1
    const ATTRACT_STRENGTH = 0.004

    async function init() {
      const THREE = await import('three')
      const container = containerRef.current
      if (!container) return

      const w = container.clientWidth
      const h = container.clientHeight
      const aspect = w / h

      scene = new THREE.Scene()
      // Orthographic camera so particles keep constant size
      const frustum = 60
      camera = new THREE.OrthographicCamera(
        -frustum * aspect / 2, frustum * aspect / 2,
        frustum / 2, -frustum / 2,
        0.1, 200
      )
      camera.position.z = 100

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1 : 2))
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      // ── Particles ──
      const count = isLowEnd ? 900 : 1800
      const positions = new Float32Array(count * 3)
      const velocities = new Float32Array(count * 3)   // radial velocity
      const speeds = new Float32Array(count)            // per-particle speed multiplier
      const colors = new Float32Array(count * 3)
      const purple = new THREE.Color(0x6b7fa3)
      const blue = new THREE.Color(0x4a6fa5)
      const steel = new THREE.Color(0x8a9ab5)
      const white = new THREE.Color(0xc0c8d8)
      const palette = [purple, blue, steel, blue, purple, white]

      const FIELD_W = frustum * aspect
      const FIELD_H = frustum

      function spawnParticle(i: number) {
        // Start near center with small random offset
        const angle = Math.random() * Math.PI * 2
        const startDist = Math.random() * 3
        positions[i * 3] = Math.cos(angle) * startDist
        positions[i * 3 + 1] = Math.sin(angle) * startDist
        positions[i * 3 + 2] = 0

        // Radial velocity outward
        const speed = 0.15 + Math.random() * 0.6
        velocities[i * 3] = Math.cos(angle) * speed
        velocities[i * 3 + 1] = Math.sin(angle) * speed
        velocities[i * 3 + 2] = 0
        speeds[i] = speed
      }

      for (let i = 0; i < count; i++) {
        spawnParticle(i)
        // Scatter initial positions so it's not empty at start
        const progress = Math.random()
        positions[i * 3] += velocities[i * 3] * progress * 120
        positions[i * 3 + 1] += velocities[i * 3 + 1] * progress * 120

        const c = palette[Math.floor(Math.random() * palette.length)]
        colors[i * 3] = c.r
        colors[i * 3 + 1] = c.g
        colors[i * 3 + 2] = c.b
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      // ── Square texture for particles ──
      const squareCanvas = document.createElement('canvas')
      squareCanvas.width = 16
      squareCanvas.height = 16
      const sqCtx = squareCanvas.getContext('2d')!
      sqCtx.fillStyle = '#ffffff'
      sqCtx.fillRect(0, 0, 16, 16)
      const squareTexture = new THREE.CanvasTexture(squareCanvas)

      const material = new THREE.PointsMaterial({
        size: 3,
        map: squareTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: false,
      })

      particles = new THREE.Points(geometry, material)
      scene.add(particles)

      // ── Streak lines (trails behind particles) ──
      const maxLines = isLowEnd ? 120 : 350
      const linePositions = new Float32Array(maxLines * 6)
      const lineColors = new Float32Array(maxLines * 6)
      const lineGeo = new THREE.BufferGeometry()
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
      lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3))
      lineGeo.setDrawRange(0, 0)
      const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
      })
      linesMesh = new THREE.LineSegments(lineGeo, lineMat)
      scene.add(linesMesh)

      function updateStreaks() {
        const pos = geometry.attributes.position.array as Float32Array
        let li = 0
        for (let i = 0; i < count && li < maxLines; i += 2) {
          const vx = velocities[i * 3]
          const vy = velocities[i * 3 + 1]
          const speed = speeds[i]
          const idx = li * 6
          // Head
          linePositions[idx] = pos[i * 3]
          linePositions[idx + 1] = pos[i * 3 + 1]
          linePositions[idx + 2] = 0
          // Tail (behind the particle)
          const trailLen = speed * 12
          linePositions[idx + 3] = pos[i * 3] - vx * trailLen
          linePositions[idx + 4] = pos[i * 3 + 1] - vy * trailLen
          linePositions[idx + 5] = 0
          // Colors: head bright, tail dim
          const alpha = Math.min(1, speed * 1.5)
          lineColors[idx] = colors[i * 3] * alpha
          lineColors[idx + 1] = colors[i * 3 + 1] * alpha
          lineColors[idx + 2] = colors[i * 3 + 2] * alpha
          lineColors[idx + 3] = colors[i * 3] * alpha * 0.1
          lineColors[idx + 4] = colors[i * 3 + 1] * alpha * 0.1
          lineColors[idx + 5] = colors[i * 3 + 2] * alpha * 0.1
          li++
        }
        lineGeo.setDrawRange(0, li * 2)
        lineGeo.attributes.position.needsUpdate = true
        lineGeo.attributes.color.needsUpdate = true
      }

      const HALF_W = FIELD_W / 2
      const HALF_H = FIELD_H / 2

      function animate() {
        animId = requestAnimationFrame(animate)

        // Smooth mouse
        mouse.smoothX += (mouse.x - mouse.smoothX) * 0.05
        mouse.smoothY += (mouse.y - mouse.smoothY) * 0.05

        // Mouse offset from center (normalized -1..1)
        const mx = (mouse.smoothX - 0.5) * 2
        const my = -(mouse.smoothY - 0.5) * 2

        const pos = geometry.attributes.position.array as Float32Array
        for (let i = 0; i < count; i++) {
          const ix = i * 3
          const iy = ix + 1

          // Accelerate outward (speed increases with distance from center)
          const dx = pos[ix]
          const dy = pos[iy]
          const dist = Math.sqrt(dx * dx + dy * dy)
          const accel = 1 + dist * 0.012  // further = faster

          pos[ix] += velocities[ix] * accel
          pos[iy] += velocities[iy] * accel

          // ── Cursor attraction: shift the center of the warp ──
          const cursorOffX = mx * 8
          const cursorOffY = my * 8
          const cdx = cursorOffX - pos[ix]
          const cdy = cursorOffY - pos[iy]
          const cDist = Math.sqrt(cdx * cdx + cdy * cdy)
          if (cDist < ATTRACT_RADIUS * FIELD_W && cDist > 0.5) {
            const force = (1 - cDist / (ATTRACT_RADIUS * FIELD_W)) * ATTRACT_STRENGTH
            pos[ix] += cdx * force
            pos[iy] += cdy * force
          }

          // Reset when off-screen
          if (Math.abs(pos[ix]) > HALF_W + 5 || Math.abs(pos[iy]) > HALF_H + 5) {
            spawnParticle(i)
            // Offset spawn center toward mouse
            pos[ix] += mx * 4
            pos[iy] += my * 4
          }
        }
        geometry.attributes.position.needsUpdate = true

        updateStreaks()
        renderer.render(scene, camera)
      }
      animate()

      function onResize() {
        if (!container) return
        const w = container.clientWidth
        const h = container.clientHeight
        const aspect = w / h
        camera.left = -frustum * aspect / 2
        camera.right = frustum * aspect / 2
        camera.top = frustum / 2
        camera.bottom = -frustum / 2
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }

      function onMouse(e: MouseEvent) {
        mouse.x = e.clientX / window.innerWidth
        mouse.y = e.clientY / window.innerHeight
      }

      function onTouch(e: TouchEvent) {
        if (e.touches.length > 0) {
          mouse.x = e.touches[0].clientX / window.innerWidth
          mouse.y = e.touches[0].clientY / window.innerHeight
        }
      }

      window.addEventListener('resize', onResize)
      window.addEventListener('mousemove', onMouse)
      window.addEventListener('touchmove', onTouch)

      return () => {
        window.removeEventListener('resize', onResize)
        window.removeEventListener('mousemove', onMouse)
        window.removeEventListener('touchmove', onTouch)
      }
    }

    const cleanupPromise = init()

    return () => {
      cancelAnimationFrame(animId)
      cleanupPromise?.then(fn => fn?.())
      if (renderer) {
        renderer.dispose()
        containerRef.current?.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    />
  )
}
