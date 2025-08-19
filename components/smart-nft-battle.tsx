"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sword, Shield, Zap, Brain, Sparkles, Trophy } from "lucide-react"
import { MotionWrapper } from "./motion-wrapper"
import { AIService } from "@/lib/ai-service"

interface SmartNFT {
  id: string
  name: string
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  attack: number
  defense: number
  speed: number
  intelligence: number
  neuralNetwork: string
  abilities: string[]
  battleExperience: number
  wins: number
  losses: number
  adaptations: string[]
}

export function SmartNFTBattle({ playerData, setPlayerData }: { playerData: any; setPlayerData: any }) {
  const [playerNFT, setPlayerNFT] = useState<SmartNFT>({
    id: "player-nft-1",
    name: "Shadow Warrior Elite",
    hp: 150,
    maxHp: 150,
    mp: 80,
    maxMp: 80,
    attack: 95,
    defense: 85,
    speed: 70,
    intelligence: 88,
    neuralNetwork: "GPT-4 Enhanced",
    abilities: ["Shadow Strike", "Void Slash", "Dark Barrier"],
    battleExperience: 1250,
    wins: 15,
    losses: 3,
    adaptations: ["Increased critical hit rate", "Improved defense against magic"],
  })

  const [enemyNFT, setEnemyNFT] = useState<SmartNFT>({
    id: "enemy-nft-1",
    name: "Cosmic Beast",
    hp: 120,
    maxHp: 120,
    mp: 60,
    maxMp: 60,
    attack: 80,
    defense: 70,
    speed: 85,
    intelligence: 75,
    neuralNetwork: "Gemini Powered",
    abilities: ["Cosmic Blast", "Star Shield", "Meteor Strike"],
    battleExperience: 800,
    wins: 8,
    losses: 5,
    adaptations: ["Enhanced speed", "Magic resistance"],
  })

  const [battleState, setBattleState] = useState({
    phase: "planning",
    currentTurn: "player",
    selectedAction: null,
    animating: false,
    battleLog: ["A batalha neural começou!"],
    turn: 1,
    aiPredictions: null,
  })

  const [damageNumbers, setDamageNumbers] = useState<any[]>([])

  // IA prediz próxima ação do inimigo
  const predictEnemyAction = useCallback(async () => {
    try {
      const prediction = await AIService.predictBattleAction(enemyNFT, playerNFT, battleState)
      setBattleState((prev) => ({ ...prev, aiPredictions: prediction }))
    } catch (error) {
      console.error("Erro na predição IA:", error)
    }
  }, [enemyNFT, playerNFT, battleState])

  // Executa ação do jogador
  const executePlayerAction = async (action: string) => {
    if (battleState.animating) return

    setBattleState((prev) => ({ ...prev, animating: true, selectedAction: action }))

    try {
      // IA calcula resultado da ação
      const result = await AIService.calculateBattleAction(action, playerNFT, enemyNFT)

      // Aplica dano/efeitos
      if (result.damage > 0) {
        setEnemyNFT((prev) => ({
          ...prev,
          hp: Math.max(0, prev.hp - result.damage),
        }))

        // Adiciona número de dano
        setDamageNumbers((prev) => [
          ...prev,
          {
            id: Date.now(),
            damage: result.damage,
            x: 600,
            y: 250,
            type: result.critical ? "critical" : "normal",
          },
        ])
      }

      // Atualiza log
      setBattleState((prev) => ({
        ...prev,
        battleLog: [...prev.battleLog, result.message],
      }))

      // IA aprende com a ação
      await AIService.updateNFTLearning(playerNFT.id, action, result)

      setTimeout(() => {
        setBattleState((prev) => ({
          ...prev,
          currentTurn: "enemy",
          animating: false,
          turn: prev.turn + 1,
        }))
      }, 1500)
    } catch (error) {
      console.error("Erro na ação:", error)
      setBattleState((prev) => ({ ...prev, animating: false }))
    }
  }

  // IA executa ação do inimigo
  const executeEnemyAction = useCallback(async () => {
    if (battleState.currentTurn !== "enemy" || battleState.animating) return

    setBattleState((prev) => ({ ...prev, animating: true }))

    try {
      // IA escolhe melhor ação baseada no aprendizado
      const aiAction = await AIService.chooseOptimalAction(enemyNFT, playerNFT, battleState)

      const result = await AIService.calculateBattleAction(aiAction.action, enemyNFT, playerNFT)

      if (result.damage > 0) {
        setPlayerNFT((prev) => ({
          ...prev,
          hp: Math.max(0, prev.hp - result.damage),
        }))

        setDamageNumbers((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            damage: result.damage,
            x: 200,
            y: 250,
            type: "normal",
          },
        ])
      }

      setBattleState((prev) => ({
        ...prev,
        battleLog: [...prev.battleLog, `${enemyNFT.name}: ${result.message}`],
        currentTurn: "player",
        animating: false,
      }))

      // IA inimiga também aprende
      await AIService.updateNFTLearning(enemyNFT.id, aiAction.action, result)
    } catch (error) {
      console.error("Erro na ação da IA:", error)
      setBattleState((prev) => ({ ...prev, animating: false, currentTurn: "player" }))
    }
  }, [battleState, enemyNFT, playerNFT])

  // Remove números de dano após animação
  useEffect(() => {
    if (damageNumbers.length > 0) {
      const timer = setTimeout(() => {
        setDamageNumbers([])
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [damageNumbers])

  // Executa turno da IA
  useEffect(() => {
    if (battleState.currentTurn === "enemy" && !battleState.animating) {
      const timer = setTimeout(executeEnemyAction, 1000)
      return () => clearTimeout(timer)
    }
  }, [battleState.currentTurn, battleState.animating, executeEnemyAction])

  // Prediz próxima ação quando é turno do jogador
  useEffect(() => {
    if (battleState.currentTurn === "player" && !battleState.animating) {
      predictEnemyAction()
    }
  }, [battleState.currentTurn, battleState.animating, predictEnemyAction])

  // Verifica fim da batalha
  useEffect(() => {
    if (playerNFT.hp <= 0 || enemyNFT.hp <= 0) {
      const victory = playerNFT.hp > 0
      setBattleState((prev) => ({
        ...prev,
        phase: victory ? "victory" : "defeat",
        battleLog: [
          ...prev.battleLog,
          victory ? "Vitória! Seu NFT evoluiu!" : "Derrota! Mas seu NFT aprendeu com a experiência.",
        ],
      }))

      // Atualiza dados do jogador
      if (victory) {
        setPlayerData((prev: any) => ({
          ...prev,
          shadowTokens: prev.shadowTokens + 100,
          wins: prev.wins + 1,
          experience: prev.experience + 150,
        }))
      } else {
        setPlayerData((prev: any) => ({
          ...prev,
          losses: prev.losses + 1,
          experience: prev.experience + 50,
        }))
      }
    }
  }, [playerNFT.hp, enemyNFT.hp, setPlayerData])

  return (
    <div className="w-full h-full bg-gradient-to-b from-purple-900 via-blue-900 to-black relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500 rounded-full blur-3xl animate-pulse shadow-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-blue-500 rounded-full blur-2xl animate-pulse delay-1000 cosmic-glow"></div>
        <div className="absolute bottom-1/4 left-1/2 w-40 h-40 bg-cyan-500 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Neural Network Visualization */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full">
          <defs>
            <pattern id="neural-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="2" fill="#8b5cf6" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural-grid)" />
        </svg>
      </div>

      {/* Damage Numbers */}
      {damageNumbers.map((dmg) => (
        <MotionWrapper
          key={dmg.id}
          initial={{ opacity: 1, y: dmg.y, x: dmg.x, scale: 1 }}
          animate={{ opacity: 0, y: dmg.y - 100, scale: 1.5 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute pointer-events-none z-30"
        >
          <div
            className={`text-4xl font-bold ${
              dmg.type === "critical" ? "text-yellow-400 animate-pulse" : "text-red-400"
            }`}
          >
            -{dmg.damage}
            {dmg.type === "critical" && <span className="text-yellow-300 ml-2">CRITICAL!</span>}
          </div>
        </MotionWrapper>
      ))}

      <div className="relative z-10 h-full flex flex-col">
        {/* Enhanced Battle HUD */}
        <MotionWrapper initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
          <div className="p-4 bg-black/50 backdrop-blur-sm border-b border-purple-500/30">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Turno: <span className="text-white font-bold">{battleState.turn}</span>
              </div>
              <div className="text-sm text-gray-400">
                Fase: <span className="text-purple-400 font-bold capitalize">{battleState.phase}</span>
              </div>
              <div className="text-sm text-gray-400 flex items-center">
                <Brain className="w-4 h-4 mr-1" />
                IA Neural Ativa
              </div>
            </div>
          </div>
        </MotionWrapper>

        {/* Battle Arena */}
        <div className="flex-1 flex items-center justify-between px-8">
          {/* Player NFT */}
          <MotionWrapper
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="text-center">
              <MotionWrapper
                animate={{
                  scale: battleState.selectedAction && battleState.currentTurn === "player" ? 1.2 : 1,
                  rotate: battleState.selectedAction && battleState.currentTurn === "player" ? 15 : 0,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg mb-4 flex items-center justify-center shadow-2xl floating relative">
                  <Sword className="w-16 h-16 text-white" />
                  {/* Neural Network Indicator */}
                  <div className="absolute -top-2 -right-2 bg-green-600 rounded-full p-1">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                </div>
              </MotionWrapper>

              <Card className="bg-black/50 rounded-lg p-3 min-w-[220px] backdrop-blur-sm border border-purple-500/30">
                <h3 className="text-lg font-bold text-purple-300 mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  {playerNFT.name}
                </h3>

                {/* Neural Network Info */}
                <div className="mb-2">
                  <Badge className="bg-green-600 text-xs mb-1">{playerNFT.neuralNetwork}</Badge>
                  <div className="text-xs text-gray-400">
                    IQ: {playerNFT.intelligence} | Exp: {playerNFT.battleExperience}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-400">HP</span>
                      <span className="text-white">
                        {playerNFT.hp}/{playerNFT.maxHp}
                      </span>
                    </div>
                    <Progress value={(playerNFT.hp / playerNFT.maxHp) * 100} className="h-3 bg-red-900/50" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-400">MP</span>
                      <span className="text-white">
                        {playerNFT.mp}/{playerNFT.maxMp}
                      </span>
                    </div>
                    <Progress value={(playerNFT.mp / playerNFT.maxMp) * 100} className="h-3 bg-blue-900/50" />
                  </div>
                </div>

                {/* Battle Record */}
                <div className="mt-2 text-xs text-gray-400 flex justify-between">
                  <span className="text-green-400">{playerNFT.wins}W</span>
                  <span className="text-red-400">{playerNFT.losses}L</span>
                </div>
              </Card>
            </div>
          </MotionWrapper>

          {/* VS Indicator with Neural Activity */}
          <MotionWrapper
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <div className="text-center">
              <div className="text-6xl font-bold text-white/30 animate-pulse mb-2">VS</div>
              <div className="flex items-center justify-center space-x-2">
                <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-xs text-purple-400">Neural Battle</span>
                <Brain className="w-4 h-4 text-blue-400 animate-pulse" />
              </div>
            </div>
          </MotionWrapper>

          {/* Enemy NFT */}
          <MotionWrapper
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="text-center">
              <MotionWrapper
                animate={{
                  scale: battleState.currentTurn === "enemy" ? 1.1 : 1,
                  rotate: battleState.currentTurn === "enemy" ? -10 : 0,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={battleState.currentTurn === "enemy" ? "battle-shake" : ""}
              >
                <div className="w-32 h-32 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg mb-4 flex items-center justify-center shadow-2xl relative">
                  <Shield className="w-16 h-16 text-white" />
                  {/* AI Indicator */}
                  <div className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1">
                    <Brain className="w-3 h-3 text-white animate-pulse" />
                  </div>
                </div>
              </MotionWrapper>

              <Card className="bg-black/50 rounded-lg p-3 min-w-[220px] backdrop-blur-sm border border-red-500/30">
                <h3 className="text-lg font-bold text-red-300 mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-1" />
                  {enemyNFT.name}
                </h3>

                {/* Neural Network Info */}
                <div className="mb-2">
                  <Badge className="bg-red-600 text-xs mb-1">{enemyNFT.neuralNetwork}</Badge>
                  <div className="text-xs text-gray-400">
                    IQ: {enemyNFT.intelligence} | Exp: {enemyNFT.battleExperience}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-400">HP</span>
                      <span className="text-white">
                        {enemyNFT.hp}/{enemyNFT.maxHp}
                      </span>
                    </div>
                    <Progress value={(enemyNFT.hp / enemyNFT.maxHp) * 100} className="h-3 bg-red-900/50" />
                  </div>
                </div>

                {/* AI Prediction */}
                {battleState.aiPredictions && (
                  <div className="mt-2 p-2 bg-yellow-900/30 rounded text-xs">
                    <div className="text-yellow-400 font-bold mb-1">IA Prevê:</div>
                    <div className="text-yellow-300">{battleState.aiPredictions.nextAction}</div>
                  </div>
                )}

                {/* Battle Record */}
                <div className="mt-2 text-xs text-gray-400 flex justify-between">
                  <span className="text-green-400">{enemyNFT.wins}W</span>
                  <span className="text-red-400">{enemyNFT.losses}L</span>
                </div>
              </Card>
            </div>
          </MotionWrapper>
        </div>

        {/* Enhanced Action Menu */}
        {battleState.currentTurn === "player" &&
          !battleState.animating &&
          enemyNFT.hp > 0 &&
          playerNFT.hp > 0 &&
          battleState.phase === "planning" && (
            <MotionWrapper
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-6 bg-black/70 backdrop-blur-sm border-t border-purple-500/30">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-purple-300 flex items-center justify-center">
                      <Brain className="w-5 h-5 mr-2" />
                      Escolha sua Ação Neural
                    </h3>
                    <p className="text-sm text-gray-400">Sua IA analisará e otimizará a ação escolhida</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {playerNFT.abilities.map((ability, index) => (
                      <Button
                        key={ability}
                        onClick={() => executePlayerAction(ability.toLowerCase().replace(" ", "_"))}
                        className={`h-20 flex flex-col items-center justify-center transform hover:scale-110 transition-all duration-200 shadow-lg ${
                          index === 0
                            ? "bg-red-600 hover:bg-red-700 hover:shadow-red-500/50"
                            : index === 1
                              ? "bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/50"
                              : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/50"
                        }`}
                        disabled={battleState.animating}
                      >
                        {index === 0 ? (
                          <Sword className="w-6 h-6 mb-1" />
                        ) : index === 1 ? (
                          <Zap className="w-6 h-6 mb-1" />
                        ) : (
                          <Shield className="w-6 h-6 mb-1" />
                        )}
                        <span className="text-sm font-bold">{ability}</span>
                        <span className="text-xs opacity-80">IA Enhanced</span>
                      </Button>
                    ))}

                    <Button
                      onClick={() => executePlayerAction("neural_boost")}
                      className="h-20 flex flex-col items-center justify-center transform hover:scale-110 transition-all duration-200 shadow-lg bg-green-600 hover:bg-green-700 hover:shadow-green-500/50"
                      disabled={battleState.animating}
                    >
                      <Brain className="w-6 h-6 mb-1" />
                      <span className="text-sm font-bold">Neural Boost</span>
                      <span className="text-xs opacity-80">+25% All Stats</span>
                    </Button>
                  </div>
                </div>
              </div>
            </MotionWrapper>
          )}

        {/* Battle Log */}
        <div className="absolute bottom-4 left-4 max-w-md z-20">
          <Card className="bg-black/70 backdrop-blur-sm border-purple-500/30 p-3 max-h-40 overflow-y-auto">
            <h4 className="text-sm font-bold text-purple-300 mb-2 flex items-center">
              <Brain className="w-4 h-4 mr-1" />
              Log Neural da Batalha
            </h4>
            {battleState.battleLog.slice(-4).map((log, index) => (
              <p key={index} className="text-xs text-gray-300 mb-1">
                {log}
              </p>
            ))}
          </Card>
        </div>

        {/* Enhanced Battle Result */}
        {(battleState.phase === "victory" || battleState.phase === "defeat") && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
            <MotionWrapper
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Card className="bg-gradient-to-br from-purple-900 to-blue-900 border-purple-500 p-8 text-center shadow-2xl max-w-md">
                <div className="mb-6">
                  {battleState.phase === "victory" ? (
                    <>
                      <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
                      <h2 className="text-4xl font-bold text-green-400 mb-2">VITÓRIA NEURAL!</h2>
                      <p className="text-gray-300 mb-4">Seu NFT evoluiu e aprendeu novas estratégias!</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-blue-400">+150 XP</p>
                        <p className="text-yellow-400">+100 SHADOW</p>
                        <p className="text-purple-400">+Neural Evolution</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Brain className="w-16 h-16 text-red-400 mx-auto mb-4 animate-pulse" />
                      <h2 className="text-4xl font-bold text-red-400 mb-2">APRENDIZADO</h2>
                      <p className="text-gray-300 mb-4">Derrota faz parte do aprendizado neural!</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-blue-400">+50 XP</p>
                        <p className="text-purple-400">+Neural Adaptation</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 transform hover:scale-105 transition-all"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Nova Batalha Neural
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="border-purple-500 text-purple-400 transform hover:scale-105 transition-all"
                  >
                    Menu Principal
                  </Button>
                </div>
              </Card>
            </MotionWrapper>
          </div>
        )}
      </div>
    </div>
  )
}
