import { useEffect, useRef } from 'react'

/**
 * ScrollSnake — a 3D snake of cubes that slithers left→right across the
 * background as the user scrolls the page. Driven by window scroll progress.
 */
export default function ScrollSnake() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let animId: number
    let renderer: any
    let scene: any
    let camera: any
    let cubes: any[] = []
    let scrollProgress = 0
    let smoothProgress = 0

    const isLowEnd = navigator.hardwareConcurrency <= 2

    async function init() {
      const THREE = await import('three')
      const container = containerRef.current
      if (!container) return

      const w = container.clientWidth
      const h = container.clientHeight

      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000)
      camera.position.z = 40

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1 : 2))
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, 0.9)
      scene.add(ambient)
      const dir = new THREE.DirectionalLight(0xbcd0ee, 1.6)
      dir.position.set(5, 10, 7)
      scene.add(dir)

      // Muted corporate palette
      const colors = [0x6b7fa3, 0x4a6fa5, 0x5a8a7a, 0x3d6b8a, 0x8a9ab5]

      // Build the snake of cubes
      const CUBE_COUNT = 40
      const geo = new THREE.BoxGeometry(1.6, 1.6, 1.6)
      for (let i = 0; i < CUBE_COUNT; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: colors[i % colors.length],
          transparent: true,
          opacity: 0.7,
          roughness: 0.3,
          metalness: 0.4,
        })
        const cube = new THREE.Mesh(geo, mat)
        scene.add(cube)
        cubes.push(cube)
      }

      // Track scroll progress (0..1 across whole page)
      function onScroll() {
        const max = document.documentElement.scrollHeight - window.innerHeight
        scrollProgress = max > 0 ? window.scrollY / max : 0
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()

      let time = 0

      function animate() {
        animId = requestAnimationFrame(animate)
        time += 0.016

        // Smooth the scroll so the snake slithers evenly in both directions
        smoothProgress += (scrollProgress - smoothProgress) * 0.06

        // Head Y travels top→bottom with scroll (from +30 to -30)
        const headY = 30 - smoothProgress * 60

        for (let i = 0; i < cubes.length; i++) {
          const cube = cubes[i]
          // Each segment trails above the head (vertical snake)
          const t = i / cubes.length
          const y = headY + i * 1.6
          // Left→right undulation driven by scroll AND time
          const x = Math.sin(y * 0.18 + smoothProgress * 12 + time * 0.4) * 14 * (0.4 + t)
          const z = Math.cos(y * 0.12 + time * 0.4) * 4 - 10

          cube.position.set(x, y, z)

          // Rotate cubes for liveliness
          cube.rotation.x = time * 0.4 + i * 0.1
          cube.rotation.y = time * 0.3 + i * 0.15

          // Fade tail slightly (but keep bright)
          cube.material.opacity = 0.5 * (1 - t * 0.5)

          // Scale head bigger, tail smaller
          const s = 1.2 - t * 0.5
          cube.scale.set(s, s, s)
        }

        renderer.render(scene, camera)
      }
      animate()

      function onResize() {
        if (!container) return
        const cw = container.clientWidth
        const ch = container.clientHeight
        camera.aspect = cw / ch
        camera.updateProjectionMatrix()
        renderer.setSize(cw, ch)
      }
      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
        window.removeEventListener('scroll', onScroll)
      }
    }

    let cleanup: (() => void) | undefined
    init().then((fn) => { cleanup = fn })

    return () => {
      cancelAnimationFrame(animId)
      if (cleanup) cleanup()
      cubes = []
      if (renderer) {
        renderer.dispose()
        containerRef.current?.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0, opacity: 0.5 }}
    />
  )
}
