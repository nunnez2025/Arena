"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Sword, Star, Zap } from "lucide-react"

export function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [currentTip, setCurrentTip] = useState(0)

  const tips = [
    "Combine diferentes habilidades para criar combos devastadores!",
    "NFTs raros podem ser encontrados derrotando chefes épicos!",
    "Use a Shadow Forge para criar armas lendárias!",
    "Explore o Cosmic Adventure para descobrir novos mundos!",
    "Colete SHADOW tokens para desbloquear conteúdo exclusivo!",
  ]

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + Math.random() * 3 + 1
      })
    }, 100)

    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length)
    }, 2000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(tipInterval)
    }
  }, [tips.length])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center z-50">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="text-center z-10">
        {/* Animated Logo */}
        <motion.div
          className="mb-8"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Sword className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Game das Sombras
        </motion.h1>

        <motion.p
          className="text-xl text-gray-300 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Shadow Arena
        </motion.p>

        {/* Progress Bar */}
        <div className="w-80 mx-auto mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Carregando...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Loading Icons */}
        <div className="flex justify-center space-x-8 mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Star className="w-8 h-8 text-yellow-400" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Zap className="w-8 h-8 text-blue-400" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Sword className="w-8 h-8 text-purple-400" />
          </motion.div>
        </div>

        {/* Tips */}
        <motion.div
          key={currentTip}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-gray-400 text-sm max-w-md mx-auto"
        >
          💡 {tips[currentTip]}
        </motion.div>
      </div>
    </div>
  )
}
