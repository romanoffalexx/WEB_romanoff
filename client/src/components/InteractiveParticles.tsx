import { useEffect, useRef } from 'react'

/**
 * Interactive Particles — exact implementation from brunoimbrizi/interactive-particles
 * InstancedBufferGeometry + custom shaders + touch texture for mouse interaction
 */
export default function InteractiveParticles() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let animId: number
    let renderer: any
    let scene: any
    let camera: any
    let mesh: any
    let touchCanvas: HTMLCanvasElement
    let touchCtx: CanvasRenderingContext2D
    let touchTexture: any

    const isLowEnd = navigator.hardwareConcurrency <= 2

    async function init() {
      const THREE = await import('three')
      const container = containerRef.current
      if (!container) return

      const w = container.clientWidth
      const h = container.clientHeight

      scene = new THREE.Scene()
      const frustumSize = 250
      const aspect = w / h
      camera = new THREE.OrthographicCamera(
        -frustumSize * aspect / 2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        1000
      )
      camera.position.z = 100
      // camera.position.y = -10

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1 : 2))
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      // ── Load image ─
      function loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = src
        })
      }

      const img = await loadImage('/assets/photo-hero.png?v=3')

      // Image dimensions
      const imgWidth = 160
      const imgHeight = Math.floor((img.height / img.width) * imgWidth)
      const numPoints = imgWidth * imgHeight

      // ── Sample pixels ──
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = imgWidth
      canvas.height = imgHeight
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight)
      const imgData = ctx.getImageData(0, 0, imgWidth, imgHeight)
      const originalColors = Float32Array.from(imgData.data)

      // Threshold: for B&W photo with white background, check brightness
      // Dark pixels (face) are kept, light pixels (background) are discarded
      const brightnessThreshold = 240
      let numVisible = 0
      for (let i = 0; i < numPoints; i++) {
        const r = originalColors[i * 4 + 0]
        const g = originalColors[i * 4 + 1]
        const b = originalColors[i * 4 + 2]
        const brightness = (r + g + b) / 3
        if (brightness < brightnessThreshold) numVisible++
      }

      // ── InstancedBufferGeometry ──
      const geometry = new THREE.InstancedBufferGeometry()

      // Quad positions
      const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3)
      positions.setXYZ(0, -0.5, 0.5, 0.0)
      positions.setXYZ(1, 0.5, 0.5, 0.0)
      positions.setXYZ(2, -0.5, -0.5, 0.0)
      positions.setXYZ(3, 0.5, -0.5, 0.0)
      geometry.setAttribute('position', positions)

      // UVs
      const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2)
      uvs.setXY(0, 0.0, 0.0)
      uvs.setXY(1, 1.0, 0.0)
      uvs.setXY(2, 0.0, 1.0)
      uvs.setXY(3, 1.0, 1.0)
      geometry.setAttribute('uv', uvs)

      // Index
      geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1))

      // Instanced attributes
      const indices = new Uint16Array(numVisible)
      const offsets = new Float32Array(numVisible * 3)
      const angles = new Float32Array(numVisible)

      let j = 0
      for (let i = 0; i < numPoints; i++) {
        const r = originalColors[i * 4 + 0]
        const g = originalColors[i * 4 + 1]
        const b = originalColors[i * 4 + 2]
        const brightness = (r + g + b) / 3
        if (brightness >= brightnessThreshold) continue

        offsets[j * 3 + 0] = i % imgWidth
        offsets[j * 3 + 1] = Math.floor(i / imgWidth)
        offsets[j * 3 + 2] = 0

        indices[j] = i
        angles[j] = Math.random() * Math.PI
        j++
      }

      geometry.setAttribute('pindex', new THREE.InstancedBufferAttribute(indices, 1, false))
      geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false))
      geometry.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false))

      // ── Texture ──
      const texture = new THREE.CanvasTexture(canvas)
      texture.minFilter = THREE.NearestFilter
      texture.magFilter = THREE.NearestFilter

      // ── Touch canvas ─
      touchCanvas = document.createElement('canvas')
      touchCanvas.width = imgWidth
      touchCanvas.height = imgHeight
      touchCtx = touchCanvas.getContext('2d')!
      touchTexture = new THREE.CanvasTexture(touchCanvas)

      // ── Vertex Shader (from brunoimbrizi) ─
      const vertexShader = `
        precision highp float;

        attribute float pindex;
        attribute vec3 position;
        attribute vec3 offset;
        attribute vec2 uv;
        attribute float angle;

        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;

        uniform float uTime;
        uniform float uRandom;
        uniform float uDepth;
        uniform float uSize;
        uniform vec2 uTextureSize;
        uniform sampler2D uTexture;
        uniform sampler2D uTouch;

        varying vec2 vPUv;
        varying vec2 vUv;

        float random(float n) {
          return fract(sin(n) * 43758.5453123);
        }

        // Simplex noise 2D
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                             -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m; m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vUv = uv;

          // particle uv
          vec2 puv = offset.xy / uTextureSize;
          vPUv = puv;

          // pixel color
          vec4 colA = texture2D(uTexture, puv);
          float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;

          // displacement
          vec3 displaced = offset;
          // randomise
          displaced.xy += vec2(random(pindex) - 0.5, random(offset.x + pindex) - 0.5) * uRandom;
          float rndz = (random(pindex) + snoise(vec2(pindex * 0.1, uTime * 0.1)));
          displaced.z += rndz * (random(pindex) * 2.0 * uDepth);
          // center
          displaced.xy -= uTextureSize * 0.5;

          // touch
          float t = texture2D(uTouch, puv).r;
          displaced.z += t * 20.0 * rndz;
          displaced.x += cos(angle) * t * 20.0 * rndz;
          displaced.y += sin(angle) * t * 20.0 * rndz;

          // particle size
          float psize = (snoise(vec2(uTime, pindex) * 0.5) + 2.0);
          psize *= max(grey, 0.2);
          psize *= uSize;

          // final position
          vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
          mvPosition.xyz += position * psize;
          vec4 finalPosition = projectionMatrix * mvPosition;

          gl_Position = finalPosition;
        }
      `

      // ── Fragment Shader (from brunoimbrizi) ──
      const fragmentShader = `
        precision highp float;

        uniform sampler2D uTexture;

        varying vec2 vPUv;
        varying vec2 vUv;

        void main() {
          vec4 color = vec4(0.0);
          vec2 uv = vUv;
          vec2 puv = vPUv;

          // pixel color
          vec4 colA = texture2D(uTexture, puv);

          // greyscale
          float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;
          vec4 colB = vec4(grey, grey, grey, 1.0);

          // circle
          float border = 0.3;
          float radius = 0.5;
          float dist = radius - distance(uv, vec2(0.5));
          float t = smoothstep(0.0, border, dist);

          // final color
          color = colB;
          color.a = t;

          gl_FragColor = color;
        }
      `

      const uniforms = {
        uTime: { value: 0 },
        uRandom: { value: 1.0 },
        uDepth: { value: 2.0 },
        uSize: { value: 1.5 },
        uTextureSize: { value: new THREE.Vector2(imgWidth, imgHeight) },
        uTexture: { value: texture },
        uTouch: { value: touchTexture },
      }

      const material = new THREE.RawShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        depthTest: false,
        transparent: true,
      })

      mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      // ── Raycaster for mouse ──
      const raycaster = new THREE.Raycaster()
      const mouseNDC = new THREE.Vector2(-999, -999)
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
      let mousePos: { x: number; y: number } | null = null

      const trail: { x: number; y: number; age: number; force: number }[] = []
      const maxAge = 90
      const baseRadius = 0.15

      // Easing (easeOutSine) from original repo
      function easeOutSine(t: number) {
        return Math.sin((t * Math.PI) / 2)
      }

      function addTouch(x: number, y: number) {
        let force = 0
        const last = trail[trail.length - 1]
        if (last) {
          const dx = last.x - x
          const dy = last.y - y
          const dd = dx * dx + dy * dy
          force = Math.min(dd * 100, 1)
        }
        trail.push({ x, y, age: 0, force })
      }

      function updateTouchTexture() {
        touchCtx.clearRect(0, 0, imgWidth, imgHeight)

        if (mousePos) {
          // Convert mouse position to image coordinates
          if (!container) return
          const rect = container.getBoundingClientRect()
          const relX = mousePos.x - rect.left
          const relY = mousePos.y - rect.top
          
          // Map to world coordinates (orthographic camera)
          const frustumSize = 250
          const aspect = rect.width / rect.height
          const worldX = (relX / rect.width - 0.5) * frustumSize * aspect
          const worldY = (0.5 - relY / rect.height) * frustumSize
          
          // Map to image coordinates (centered at origin)
          const imgX = worldX + imgWidth / 2
          const imgY = -worldY + imgHeight / 2

          addTouch(imgX, imgY)
        }

        // age points, remove old
        for (let i = trail.length - 1; i >= 0; i--) {
          trail[i].age++
          if (trail[i].age > maxAge) trail.splice(i, 1)
        }

        // draw each point with intensity based on age
        for (let i = 0; i < trail.length; i++) {
          const point = trail[i]

          let intensity = 1
          if (point.age < maxAge * 0.3) {
            intensity = easeOutSine(point.age / (maxAge * 0.3))
          } else {
            intensity = easeOutSine(1 - (point.age - maxAge * 0.3) / (maxAge * 0.7))
          }
          intensity *= point.force

          const radius = imgWidth * baseRadius * intensity
          if (radius <= 0) continue

          const gradient = touchCtx.createRadialGradient(
            point.x, point.y, radius * 0.25,
            point.x, point.y, radius
          )
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)')
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)')
          touchCtx.fillStyle = gradient
          touchCtx.beginPath()
          touchCtx.arc(point.x, point.y, radius, 0, Math.PI * 2)
          touchCtx.fill()
        }

        touchTexture.needsUpdate = true
      }

      let time = 0

      function animate() {
        animId = requestAnimationFrame(animate)
        time += 0.016

        uniforms.uTime.value = time

        updateTouchTexture()

        renderer.render(scene, camera)
      }
      animate()

      function onResize() {
        if (!container) return
        const w = container.clientWidth
        const h = container.clientHeight
        const frustumSize = 250
        const aspect = w / h
        camera.left = -frustumSize * aspect / 2
        camera.right = frustumSize * aspect / 2
        camera.top = frustumSize / 2
        camera.bottom = -frustumSize / 2
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }

      function onMouse(e: MouseEvent) {
        mousePos = { x: e.clientX, y: e.clientY }
      }

      function onMouseLeave() {
        mousePos = null
      }

      function onTouch(e: TouchEvent) {
        if (e.touches.length > 0) {
          mousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }
      }

      window.addEventListener('resize', onResize)
      window.addEventListener('mousemove', onMouse)
      window.addEventListener('mouseleave', onMouseLeave)
      window.addEventListener('touchmove', onTouch)

      return () => {
        window.removeEventListener('resize', onResize)
        window.removeEventListener('mousemove', onMouse)
        window.removeEventListener('mouseleave', onMouseLeave)
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
