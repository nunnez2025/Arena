"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX, Play, Pause, Music, Headphones } from "lucide-react"

interface AudioManagerProps {
  playerSanity: number
  currentScene: "entrance" | "narrative" | "battle" | "victory" | "defeat"
  isPlaying?: boolean
}

interface AudioTrack {
  id: string
  name: string
  src: string
  volume: number
  loop: boolean
  fadeIn?: boolean
  fadeOut?: boolean
  sanityTrigger?: number // Sanity level that triggers this audio
  sceneSpecific?: string[]
}

const audioTracks: AudioTrack[] = [
  {
    id: "intro_narration",
    name: "Narração de Introdução",
    src: "/audio/intro-narration.wav",
    volume: 0.8,
    loop: false,
    sceneSpecific: ["entrance"]
  },
  {
    id: "whispers_madness",
    name: "Sussurros da Loucura",
    src: "/audio/whispers-madness.wav",
    volume: 0.6,
    loop: true,
    sanityTrigger: 30,
    fadeIn: true
  },
  {
    id: "raven_guardian",
    name: "Guardião Corvo",
    src: "/audio/raven-guardian.wav",
    volume: 0.9,
    loop: false,
    sceneSpecific: ["narrative"]
  }
]

// Simulated ambient sounds (in a real implementation, these would be actual audio files)
const ambientSounds = {
  wind: "Som de vento uivante através de corredores vazios",
  footsteps: "Passos ecoando em pedra antiga",
  chains: "Arrastar de correntes distantes",
  heartbeat: "Batimento cardíaco acelerado",
  dripping: "Gotejamento constante de água",
  whispers: "Sussurros indistintos nas sombras",
  ravens: "Grasnidos de corvos ao longe",
  bells: "Sinos de igreja distantes e melancólicos"
}

export function AudioManager({ playerSanity, currentScene, isPlaying = true }: AudioManagerProps) {
  const [masterVolume, setMasterVolume] = useState(0.7)
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [sfxVolume, setSfxVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [activeAmbientSounds, setActiveAmbientSounds] = useState<string[]>([])
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})

  // Initialize audio elements
  useEffect(() => {
    audioTracks.forEach(track => {
      if (!audioRefs.current[track.id]) {
        const audio = new Audio(track.src)
        audio.loop = track.loop
        audio.volume = track.volume * masterVolume
        audioRefs.current[track.id] = audio
        
        // Handle audio loading errors gracefully
        audio.addEventListener('error', () => {
          console.warn(`Could not load audio: ${track.src}`)
        })
      }
    })

    return () => {
      // Cleanup audio elements
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause()
        audio.currentTime = 0
      })
    }
  }, [masterVolume])

  // Update volumes when sliders change
  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      const track = audioTracks.find(t => t.id === id)
      if (track) {
        audio.volume = isMuted ? 0 : track.volume * masterVolume * musicVolume
      }
    })
  }, [masterVolume, musicVolume, sfxVolume, isMuted])

  // Handle sanity-based audio triggers
  useEffect(() => {
    const sanityTriggeredTracks = audioTracks.filter(track => 
      track.sanityTrigger && playerSanity <= track.sanityTrigger
    )

    sanityTriggeredTracks.forEach(track => {
      const audio = audioRefs.current[track.id]
      if (audio && audio.paused && isPlaying) {
        audio.play().catch(e => console.warn(`Could not play ${track.id}:`, e))
        setCurrentTrack(track.id)
      }
    })

    // Stop sanity-triggered tracks if sanity improves
    audioTracks.forEach(track => {
      if (track.sanityTrigger && playerSanity > track.sanityTrigger) {
        const audio = audioRefs.current[track.id]
        if (audio && !audio.paused) {
          audio.pause()
          if (currentTrack === track.id) {
            setCurrentTrack(null)
          }
        }
      }
    })
  }, [playerSanity, isPlaying, currentTrack])

  // Handle scene-specific audio
  useEffect(() => {
    const sceneSpecificTracks = audioTracks.filter(track =>
      track.sceneSpecific && track.sceneSpecific.includes(currentScene)
    )

    // Stop all non-scene-specific tracks
    audioTracks.forEach(track => {
      if (track.sceneSpecific && !track.sceneSpecific.includes(currentScene)) {
        const audio = audioRefs.current[track.id]
        if (audio && !audio.paused) {
          audio.pause()
        }
      }
    })

    // Play scene-specific tracks
    sceneSpecificTracks.forEach(track => {
      const audio = audioRefs.current[track.id]
      if (audio && audio.paused && isPlaying) {
        audio.play().catch(e => console.warn(`Could not play ${track.id}:`, e))
        setCurrentTrack(track.id)
      }
    })
  }, [currentScene, isPlaying])

  // Update ambient sounds based on sanity
  useEffect(() => {
    let newAmbientSounds: string[] = []

    if (playerSanity >= 80) {
      newAmbientSounds = ["wind", "footsteps"]
    } else if (playerSanity >= 60) {
      newAmbientSounds = ["wind", "footsteps", "dripping"]
    } else if (playerSanity >= 40) {
      newAmbientSounds = ["wind", "footsteps", "dripping", "whispers"]
    } else if (playerSanity >= 20) {
      newAmbientSounds = ["wind", "footsteps", "dripping", "whispers", "chains", "heartbeat"]
    } else {
      newAmbientSounds = ["wind", "footsteps", "dripping", "whispers", "chains", "heartbeat", "ravens", "bells"]
    }

    setActiveAmbientSounds(newAmbientSounds)
  }, [playerSanity])

  const playTrack = (trackId: string) => {
    const audio = audioRefs.current[trackId]
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(e => console.warn(`Could not play ${trackId}:`, e))
      setCurrentTrack(trackId)
    }
  }

  const stopTrack = (trackId: string) => {
    const audio = audioRefs.current[trackId]
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      if (currentTrack === trackId) {
        setCurrentTrack(null)
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const getSanityAudioDescription = (sanity: number) => {
    if (sanity >= 80) return "Ambiente calmo com sons naturais"
    if (sanity >= 60) return "Leves distorções começam a aparecer"
    if (sanity >= 40) return "Sussurros e ecos perturbadores"
    if (sanity >= 20) return "Cacofonia de sons aterrorizantes"
    return "Colapso auditivo completo - realidade fragmentada"
  }

  return (
    <div className="space-y-6">
      {/* Audio Status */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-black/50 border-purple-900/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-heading font-bold flex items-center">
            <Headphones className="w-6 h-6 mr-2 text-purple-400" />
            Sistema de Áudio Atmosférico
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
            className={`${isMuted ? 'border-red-500 text-red-400' : 'border-purple-500 text-purple-400'}`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>

        <div className="space-y-4">
          {/* Volume Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Volume Geral</label>
              <Slider
                value={[masterVolume * 100]}
                onValueChange={(value) => setMasterVolume(value[0] / 100)}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{Math.round(masterVolume * 100)}%</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Música</label>
              <Slider
                value={[musicVolume * 100]}
                onValueChange={(value) => setMusicVolume(value[0] / 100)}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{Math.round(musicVolume * 100)}%</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Efeitos Sonoros</label>
              <Slider
                value={[sfxVolume * 100]}
                onValueChange={(value) => setSfxVolume(value[0] / 100)}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{Math.round(sfxVolume * 100)}%</span>
            </div>
          </div>

          {/* Current Audio Status */}
          <div className="border-t border-purple-900/30 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Estado Atual:</span>
              <Badge className={`${
                playerSanity >= 60 ? 'bg-green-600' : 
                playerSanity >= 30 ? 'bg-yellow-600' : 
                'bg-red-600'
              }`}>
                Sanidade: {playerSanity}%
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              {getSanityAudioDescription(playerSanity)}
            </p>
            
            {currentTrack && (
              <div className="flex items-center space-x-2">
                <Music className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">
                  Tocando: {audioTracks.find(t => t.id === currentTrack)?.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Manual Audio Controls */}
      <Card className="bg-gradient-to-br from-gray-900/50 to-purple-900/20 border-gray-700/30 p-6">
        <h4 className="text-lg font-heading font-bold mb-4">Controles Manuais de Áudio</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {audioTracks.map((track) => (
            <div key={track.id} className="flex items-center justify-between p-3 bg-black/30 rounded border border-gray-700/30">
              <div>
                <span className="text-sm font-medium text-white">{track.name}</span>
                <div className="flex space-x-1 mt-1">
                  {track.loop && <Badge variant="outline" className="text-xs">Loop</Badge>}
                  {track.sanityTrigger && (
                    <Badge variant="outline" className="text-xs text-purple-400">
                      Sanidade ≤ {track.sanityTrigger}
                    </Badge>
                  )}
                  {track.sceneSpecific && (
                    <Badge variant="outline" className="text-xs text-blue-400">
                      Cena específica
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playTrack(track.id)}
                  disabled={currentTrack === track.id}
                >
                  <Play className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => stopTrack(track.id)}
                  disabled={currentTrack !== track.id}
                >
                  <Pause className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Ambient Sounds Visualization */}
      <Card className="bg-gradient-to-br from-black/80 to-gray-900/50 border-gray-700/30 p-6">
        <h4 className="text-lg font-heading font-bold mb-4">Sons Ambientes Ativos</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(ambientSounds).map(([key, description]) => (
            <div
              key={key}
              className={`p-2 rounded text-center text-xs transition-all duration-300 ${
                activeAmbientSounds.includes(key)
                  ? 'bg-purple-600/50 border border-purple-400/50 text-purple-100'
                  : 'bg-gray-800/50 border border-gray-600/30 text-gray-400'
              }`}
            >
              <div className="font-medium capitalize">{key}</div>
              <div className="text-xs mt-1 opacity-75">{description}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 italic">
          * Os sons ambientes se intensificam conforme sua sanidade diminui
        </p>
      </Card>
    </div>
  )
}

