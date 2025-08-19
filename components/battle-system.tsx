"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sword, Shield, Eye, Heart, Brain, Skull, Zap, Moon, Raven } from "lucide-react"

interface PlayerState {
  hp: number
  mp: number
  sanity: number
  name: string
  level: number
  experience: number
  medallionFragments: number
}

interface BattleSystemProps {
  playerState: PlayerState
  setPlayerState: (state: PlayerState) => void
}

interface StatusEffect {
  type: "poison" | "fear" | "madness" | "guilt" | "melancholy" | "confusion" | "blessed" | "focused"
  duration: number
  value?: number
  description: string
}

interface BattleCharacter {
  id: string
  name: string
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  sanity: number
  maxSanity: number
  attack: number
  defense: number
  speed: number
  statusEffects: StatusEffect[]
  isPlayer: boolean
  sprite: string
  description: string
  psychologicalWeakness: string
  lore: string
}

interface BattleAction {
  type: "attack" | "skill" | "defend" | "analyze"
  skillId?: string
  targetId?: string
  damage?: number
  sanityDamage?: number
  heal?: number
  sanityHeal?: number
  animation?: string
  statusEffect?: StatusEffect
}

interface Skill {
  id: string
  name: string
  description: string
  mpCost: number
  sanityCost?: number
  damage?: number
  sanityDamage?: number
  heal?: number
  sanityHeal?: number
  statusEffect?: StatusEffect
  targetType: "enemy" | "self" | "all_enemies"
  psychologicalAttack?: boolean
}

const playerSkills: Skill[] = [
  {
    id: "shadow_strike",
    name: "Golpe das Sombras",
    description: "Um ataque físico imbuído com a escuridão de sua alma.",
    mpCost: 5,
    damage: 25,
    targetType: "enemy"
  },
  {
    id: "whispers_of_madness",
    name: "Sussurros da Loucura",
    description: "Projeta seus próprios medos no inimigo, causando dano psicológico.",
    mpCost: 10,
    sanityCost: 5,
    sanityDamage: 20,
    statusEffect: { type: "fear", duration: 3, value: -5, description: "Aterrorizado pelos sussurros" },
    targetType: "enemy",
    psychologicalAttack: true
  },
  {
    id: "medallion_focus",
    name: "Foco do Medalhão",
    description: "Use o medalhão como âncora para restaurar sua sanidade.",
    mpCost: 8,
    sanityHeal: 15,
    targetType: "self"
  },
  {
    id: "desperate_frenzy",
    name: "Frenesi Desesperado",
    description: "Abraça temporariamente a loucura para causar dano devastador.",
    mpCost: 15,
    sanityCost: 20,
    damage: 45,
    statusEffect: { type: "madness", duration: 2, value: 10, description: "Poder através da loucura" },
    targetType: "enemy"
  },
  {
    id: "rational_analysis",
    name: "Análise Racional",
    description: "Usa a lógica para dissipar ilusões e revelar fraquezas inimigas.",
    mpCost: 12,
    sanityHeal: 10,
    targetType: "self"
  }
]

const enemies: BattleCharacter[] = [
  {
    id: "specter_vanity",
    name: "Espectro da Vaidade",
    hp: 80,
    maxHp: 80,
    mp: 40,
    maxMp: 40,
    sanity: 30,
    maxSanity: 30,
    attack: 15,
    defense: 8,
    speed: 12,
    statusEffects: [],
    isPlayer: false,
    sprite: "👻",
    description: "Uma figura etérea que se admira constantemente em espelhos quebrados.",
    psychologicalWeakness: "Vulnerável a ataques que expõem sua verdadeira natureza vazia.",
    lore: "Outrora uma pessoa obcecada pela beleza, agora é apenas um eco de vaidade sem substância."
  },
  {
    id: "executioner_guilt",
    name: "Carrasco da Culpa",
    hp: 120,
    maxHp: 120,
    mp: 30,
    maxMp: 30,
    sanity: 20,
    maxSanity: 20,
    attack: 25,
    defense: 15,
    speed: 8,
    statusEffects: [],
    isPlayer: false,
    sprite: "⚔️",
    description: "Uma figura sombria que carrega o peso de crimes não confessados.",
    psychologicalWeakness: "Pode ser acalmado através do perdão e da compreensão.",
    lore: "Um executor que carregou o fardo da culpa até que ela se tornou sua própria prisão."
  },
  {
    id: "siren_melancholy",
    name: "Sereia da Melancolia",
    hp: 100,
    maxHp: 100,
    mp: 60,
    maxMp: 60,
    sanity: 40,
    maxSanity: 40,
    attack: 18,
    defense: 10,
    speed: 15,
    statusEffects: [],
    isPlayer: false,
    sprite: "🧜‍♀️",
    description: "Uma criatura de beleza assombrosa cujo canto atrai para as profundezas do desespero.",
    psychologicalWeakness: "Sua solidão é sua maior fraqueza - ataques em grupo a sobrecarregam.",
    lore: "Uma alma que se perdeu na própria tristeza, agora busca companhia na melancolia alheia."
  },
  {
    id: "archivist_madness",
    name: "Arquivista da Loucura",
    hp: 90,
    maxHp: 90,
    mp: 80,
    maxMp: 80,
    sanity: 10,
    maxSanity: 10,
    attack: 12,
    defense: 12,
    speed: 10,
    statusEffects: [],
    isPlayer: false,
    sprite: "📚",
    description: "Um ser corcunda cercado por manuscritos ilegíveis e conhecimento corrompido.",
    psychologicalWeakness: "Não suporta a ignorância - revelar suas fraquezas o deixa vulnerável.",
    lore: "Um erudito que buscou conhecimento além dos limites da sanidade humana."
  }
]

export function BattleSystem({ playerState, setPlayerState }: BattleSystemProps) {
  const [battleState, setBattleState] = useState<"setup" | "combat" | "victory" | "defeat">("setup")
  const [currentEnemy, setCurrentEnemy] = useState<BattleCharacter | null>(null)
  const [player, setPlayer] = useState<BattleCharacter>({
    id: "player",
    name: playerState.name,
    hp: playerState.hp,
    maxHp: 100,
    mp: playerState.mp,
    maxMp: 100,
    sanity: playerState.sanity,
    maxSanity: 100,
    attack: 20,
    defense: 12,
    speed: 10,
    statusEffects: [],
    isPlayer: true,
    sprite: "🗡️",
    description: "O Viajante Esquecido",
    psychologicalWeakness: "Memórias perdidas",
    lore: "Um alma perdida em busca de sua identidade."
  })
  const [currentTurn, setCurrentTurn] = useState<"player" | "enemy">("player")
  const [selectedAction, setSelectedAction] = useState<BattleAction | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [analyzedEnemy, setAnalyzedEnemy] = useState<boolean>(false)

  // Initialize battle
  const startBattle = (enemyId: string) => {
    const enemy = enemies.find(e => e.id === enemyId)
    if (!enemy) return
    
    setCurrentEnemy({ ...enemy })
    setBattleState("combat")
    setBattleLog([`Você enfrenta ${enemy.name}!`, enemy.lore])
    setAnalyzedEnemy(false)
  }

  // Calculate damage with sanity effects
  const calculateDamage = (attacker: BattleCharacter, target: BattleCharacter, baseDamage: number, isPsychological: boolean = false) => {
    let damage = baseDamage + attacker.attack - target.defense
    
    // Sanity affects accuracy and damage
    if (attacker.isPlayer) {
      const sanityModifier = attacker.sanity / 100
      if (sanityModifier < 0.3) {
        damage *= 0.7 // Low sanity reduces damage
        if (Math.random() < 0.3) {
          return 0 // Miss due to hallucinations
        }
      } else if (sanityModifier > 0.8) {
        damage *= 1.1 // High sanity increases damage
      }
    }
    
    // Psychological attacks are more effective against low sanity
    if (isPsychological && target.sanity < 50) {
      damage *= 1.5
    }
    
    return Math.max(1, Math.floor(damage))
  }

  // Apply status effects
  const applyStatusEffects = (character: BattleCharacter): BattleCharacter => {
    let newCharacter = { ...character }
    
    character.statusEffects.forEach(effect => {
      switch (effect.type) {
        case "poison":
          newCharacter.hp = Math.max(0, newCharacter.hp - (effect.value || 5))
          break
        case "fear":
          newCharacter.attack = Math.max(1, newCharacter.attack + (effect.value || -3))
          break
        case "madness":
          newCharacter.attack = newCharacter.attack + (effect.value || 5)
          newCharacter.defense = Math.max(1, newCharacter.defense - 2)
          break
        case "guilt":
          newCharacter.defense = Math.max(1, newCharacter.defense + (effect.value || -5))
          break
        case "melancholy":
          newCharacter.speed = Math.max(1, newCharacter.speed + (effect.value || -3))
          break
      }
    })
    
    // Reduce effect durations
    newCharacter.statusEffects = newCharacter.statusEffects
      .map(effect => ({ ...effect, duration: effect.duration - 1 }))
      .filter(effect => effect.duration > 0)
    
    return newCharacter
  }

  // Execute player action
  const executePlayerAction = (action: BattleAction) => {
    if (!currentEnemy || isAnimating) return
    
    setIsAnimating(true)
    setSelectedAction(action)
    
    setTimeout(() => {
      let newPlayer = { ...player }
      let newEnemy = { ...currentEnemy }
      let logMessages: string[] = []
      
      switch (action.type) {
        case "attack":
          const damage = calculateDamage(newPlayer, newEnemy, 20)
          if (damage > 0) {
            newEnemy.hp = Math.max(0, newEnemy.hp - damage)
            logMessages.push(`Você causa ${damage} de dano ao ${newEnemy.name}!`)
          } else {
            logMessages.push("Seu ataque falha devido às alucinações!")
          }
          break
          
        case "skill":
          const skill = playerSkills.find(s => s.id === action.skillId)
          if (skill && newPlayer.mp >= skill.mpCost) {
            newPlayer.mp -= skill.mpCost
            if (skill.sanityCost) {
              newPlayer.sanity = Math.max(0, newPlayer.sanity - skill.sanityCost)
            }
            
            if (skill.damage) {
              const skillDamage = calculateDamage(newPlayer, newEnemy, skill.damage, skill.psychologicalAttack)
              newEnemy.hp = Math.max(0, newEnemy.hp - skillDamage)
              logMessages.push(`${skill.name} causa ${skillDamage} de dano!`)
            }
            
            if (skill.sanityDamage) {
              newEnemy.sanity = Math.max(0, newEnemy.sanity - skill.sanityDamage)
              logMessages.push(`${skill.name} abala a sanidade do inimigo!`)
            }
            
            if (skill.heal) {
              newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + skill.heal)
              logMessages.push(`Você recupera ${skill.heal} pontos de vida!`)
            }
            
            if (skill.sanityHeal) {
              newPlayer.sanity = Math.min(newPlayer.maxSanity, newPlayer.sanity + skill.sanityHeal)
              logMessages.push(`Você recupera ${skill.sanityHeal} pontos de sanidade!`)
            }
            
            if (skill.statusEffect) {
              if (skill.targetType === "enemy") {
                newEnemy.statusEffects.push(skill.statusEffect)
                logMessages.push(`${newEnemy.name} sofre de ${skill.statusEffect.description}!`)
              } else {
                newPlayer.statusEffects.push(skill.statusEffect)
                logMessages.push(`Você ganha ${skill.statusEffect.description}!`)
              }
            }
          }
          break
          
        case "defend":
          newPlayer.defense += 5
          newPlayer.statusEffects.push({
            type: "focused",
            duration: 1,
            value: 5,
            description: "Defesa aumentada"
          })
          logMessages.push("Você assume uma postura defensiva!")
          break
          
        case "analyze":
          if (newPlayer.mp >= 5) {
            newPlayer.mp -= 5
            setAnalyzedEnemy(true)
            logMessages.push(`Você analisa ${newEnemy.name} e descobre sua fraqueza psicológica!`)
            logMessages.push(`Fraqueza: ${newEnemy.psychologicalWeakness}`)
          }
          break
      }
      
      // Apply status effects
      newPlayer = applyStatusEffects(newPlayer)
      newEnemy = applyStatusEffects(newEnemy)
      
      setPlayer(newPlayer)
      setCurrentEnemy(newEnemy)
      setBattleLog(prev => [...prev, ...logMessages])
      
      // Check for victory/defeat
      if (newEnemy.hp <= 0) {
        setBattleState("victory")
        setBattleLog(prev => [...prev, `Você derrotou ${newEnemy.name}!`])
        // Update player state
        setPlayerState({
          ...playerState,
          hp: newPlayer.hp,
          mp: newPlayer.mp,
          sanity: newPlayer.sanity,
          experience: playerState.experience + 50
        })
      } else if (newPlayer.hp <= 0 || newPlayer.sanity <= 0) {
        setBattleState("defeat")
        setBattleLog(prev => [...prev, newPlayer.sanity <= 0 ? "Você sucumbiu à loucura!" : "Você foi derrotado!"])
      } else {
        setCurrentTurn("enemy")
      }
      
      setIsAnimating(false)
    }, 1000)
  }

  // Enemy AI
  useEffect(() => {
    if (currentTurn === "enemy" && currentEnemy && battleState === "combat" && !isAnimating) {
      setTimeout(() => {
        setIsAnimating(true)
        
        setTimeout(() => {
          let newPlayer = { ...player }
          let newEnemy = { ...currentEnemy }
          let logMessages: string[] = []
          
          // Simple AI: choose action based on enemy type and player state
          const playerSanityRatio = newPlayer.sanity / newPlayer.maxSanity
          const enemyHpRatio = newEnemy.hp / newEnemy.maxHp
          
          if (playerSanityRatio > 0.7 && Math.random() < 0.6) {
            // Psychological attack
            const sanityDamage = Math.floor(Math.random() * 15) + 10
            newPlayer.sanity = Math.max(0, newPlayer.sanity - sanityDamage)
            logMessages.push(`${newEnemy.name} ataca sua mente! Você perde ${sanityDamage} pontos de sanidade!`)
          } else {
            // Physical attack
            const damage = calculateDamage(newEnemy, newPlayer, 15)
            newPlayer.hp = Math.max(0, newPlayer.hp - damage)
            logMessages.push(`${newEnemy.name} ataca! Você recebe ${damage} de dano!`)
          }
          
          // Apply status effects
          newPlayer = applyStatusEffects(newPlayer)
          newEnemy = applyStatusEffects(newEnemy)
          
          setPlayer(newPlayer)
          setCurrentEnemy(newEnemy)
          setBattleLog(prev => [...prev, ...logMessages])
          
          // Check for defeat
          if (newPlayer.hp <= 0 || newPlayer.sanity <= 0) {
            setBattleState("defeat")
            setBattleLog(prev => [...prev, newPlayer.sanity <= 0 ? "Você sucumbiu à loucura!" : "Você foi derrotado!"])
          } else {
            setCurrentTurn("player")
          }
          
          setIsAnimating(false)
        }, 1500)
      }, 1000)
    }
  }, [currentTurn, currentEnemy, battleState, isAnimating, player])

  if (battleState === "setup") {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-red-900/30 to-purple-900/30 border-red-900/30 p-6">
          <h2 className="text-2xl font-heading font-bold mb-4 text-center">
            Escolha Seu Adversário
          </h2>
          <p className="text-gray-300 text-center mb-6">
            Cada inimigo representa uma obsessão humana diferente. Escolha sabiamente...
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enemies.map((enemy) => (
              <Card key={enemy.id} className="bg-gradient-to-br from-black/50 to-red-900/20 border-red-900/30 p-4 hover:border-red-700/50 transition-colors cursor-pointer"
                    onClick={() => startBattle(enemy.id)}>
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">{enemy.sprite}</span>
                  <div>
                    <h3 className="font-heading font-bold text-white">{enemy.name}</h3>
                    <p className="text-sm text-gray-400">HP: {enemy.hp} | Sanidade: {enemy.sanity}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-2">{enemy.description}</p>
                <p className="text-xs text-gray-400 italic">{enemy.lore}</p>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Battle Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Player Status */}
        <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-900/30 p-4">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3">{player.sprite}</span>
            <div>
              <h3 className="font-heading font-bold text-white">{player.name}</h3>
              <div className="flex space-x-2">
                {player.statusEffects.map((effect, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {effect.type} ({effect.duration})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center"><Heart className="w-4 h-4 mr-1 text-red-500" />Vida</span>
              <span>{player.hp}/{player.maxHp}</span>
            </div>
            <Progress value={(player.hp / player.maxHp) * 100} className="h-2" />
            
            <div className="flex justify-between text-sm">
              <span className="flex items-center"><Brain className="w-4 h-4 mr-1 text-blue-500" />Magia</span>
              <span>{player.mp}/{player.maxMp}</span>
            </div>
            <Progress value={(player.mp / player.maxMp) * 100} className="h-2" />
            
            <div className="flex justify-between text-sm">
              <span className="flex items-center"><Eye className="w-4 h-4 mr-1 text-purple-500" />Sanidade</span>
              <span>{player.sanity}/{player.maxSanity}</span>
            </div>
            <Progress value={(player.sanity / player.maxSanity) * 100} className="h-2" />
          </div>
        </Card>

        {/* Enemy Status */}
        {currentEnemy && (
          <Card className="bg-gradient-to-br from-red-900/30 to-black/50 border-red-900/30 p-4">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">{currentEnemy.sprite}</span>
              <div>
                <h3 className="font-heading font-bold text-white">{currentEnemy.name}</h3>
                <div className="flex space-x-2">
                  {currentEnemy.statusEffects.map((effect, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {effect.type} ({effect.duration})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center"><Heart className="w-4 h-4 mr-1 text-red-500" />Vida</span>
                <span>{currentEnemy.hp}/{currentEnemy.maxHp}</span>
              </div>
              <Progress value={(currentEnemy.hp / currentEnemy.maxHp) * 100} className="h-2" />
              
              <div className="flex justify-between text-sm">
                <span className="flex items-center"><Eye className="w-4 h-4 mr-1 text-purple-500" />Sanidade</span>
                <span>{currentEnemy.sanity}/{currentEnemy.maxSanity}</span>
              </div>
              <Progress value={(currentEnemy.sanity / currentEnemy.maxSanity) * 100} className="h-2" />
            </div>
            
            {analyzedEnemy && (
              <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded">
                <p className="text-xs text-yellow-300">
                  <strong>Fraqueza:</strong> {currentEnemy.psychologicalWeakness}
                </p>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Battle Actions */}
      {battleState === "combat" && currentTurn === "player" && !isAnimating && (
        <Card className="bg-gradient-to-br from-gray-900/50 to-purple-900/30 border-gray-700/30 p-6">
          <h3 className="text-lg font-heading font-bold mb-4">Escolha sua ação:</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Button
              variant="outline"
              className="h-auto p-3 flex flex-col items-center border-red-700/50 hover:bg-red-900/20"
              onClick={() => executePlayerAction({ type: "attack" })}
            >
              <Sword className="w-5 h-5 mb-1" />
              <span className="text-sm">Atacar</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 flex flex-col items-center border-blue-700/50 hover:bg-blue-900/20"
              onClick={() => executePlayerAction({ type: "defend" })}
            >
              <Shield className="w-5 h-5 mb-1" />
              <span className="text-sm">Defender</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 flex flex-col items-center border-yellow-700/50 hover:bg-yellow-900/20"
              onClick={() => executePlayerAction({ type: "analyze" })}
              disabled={player.mp < 5 || analyzedEnemy}
            >
              <Eye className="w-5 h-5 mb-1" />
              <span className="text-sm">Analisar</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-3 flex flex-col items-center border-purple-700/50 hover:bg-purple-900/20"
              onClick={() => setBattleState("setup")}
            >
              <Moon className="w-5 h-5 mb-1" />
              <span className="text-sm">Fugir</span>
            </Button>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Habilidades:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {playerSkills.map((skill) => (
                <Button
                  key={skill.id}
                  variant="outline"
                  className="text-left justify-start h-auto p-3 border-purple-700/50 hover:bg-purple-900/20"
                  onClick={() => executePlayerAction({ type: "skill", skillId: skill.id })}
                  disabled={player.mp < skill.mpCost || (skill.sanityCost && player.sanity < skill.sanityCost)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-xs text-gray-400">{skill.description}</span>
                    <div className="flex space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">MP: {skill.mpCost}</Badge>
                      {skill.sanityCost && (
                        <Badge variant="outline" className="text-xs text-purple-400">Sanidade: {skill.sanityCost}</Badge>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Battle Log */}
      <Card className="bg-gradient-to-br from-black/80 to-gray-900/50 border-gray-700/30 p-4">
        <h3 className="text-lg font-heading font-bold mb-3 flex items-center">
          <Raven className="w-5 h-5 mr-2" />
          Crônicas da Batalha
        </h3>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {battleLog.slice(-8).map((log, index) => (
            <p key={index} className="text-sm text-gray-300">
              {log}
            </p>
          ))}
        </div>
      </Card>

      {/* Victory/Defeat */}
      {battleState === "victory" && (
        <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-700/30 p-6 text-center">
          <h2 className="text-2xl font-heading font-bold text-green-400 mb-4">Vitória!</h2>
          <p className="text-gray-300 mb-4">
            Você superou mais uma manifestação de obsessão humana. Sua jornada pela Arena das Sombras continua...
          </p>
          <Button onClick={() => setBattleState("setup")} className="bg-green-700 hover:bg-green-600">
            Continuar Jornada
          </Button>
        </Card>
      )}

      {battleState === "defeat" && (
        <Card className="bg-gradient-to-br from-red-900/50 to-black/50 border-red-700/30 p-6 text-center">
          <h2 className="text-2xl font-heading font-bold text-red-400 mb-4">Derrota</h2>
          <p className="text-gray-300 mb-4">
            {player.sanity <= 0 
              ? "Você sucumbiu à loucura. As sombras da Arena reclamaram mais uma alma..."
              : "Suas forças se esgotaram. A Arena das Sombras não perdoa os fracos..."
            }
          </p>
          <Button onClick={() => setBattleState("setup")} className="bg-red-700 hover:bg-red-600">
            Tentar Novamente
          </Button>
        </Card>
      )}

      {/* Turn Indicator */}
      {battleState === "combat" && (
        <div className="text-center">
          <Badge className={`${currentTurn === "player" ? "bg-blue-600" : "bg-red-600"} text-white`}>
            {isAnimating ? "Executando ação..." : currentTurn === "player" ? "Seu turno" : `Turno de ${currentEnemy?.name}`}
          </Badge>
        </div>
      )}
    </div>
  )
}

