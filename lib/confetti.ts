"use client"

import confetti from "canvas-confetti"

/**
 * Fires a full-screen celebratory confetti burst!
 */
export function fireCelebrationConfetti() {
  const count = 200
  const defaults = {
    origin: { y: 0.7 }
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    })
  }

  // Multi-stage fireworks-style explosion
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ["#10B981", "#1B4332", "#F59E0B"]
  })
  fire(0.2, {
    spread: 60,
    colors: ["#F59E0B", "#FBBF24", "#34D399"]
  })
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ["#10B981", "#059669", "#F59E0B"]
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ["#F59E0B", "#10B981", "#6366F1"]
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ["#10B981", "#F59E0B", "#EC4899"]
  })
}

/**
 * Fires a full-screen side cannon confetti burst (left & right cannons).
 */
export function fireCannonConfetti() {
  const duration = 2.5 * 1000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ["#10B981", "#F59E0B", "#1B4332", "#FBBF24"]
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ["#10B981", "#F59E0B", "#1B4332", "#34D399"]
    })
  }, 250)
}
