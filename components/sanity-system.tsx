"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Eye, Brain, Heart, Skull, Moon, Zap, Shield, Sparkles } from "lucide-react"

interface PlayerState {
  hp: number
  mp: number
  sanity: number
  name: string
  level: number
  experience: number
  medallionFragments: number
}

interface SanitySystemProps {
  playerState: PlayerState
  setPlayerState: (state: PlayerState) => void
}

interface SanityEffect {
  id: string
  name: string
  description: string
  threshold: number
  visualEffect: string
  gameplayEffect: string
}

const sanityEffects: SanityEffect[] = [
  {
    id: "lucid",
    name: "Mente Lúcida",
    description: "Sua mente está clara e focada. Você vê a realidade como ela é.",
    threshold: 80,
    visualEffect: "Visão normal, cores vibrantes",
    gameplayEffect: "+10% precisão, +5% chance crítica"
  },
  {
    id: "slightly_disturbed",
    name: "Levemente Perturbado",
    description: "Pequenas distorções começam a afetar sua percepção.",
    threshold: 60,
    visualEffect: "Leve aberração cromática, sussurros ocasionais",
    gameplayEffect: "-5% precisão"
  },
  {
    id: "mentally_shaken",
    name: "Mentalmente Abalado",
    description: "Alucinações ocasionais e vozes distorcidas perturbam sua concentração.",
    threshold: 40,
    visualEffect: "Distorções visuais, vultos periféricos",
    gameplayEffect: "-10% precisão, -5% defesa"
  },
  {
    id: "edge_of_madness",
    name: "À Beira da Loucura",
    description: "A realidade se torna incerta. Você luta para distinguir o real do imaginário.",
    threshold: 20,
    visualEffect: "Alucinações intensas, interface distorcida",
    gameplayEffect: "-20% precisão, -10% defesa, chance de falha crítica"
  },
  {
    id: "complete_madness",
    name: "Loucura Completa",
    description: "Perdido no abismo da mente, você sucumbiu à escuridão total.",
    threshold: 0,
    visualEffect: "Colapso visual completo, realidade fragmentada",
    gameplayEffect: "Ações imprevisíveis, pode atacar aliados"
  }
]

interface SanityAction {
  id: string
  name: string
  description: string
  sanityEffect: number
  mpCost?: number
  hpCost?: number
  cooldown: number
  type: "restoration" | "meditation" | "risk"
}

const sanityActions: SanityAction[] = [
  {
    id: "deep_meditation",
    name: "Meditação Profunda",
    description: "Concentre-se em sua respiração e tente encontrar paz interior.",
    sanityEffect: 15,
    mpCost: 10,
    cooldown: 3,
    type: "meditation"
  },
  {
    id: "memory_fragment",
    name: "Examinar Fragmento de Memória",
    description: "Analise uma lembrança do passado, arriscando sua sanidade por conhecimento.",
    sanityEffect: -10,
    cooldown: 2,
    type: "risk"
  },
  {
    id: "medallion_focus",
    name: "Focar no Medalhão",
    description: "Use o medalhão como âncora para a realidade.",
    sanityEffect: 8,
    mpCost: 5,
    cooldown: 2,
    type: "restoration"
  },
  {
    id: "embrace_darkness",
    name: "Abraçar a Escuridão",
    description: "Aceite temporariamente a loucura para ganhar poder.",
    sanityEffect: -20,
    mpCost: -15,
    cooldown: 5,
    type: "risk"
  },
  {
    id: "rational_analysis",
    name: "Análise Racional",
    description: "Use a lógica para dissipar ilusões e alucinações.",
    sanityEffect: 12,
    mpCost: 15,
    cooldown: 4,
    type: "meditation"
  },
  {
    id: "self_harm",
    name: "Dor Física",
    description: "Use dor física para se manter ancorado à realidade.",
    sanityEffect: 5,
    hpCost: 15,
    cooldown: 1,
    type: "restoration"
  }
]

export function SanitySystem({ playerState, setPlayerState }: SanitySystemProps) {
  const [actionCooldowns, setActionCooldowns] = useState<Record<string, number>>({})
  const [hallucinationText, setHallucinationText] = useState("")
  const [isHallucinating, setIsHallucinating] = useState(false)

  const currentSanityEffect = sanityEffects.find(effect => 
    playerState.sanity >= effect.threshold
  ) || sanityEffects[sanityEffects.length - 1]

  // Hallucination effects based on sanity level
  useEffect(() => {
    const hallucinationTexts = [
      "Você ouve sussurros vindos das paredes...",
      "Sombras se movem nos cantos de sua visão...",
      "Uma risada distante ecoa pelos corredores...",
      "Você sente mãos invisíveis tocando seus ombros...",
      "O chão parece ondular como água...",
      "Rostos familiares aparecem e desaparecem nas sombras...",
      "Você ouve seu próprio nome sendo chamado...",
      "As paredes parecem respirar...",
      "Corvos inexistentes grasnam ao seu redor...",
      "Você vê palavras escritas em sangue que não existem..."
    ]

    if (playerState.sanity < 40) {
      const interval = setInterval(() => {
        setIsHallucinating(true)
        setHallucinationText(hallucinationTexts[Math.floor(Math.random() * hallucinationTexts.length)])
        setTimeout(() => setIsHallucinating(false), 3000)
      }, 8000 + Math.random() * 5000)

      return () => clearInterval(interval)
    }
  }, [playerState.sanity])

  // Cooldown management
  useEffect(() => {
    const interval = setInterval(() => {
      setActionCooldowns(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(key => {
          if (updated[key] > 0) {
            updated[key] -= 1
          }
        })
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleSanityAction = (action: SanityAction) => {
    if (actionCooldowns[action.id] > 0) return
    
    const newState = {
      ...playerState,
      sanity: Math.max(0, Math.min(100, playerState.sanity + action.sanityEffect)),
      mp: action.mpCost ? Math.max(0, playerState.mp - action.mpCost) : playerState.mp,
      hp: action.hpCost ? Math.max(0, playerState.hp - action.hpCost) : playerState.hp
    }
    
    // Add MP if negative cost (gain)
    if (action.mpCost && action.mpCost < 0) {
      newState.mp = Math.min(100, playerState.mp + Math.abs(action.mpCost))
    }
    
    setPlayerState(newState)
    setActionCooldowns(prev => ({ ...prev, [action.id]: action.cooldown }))
  }

  const canUseAction = (action: SanityAction) => {
    if (actionCooldowns[action.id] > 0) return false
    if (action.mpCost && playerState.mp < action.mpCost) return false
    if (action.hpCost && playerState.hp <= action.hpCost) return false
    return true
  }

  const getSanityColor = (sanity: number) => {
    if (sanity >= 80) return "text-green-400"
    if (sanity >= 60) return "text-yellow-400"
    if (sanity >= 40) return "text-orange-400"
    if (sanity >= 20) return "text-red-400"
    return "text-red-600"
  }

  const getSanityBgColor = (sanity: number) => {
    if (sanity >= 80) return "from-green-900/30 to-blue-900/30"
    if (sanity >= 60) return "from-yellow-900/30 to-green-900/30"
    if (sanity >= 40) return "from-orange-900/30 to-yellow-900/30"
    if (sanity >= 20) return "from-red-900/30 to-orange-900/30"
    return "from-red-900/50 to-black/50"
  }

  return (
    <div className="space-y-6">
      {/* Hallucination Overlay */}
      {isHallucinating && (
        <Card className="bg-red-900/80 border-red-500 p-4 animate-pulse">
          <div className="flex items-center">
            <Eye className="w-5 h-5 text-red-300 mr-2" />
            <p className="text-red-100 italic">{hallucinationText}</p>
          </div>
        </Card>
      )}

      {/* Current Sanity Status */}
      <Card className={`bg-gradient-to-br ${getSanityBgColor(playerState.sanity)} border-red-900/30 p-6`}>
        <div className="flex items-center mb-4">
          <Eye className={`w-8 h-8 mr-3 ${getSanityColor(playerState.sanity)}`} />
          <div className="flex-1">
            <h2 className="text-2xl font-heading font-bold text-white">
              {currentSanityEffect.name}
            </h2>
            <p className="text-gray-300">{currentSanityEffect.description}</p>
          </div>
          <Badge className={`${getSanityColor(playerState.sanity)} bg-transparent border-current`}>
            {playerState.sanity}/100
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Sanidade</span>
              <span>{playerState.sanity}/100</span>
            </div>
            <Progress 
              value={playerState.sanity} 
              className={`h-3 ${
                playerState.sanity < 30 ? 'bg-red-900' : 
                playerState.sanity < 60 ? 'bg-yellow-900' : 
                'bg-green-900'
              }`} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-white flex items-center">
                <Sparkles className="w-4 h-4 mr-1" />
                Efeito Visual
              </h4>
              <p className="text-sm text-gray-300">{currentSanityEffect.visualEffect}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white flex items-center">
                <Zap className="w-4 h-4 mr-1" />
                Efeito de Jogabilidade
              </h4>
              <p className="text-sm text-gray-300">{currentSanityEffect.gameplayEffect}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Player Status */}
      <Card className="bg-gradient-to-br from-gray-900/50 to-black/50 border-gray-700/30 p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="flex items-center"><Heart className="w-4 h-4 mr-1 text-red-500" />Vida</span>
              <span>{playerState.hp}/100</span>
            </div>
            <Progress value={playerState.hp} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="flex items-center"><Brain className="w-4 h-4 mr-1 text-blue-500" />Magia</span>
              <span>{playerState.mp}/100</span>
            </div>
            <Progress value={playerState.mp} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="flex items-center"><Eye className="w-4 h-4 mr-1 text-purple-500" />Sanidade</span>
              <span>{playerState.sanity}/100</span>
            </div>
            <Progress value={playerState.sanity} className="h-2" />
          </div>
        </div>
      </Card>

      {/* Sanity Actions */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-black/50 border-purple-900/30 p-6">
        <h3 className="text-xl font-heading font-bold mb-4 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-purple-400" />
          Ações de Sanidade
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sanityActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={`h-auto p-4 text-left justify-start ${
                action.type === 'restoration' ? 'border-green-700/50 hover:bg-green-900/20' :
                action.type === 'meditation' ? 'border-blue-700/50 hover:bg-blue-900/20' :
                'border-red-700/50 hover:bg-red-900/20'
              } ${!canUseAction(action) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleSanityAction(action)}
              disabled={!canUseAction(action)}
            >
              <div className="flex flex-col items-start w-full">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="font-semibold text-white">{action.name}</span>
                  {actionCooldowns[action.id] > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {actionCooldowns[action.id]}s
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-300 mb-2">{action.description}</p>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      action.sanityEffect > 0 ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'
                    }`}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    {action.sanityEffect > 0 ? '+' : ''}{action.sanityEffect}
                  </Badge>
                  {action.mpCost && (
                    <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                      <Brain className="w-3 h-3 mr-1" />
                      {action.mpCost > 0 ? '-' : '+'}{Math.abs(action.mpCost)}
                    </Badge>
                  )}
                  {action.hpCost && (
                    <Badge variant="outline" className="text-xs border-red-500 text-red-400">
                      <Heart className="w-3 h-3 mr-1" />
                      -{action.hpCost}
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </Card>

      {/* Sanity Tips */}
      <Card className="bg-gradient-to-br from-gray-900/30 to-purple-900/20 border-gray-700/30 p-6">
        <h3 className="text-lg font-heading font-bold mb-4 flex items-center">
          <Skull className="w-5 h-5 mr-2 text-gray-400" />
          Guia de Sobrevivência Mental
        </h3>
        <div className="space-y-3 text-sm text-gray-300">
          <p>• <strong>Sanidade Alta (80+):</strong> Mente clara, bônus de precisão e chance crítica</p>
          <p>• <strong>Sanidade Média (40-79):</strong> Pequenas penalidades, alucinações ocasionais</p>
          <p>• <strong>Sanidade Baixa (20-39):</strong> Penalidades severas, interface distorcida</p>
          <p>• <strong>Sanidade Crítica (0-19):</strong> Risco de ações imprevisíveis, pode atacar aliados</p>
          <p>• <strong>Dica:</strong> Use meditação para recuperar sanidade, mas cuidado com ações arriscadas</p>
          <p>• <strong>Aviso:</strong> Algumas escolhas narrativas podem afetar permanentemente sua sanidade</p>
        </div>
      </Card>
    </div>
  )
}

