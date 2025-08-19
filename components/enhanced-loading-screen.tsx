"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Raven, Eye, Skull, Moon } from "lucide-react"

const loadingMessages = [
  "Despertando nas sombras etéreas...",
  "Fragmentos de memória se manifestam...",
  "O medalhão pulsa com energia ancestral...",
  "Sussurros ecoam pelos corredores vazios...",
  "A Arena das Sombras toma forma...",
  "O Guardião observa silenciosamente...",
  "Realidade e pesadelo se entrelaçam...",
  "Sua jornada pela escuridão começa..."
]

const poeQuotes = [
  "\"All that we see or seem is but a dream within a dream.\"",
  "\"I became insane, with long intervals of horrible sanity.\"",
  "\"The boundaries which divide Life from Death are at best shadowy and vague.\"",
  "\"Deep into that darkness peering, long I stood there wondering, fearing.\"",
  "\"Words have no power to impress the mind without the horror of reality.\""
]

export function EnhancedLoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [currentQuote, setCurrentQuote] = useState(0)
  const [showQuote, setShowQuote] = useState(false)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + Math.random() * 15 + 5
      })
    }, 400)

    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % loadingMessages.length)
    }, 800)

    const quoteInterval = setInterval(() => {
      setShowQuote(true)
      setTimeout(() => {
        setCurrentQuote(prev => (prev + 1) % poeQuotes.length)
        setShowQuote(false)
      }, 2000)
    }, 4000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
      clearInterval(quoteInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-purple-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_70%)]" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Main Loading Content */}
      <Card className="bg-gradient-to-br from-red-900/30 to-black/80 border-red-900/50 p-8 max-w-md w-full mx-4 backdrop-blur-sm relative z-10">
        <div className="text-center space-y-6">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-purple-800 rounded-full flex items-center justify-center animate-pulse">
                <Raven className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center animate-bounce">
                <Eye className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
              Arena das Sombras
            </h1>
            <p className="text-gray-400 text-sm">Um Conto de Desespero e Redenção</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <Progress 
              value={Math.min(progress, 100)} 
              className="h-3 bg-gray-800 border border-red-900/30" 
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Carregando...</span>
              <span>{Math.round(Math.min(progress, 100))}%</span>
            </div>
          </div>

          {/* Loading Message */}
          <div className="min-h-[2rem] flex items-center justify-center">
            <p className="text-gray-300 text-sm animate-fade-in">
              {loadingMessages[currentMessage]}
            </p>
          </div>

          {/* Poe Quote */}
          <div className="min-h-[4rem] flex items-center justify-center border-t border-red-900/30 pt-4">
            <div className={`transition-opacity duration-500 ${showQuote ? 'opacity-100' : 'opacity-50'}`}>
              <p className="text-gray-400 text-xs italic text-center leading-relaxed">
                {poeQuotes[currentQuote]}
              </p>
              <p className="text-gray-500 text-xs text-center mt-2">— Edgar Allan Poe</p>
            </div>
          </div>

          {/* Atmospheric Icons */}
          <div className="flex justify-center space-x-6 pt-4">
            <Skull className="w-4 h-4 text-gray-600 animate-pulse" style={{ animationDelay: '0s' }} />
            <Moon className="w-4 h-4 text-gray-600 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <Eye className="w-4 h-4 text-gray-600 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </Card>

      {/* Corner Decorations */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-red-900/30" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-red-900/30" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-red-900/30" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-red-900/30" />
    </div>
  )
}

