"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function VisualEffects() {
  const [effects, setEffects] = useState<
    Array<{
      id: number
      type: string
      x: number
      y: number
    }>
  >([])

  useEffect(() => {
    // Create random visual effects
    const interval = setInterval(() => {
      const newEffect = {
        id: Date.now(),
        type: Math.random() > 0.5 ? "spark" : "glow",
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      }

      setEffects((prev) => [...prev, newEffect])

      // Remove effect after animation
      setTimeout(() => {
        setEffects((prev) => prev.filter((effect) => effect.id !== newEffect.id))
      }, 3000)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-5">
      <AnimatePresence>
        {effects.map((effect) => (
          <motion.div
            key={effect.id}
            className={`absolute w-4 h-4 ${
              effect.type === "spark" ? "bg-yellow-400 rounded-full" : "bg-purple-500 rounded-full blur-sm"
            }`}
            style={{ left: effect.x, top: effect.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: effect.y - 100,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      {/* Ambient light effects */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-500/5 via-transparent to-transparent animate-pulse" />
      <div
        className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent animate-pulse"
        style={{ animationDelay: "1s" }}
      />
    </div>
  )
}
