"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"

export function SoundManager() {
  const [isMuted, setIsMuted] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)

  useEffect(() => {
    // Initialize Web Audio API
    if (typeof window !== "undefined") {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)()
      setAudioContext(context)
    }
  }, [])

  const playSound = (frequency: number, duration: number, type: OscillatorType = "sine") => {
    if (!audioContext || isMuted) return

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    oscillator.type = type

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)
  }

  const playBattleSound = () => {
    playSound(440, 0.2, "square") // Attack sound
  }

  const playMagicSound = () => {
    playSound(660, 0.3, "sine") // Magic sound
  }

  const playVictorySound = () => {
    // Victory fanfare
    setTimeout(() => playSound(523, 0.2), 0)
    setTimeout(() => playSound(659, 0.2), 200)
    setTimeout(() => playSound(784, 0.4), 400)
  }

  // Expose sound functions globally
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).gameAudio = {
        playBattleSound,
        playMagicSound,
        playVictorySound,
      }
    }
  }, [audioContext, isMuted])

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsMuted(!isMuted)}
        className="bg-black/50 backdrop-blur-sm border-purple-500/30 text-white hover:bg-purple-500/20"
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </Button>
    </div>
  )
}
