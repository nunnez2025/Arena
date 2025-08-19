"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Eye, Heart, Brain, Raven, Skull, Moon, Feather } from "lucide-react"

interface PlayerState {
  hp: number
  mp: number
  sanity: number
  name: string
  level: number
  experience: number
  medallionFragments: number
}

interface NarrativeSystemProps {
  playerState: PlayerState
  setPlayerState: (state: PlayerState) => void
}

interface NarrativeChoice {
  id: string
  text: string
  sanityEffect: number
  hpEffect?: number
  mpEffect?: number
  consequence: string
  unlocks?: string[]
}

interface NarrativeEvent {
  id: string
  title: string
  description: string
  atmosphere: string
  choices: NarrativeChoice[]
  requiredSanity?: number
  isHallucination?: boolean
}

const narrativeEvents: NarrativeEvent[] = [
  {
    id: "awakening",
    title: "O Despertar",
    description: "Você desperta no Pátio da Entrada, cercado por pedras antigas cobertas de musgo. O ar é denso e carregado de uma melancolia palpável. Suas mãos tremem enquanto você examina o fragmento de medalhão - a única pista de sua identidade perdida.",
    atmosphere: "O silêncio é quebrado apenas pelo gotejar distante de água e pelo sussurro do vento através das pedras rachadas.",
    choices: [
      {
        id: "examine_medallion",
        text: "Examinar o medalhão mais de perto",
        sanityEffect: -5,
        consequence: "Visões fragmentadas de um passado sombrio invadem sua mente. Você vê rostos familiares, mas distorcidos pela dor.",
        unlocks: ["medallion_visions"]
      },
      {
        id: "explore_courtyard",
        text: "Explorar o pátio em busca de pistas",
        sanityEffect: -2,
        consequence: "Você encontra marcas estranhas nas pedras, como se garras tivessem arranhado a superfície ao longo de décadas.",
        unlocks: ["courtyard_secrets"]
      },
      {
        id: "call_out",
        text: "Gritar por ajuda",
        sanityEffect: -10,
        consequence: "Sua voz ecoa de volta distorcida, como se múltiplas vozes respondessem em uníssono. O eco parece zombar de seu desespero."
      }
    ]
  },
  {
    id: "first_whispers",
    title: "Os Primeiros Sussurros",
    description: "Enquanto caminha pelas Galerias Sussurrantes, você ouve vozes indistintas emanando das paredes. Não consegue distinguir as palavras, mas o tom é de lamento e súplica.",
    atmosphere: "As paredes parecem pulsar com uma vida própria, e sombras se movem nos cantos de sua visão.",
    choices: [
      {
        id: "listen_whispers",
        text: "Aproximar-se da parede e tentar ouvir",
        sanityEffect: -8,
        consequence: "As vozes se tornam mais claras. Você ouve nomes sendo chamados, promessas quebradas e confissões de culpa.",
        unlocks: ["wall_voices"]
      },
      {
        id: "ignore_whispers",
        text: "Ignorar os sussurros e seguir em frente",
        sanityEffect: -3,
        consequence: "Você tenta bloquear os sons, mas eles parecem seguí-lo, crescendo em intensidade a cada passo.",
        unlocks: ["persistent_voices"]
      },
      {
        id: "respond_whispers",
        text: "Responder aos sussurros",
        sanityEffect: -15,
        consequence: "Ao falar, as vozes param abruptamente. O silêncio que se segue é mais perturbador que os sussurros."
      }
    ]
  },
  {
    id: "mirror_encounter",
    title: "O Salão dos Espelhos Quebrados",
    description: "Você entra em uma vasta câmara repleta de espelhos rachados. Cada fragmento reflete uma versão diferente de você - algumas mais jovens, outras envelhecidas pela dor, todas carregando o peso de segredos não ditos.",
    atmosphere: "A luz da lua filtra através de vitrais quebrados, criando padrões caleidoscópicos no chão de mármore.",
    choices: [
      {
        id: "stare_mirrors",
        text: "Contemplar seu reflexo nos espelhos",
        sanityEffect: -12,
        consequence: "Você vê memórias fragmentadas: um amor perdido, uma traição, um momento de covardia que definiu seu destino.",
        unlocks: ["memory_fragments"]
      },
      {
        id: "break_mirror",
        text: "Quebrar um dos espelhos com o punho",
        sanityEffect: -5,
        hpEffect: -10,
        consequence: "O vidro se estilhaça, cortando sua mão. Mas no sangue que escorre, você vê símbolos antigos se formando.",
        unlocks: ["blood_symbols"]
      },
      {
        id: "avoid_mirrors",
        text: "Atravessar a sala evitando olhar os espelhos",
        sanityEffect: -2,
        consequence: "Mesmo sem olhar diretamente, você sente os reflexos te observando, julgando cada movimento."
      }
    ]
  },
  {
    id: "raven_encounter",
    title: "O Guardião Silencioso",
    description: "Um corvo gigantesco pousa diante de você, seus olhos contendo a sabedoria de eras e as dores de incontáveis almas. Ele não fala, mas sua presença é um lembrete da inevitabilidade do destino.",
    atmosphere: "O ar se torna mais denso, e você sente o peso de um olhar ancestral sobre você.",
    requiredSanity: 50,
    choices: [
      {
        id: "approach_raven",
        text: "Aproximar-se do corvo",
        sanityEffect: 5,
        consequence: "O corvo inclina a cabeça, como se reconhecesse algo em você. Por um momento, você sente uma estranha paz.",
        unlocks: ["raven_blessing"]
      },
      {
        id: "speak_raven",
        text: "Tentar falar com o corvo",
        sanityEffect: -3,
        consequence: "Suas palavras ecoam no vazio. O corvo permanece imóvel, mas você sente que ele compreende mais do que aparenta."
      },
      {
        id: "flee_raven",
        text: "Recuar com medo",
        sanityEffect: -8,
        consequence: "Você se afasta, mas sente que perdeu uma oportunidade importante. O corvo observa sua partida com o que parece ser decepção."
      }
    ]
  },
  {
    id: "sanity_hallucination",
    title: "Visões da Loucura",
    description: "Sua mente fragmentada conjura visões perturbadoras. Você vê figuras espectrais dançando em círculos, ouve risadas maníacas ecoando de lugares vazios, e sente mãos invisíveis tocando seus ombros.",
    atmosphere: "A realidade se distorce ao seu redor. As paredes respiram, o chão ondula como água, e o tempo parece se mover em câmera lenta.",
    requiredSanity: 30,
    isHallucination: true,
    choices: [
      {
        id: "embrace_madness",
        text: "Abraçar as visões e dançar com os espectros",
        sanityEffect: -20,
        consequence: "Você se junta à dança macabra. Por um momento, sente uma liberdade terrível, livre das amarras da razão.",
        unlocks: ["madness_dance"]
      },
      {
        id: "fight_visions",
        text: "Lutar contra as alucinações",
        sanityEffect: 10,
        mpEffect: -15,
        consequence: "Com grande esforço mental, você consegue dissipar as visões. A realidade retorna, mas você se sente exausto."
      },
      {
        id: "analyze_visions",
        text: "Tentar analisar racionalmente as visões",
        sanityEffect: -5,
        consequence: "Você percebe padrões nas alucinações - elas não são aleatórias, mas reflexos de seus medos mais profundos."
      }
    ]
  }
]

export function NarrativeSystem({ playerState, setPlayerState }: NarrativeSystemProps) {
  const [currentEvent, setCurrentEvent] = useState<NarrativeEvent>(narrativeEvents[0])
  const [eventHistory, setEventHistory] = useState<string[]>([])
  const [unlockedEvents, setUnlockedEvents] = useState<string[]>(["awakening"])
  const [isTyping, setIsTyping] = useState(false)

  const handleChoice = (choice: NarrativeChoice) => {
    setIsTyping(true)
    
    // Apply effects
    const newState = {
      ...playerState,
      sanity: Math.max(0, Math.min(100, playerState.sanity + choice.sanityEffect)),
      hp: choice.hpEffect ? Math.max(0, Math.min(100, playerState.hp + choice.hpEffect)) : playerState.hp,
      mp: choice.mpEffect ? Math.max(0, Math.min(100, playerState.mp + choice.mpEffect)) : playerState.mp,
    }
    
    setPlayerState(newState)
    
    // Add to history
    setEventHistory(prev => [...prev, `${currentEvent.title}: ${choice.text} - ${choice.consequence}`])
    
    // Unlock new events
    if (choice.unlocks) {
      setUnlockedEvents(prev => [...prev, ...choice.unlocks!])
    }
    
    // Determine next event based on sanity and unlocked events
    setTimeout(() => {
      let nextEvent = narrativeEvents[0] // Default fallback
      
      if (newState.sanity <= 30 && unlockedEvents.includes("sanity_hallucination")) {
        nextEvent = narrativeEvents.find(e => e.id === "sanity_hallucination") || narrativeEvents[0]
      } else if (newState.sanity >= 50 && unlockedEvents.includes("raven_encounter")) {
        nextEvent = narrativeEvents.find(e => e.id === "raven_encounter") || narrativeEvents[0]
      } else if (unlockedEvents.includes("mirror_encounter")) {
        nextEvent = narrativeEvents.find(e => e.id === "mirror_encounter") || narrativeEvents[0]
      } else if (unlockedEvents.includes("first_whispers")) {
        nextEvent = narrativeEvents.find(e => e.id === "first_whispers") || narrativeEvents[0]
      } else {
        // Get next available event
        const availableEvents = narrativeEvents.filter(e => 
          unlockedEvents.includes(e.id) && 
          (!e.requiredSanity || newState.sanity >= e.requiredSanity)
        )
        nextEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)] || narrativeEvents[0]
      }
      
      setCurrentEvent(nextEvent)
      setIsTyping(false)
    }, 2000)
  }

  const getSanityDescription = (sanity: number) => {
    if (sanity >= 80) return "Mente Lúcida - Você mantém controle sobre seus pensamentos"
    if (sanity >= 60) return "Levemente Perturbado - Pequenas distorções na percepção"
    if (sanity >= 40) return "Mentalmente Abalado - Alucinações ocasionais"
    if (sanity >= 20) return "À Beira da Loucura - A realidade se torna incerta"
    return "Loucura Completa - Perdido no abismo da mente"
  }

  return (
    <div className="space-y-6">
      {/* Player Status */}
      <Card className="bg-gradient-to-br from-red-900/30 to-purple-900/30 border-red-900/30 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            <Progress 
              value={playerState.sanity} 
              className={`h-2 ${playerState.sanity < 30 ? 'bg-red-900' : playerState.sanity < 60 ? 'bg-yellow-900' : 'bg-purple-900'}`} 
            />
          </div>
        </div>
        <div className="text-center">
          <Badge 
            variant="outline" 
            className={`${
              playerState.sanity < 30 ? 'border-red-500 text-red-400' : 
              playerState.sanity < 60 ? 'border-yellow-500 text-yellow-400' : 
              'border-purple-500 text-purple-400'
            }`}
          >
            {getSanityDescription(playerState.sanity)}
          </Badge>
        </div>
      </Card>

      {/* Current Narrative Event */}
      <Card className="bg-gradient-to-br from-black/80 to-red-900/20 border-red-900/30 p-8">
        <div className="flex items-center mb-4">
          {currentEvent.isHallucination ? (
            <Eye className="w-6 h-6 text-purple-400 mr-3" />
          ) : (
            <BookOpen className="w-6 h-6 text-red-400 mr-3" />
          )}
          <h2 className="text-2xl font-heading font-bold text-white">
            {currentEvent.title}
          </h2>
          {currentEvent.isHallucination && (
            <Badge className="ml-3 bg-purple-600/80">Alucinação</Badge>
          )}
        </div>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-300 leading-relaxed text-lg">
            {currentEvent.description}
          </p>
          <p className="text-gray-400 italic border-l-2 border-red-900/50 pl-4">
            {currentEvent.atmosphere}
          </p>
        </div>

        {/* Choices */}
        {!isTyping ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-3">Como você responde?</h3>
            {currentEvent.choices.map((choice) => (
              <Button
                key={choice.id}
                variant="outline"
                className="w-full text-left justify-start h-auto p-4 border-red-900/30 hover:bg-red-900/20 hover:border-red-700/50"
                onClick={() => handleChoice(choice)}
                disabled={currentEvent.requiredSanity && playerState.sanity < currentEvent.requiredSanity}
              >
                <div className="flex flex-col items-start">
                  <span className="text-white font-medium">{choice.text}</span>
                  <div className="flex items-center mt-1 space-x-2">
                    {choice.sanityEffect !== 0 && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          choice.sanityEffect > 0 ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'
                        }`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {choice.sanityEffect > 0 ? '+' : ''}{choice.sanityEffect}
                      </Badge>
                    )}
                    {choice.hpEffect && (
                      <Badge variant="outline" className="text-xs border-red-500 text-red-400">
                        <Heart className="w-3 h-3 mr-1" />
                        {choice.hpEffect > 0 ? '+' : ''}{choice.hpEffect}
                      </Badge>
                    )}
                    {choice.mpEffect && (
                      <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                        <Brain className="w-3 h-3 mr-1" />
                        {choice.mpEffect > 0 ? '+' : ''}{choice.mpEffect}
                      </Badge>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-pulse">
              <Feather className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-gray-400">As consequências de sua escolha se manifestam...</p>
            </div>
          </div>
        )}
      </Card>

      {/* Event History */}
      {eventHistory.length > 0 && (
        <Card className="bg-gradient-to-br from-gray-900/50 to-black/50 border-gray-700/30 p-6">
          <h3 className="text-lg font-heading font-bold mb-4 flex items-center">
            <Skull className="w-5 h-5 mr-2 text-gray-400" />
            Memórias Fragmentadas
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {eventHistory.slice(-5).map((event, index) => (
              <p key={index} className="text-sm text-gray-400 border-l-2 border-gray-700/50 pl-3">
                {event}
              </p>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

