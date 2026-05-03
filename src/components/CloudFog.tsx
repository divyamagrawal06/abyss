'use client'

import { useEffect, useRef } from 'react'

// Smoke texture from the original project reference
const SMOKE_URL = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/95637/Smoke-Element.png'
const PUFF_COUNT = 72

interface Puff {
  x: number
  y: number
  size: number
  vx: number
  vy: number
  baseVx: number
  baseVy: number
  rot: number
  rotSpeed: number
  alpha: number
}

function spawnPuff(W: number, H: number, fromEdge = false): Puff {
  const size = 280 + Math.random() * 480

  let x: number, y: number
  if (fromEdge) {
    const side = Math.floor(Math.random() * 3) // top, left, right — never bottom
    if (side === 0) { x = Math.random() * W; y = -size / 2 }
    else if (side === 1) { x = -size / 2; y = Math.random() * H * 0.75 }
    else { x = W + size / 2; y = Math.random() * H * 0.75 }
  } else {
    // Initial placement: bias heavily toward top two-thirds
    x = Math.random() * W
    y = Math.random() * H * 0.7
  }

  const bvx = (Math.random() - 0.5) * 0.28
  const bvy = (Math.random() - 0.5) * 0.12 - 0.04 // very slight upward drift

  return {
    x, y, size,
    vx: bvx, vy: bvy,
    baseVx: bvx, baseVy: bvy,
    rot: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 0.07,
    alpha: 0.035 + Math.random() * 0.075,
  }
}

export function CloudFog() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    let W = canvas.offsetWidth
    let H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = SMOKE_URL
    let imgLoaded = false
    img.onload = () => { imgLoaded = true }
    img.onerror = () => { /* silently skip if texture fails to load */ }

    let mx = W / 2
    let my = -200 // start off-screen so mouse doesn't push on load
    let pmx = mx
    let pmy = my

    let puffs: Puff[] = Array.from({ length: PUFF_COUNT }, () => spawnPuff(W, H, false))
    let raf: number

    function draw() {
      ctx.clearRect(0, 0, W, H)

      if (imgLoaded) {
        const dvx = mx - pmx
        const dvy = my - pmy
        pmx = mx
        pmy = my

        for (const p of puffs) {
          // Mouse repulsion
          const dx = mx - p.x
          const dy = my - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const radius = 200 + Math.sqrt(dvx * dvx + dvy * dvy) * 3
          if (dist < radius && dist > 0) {
            const force = ((radius - dist) / radius) * 0.006
            const ang = Math.atan2(dy, dx)
            p.vx -= Math.cos(ang) * force
            p.vy -= Math.sin(ang) * force
          }

          // Return to base velocity (friction)
          p.vx = p.vx * 0.97 + p.baseVx * 0.03
          p.vy = p.vy * 0.97 + p.baseVy * 0.03
          p.x += p.vx
          p.y += p.vy
          p.rot += p.rotSpeed

          // Vertical opacity fade: full above 55% height, fade out by 80%
          const yRatio = p.y / H
          let yFade: number
          if (yRatio <= 0.55) {
            yFade = 1
          } else if (yRatio <= 0.80) {
            yFade = 1 - (yRatio - 0.55) / 0.25
          } else {
            yFade = 0
          }

          if (yFade <= 0.01) continue

          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate((p.rot * Math.PI) / 180)
          ctx.globalAlpha = p.alpha * yFade
          ctx.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size)
          ctx.restore()
        }

        // Cull off-screen puffs; replace from edges
        const buffer = 600
        puffs = puffs.filter(p =>
          p.x > -buffer && p.x < W + buffer &&
          p.y > -buffer && p.y < H * 0.9
        )
        while (puffs.length < PUFF_COUNT) {
          puffs.push(spawnPuff(W, H, true))
        }
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    const onMouse = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    const onResize = () => {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W
      canvas.height = H
    }

    window.addEventListener('mousemove', onMouse, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full pointer-events-none select-none"
      style={{
        height: '80vh',
        zIndex: 0,
        mixBlendMode: 'screen',
        opacity: 0.52,
      }}
      aria-hidden="true"
    />
  )
}
