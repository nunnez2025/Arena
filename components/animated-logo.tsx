"use client"

import { motion } from "framer-motion"
import { Sword } from "lucide-react"

export function AnimatedLogo() {
  return (
    <motion.div
      className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center relative overflow-hidden"
      animate={{
        boxShadow: [
          "0 0 20px rgba(147, 51, 234, 0.5)",
          "0 0 40px rgba(59, 130, 246, 0.8)",
          "0 0 20px rgba(147, 51, 234, 0.5)",
        ],
      }}
      transition={{
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    >
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      >
        <Sword className="w-6 h-6 text-white" />
      </motion.div>

      {/* Animated background particles */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  )
}
