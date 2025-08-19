"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Eye, Skull, Heart, Brain, BookOpen, Sword, Settings, Moon, Bird } from "lucide-react"

interface PlayerState {
  hp: number
  mp: number
  sanity: number
  level: number
  experience: number
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("home")
  const [playerState, setPlayerState] = useState<PlayerState>({
    hp: 100,
    mp: 50,
    sanity: 75,
    level: 1,
    experience: 0
  })
  const [enemyState, setEnemyState] = useState<{ hp: number; name: string }>({
    hp: 100,
    name: "Espectro da Vaidade",
  })
  const [battleLog, setBattleLog] = useState<string[]>([
    "• Você entra em combate com o Espectro da Vaidade",
    "• O espectro sussurra sobre suas inseguranças",
    "• Sua sanidade oscila conforme a batalha se intensifica",
  ])

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
  const addLog = (message: string) => setBattleLog(prev => [...prev, `• ${message}`].slice(-10))

  const isBattleOver = enemyState.hp <= 0 || playerState.hp <= 0 || playerState.sanity <= 0

  const handlePhysicalAttack = () => {
    if (isBattleOver || playerState.mp < 5) return
    const damage = Math.floor(10 + Math.random() * 12) // 10-21
    setPlayerState(prev => ({ ...prev, mp: clamp(prev.mp - 5, 0, 999) }))
    setEnemyState(prev => ({ ...prev, hp: clamp(prev.hp - damage, 0, 100) }))
    addLog(`Você desferiu um golpe físico causando ${damage} de dano.`)
  }

  const handlePsychAnalysis = () => {
    if (isBattleOver || playerState.mp < 10) return
    const damage = Math.floor(16 + Math.random() * 15) // 16-30
    setPlayerState(prev => ({
      ...prev,
      mp: clamp(prev.mp - 10, 0, 999),
      sanity: clamp(prev.sanity - 3, 0, 100),
    }))
    setEnemyState(prev => ({ ...prev, hp: clamp(prev.hp - damage, 0, 100) }))
    addLog(`Sua análise psicológica expôs fraquezas, causando ${damage} de dano.`)
  }

  const handleMeditate = () => {
    if (isBattleOver) return
    setPlayerState(prev => ({ ...prev, hp: clamp(prev.hp + 15, 0, 100) }))
    addLog("Você meditou e recuperou 15 de HP.")
  }

  const handleResetBattle = () => {
    setPlayerState({ hp: 100, mp: 50, sanity: 75, level: 1, experience: 0 })
    setEnemyState({ hp: 100, name: "Espectro da Vaidade" })
    setBattleLog([
      "• Você entra em combate com o Espectro da Vaidade",
      "• O espectro sussurra sobre suas inseguranças",
      "• Sua sanidade oscila conforme a batalha se intensifica",
    ])
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-gradient-to-br from-red-900/30 to-black/80 border-red-900/50 p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-purple-800 rounded-full flex items-center justify-center animate-pulse">
                <Bird className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
              Arena das Sombras
            </h1>
            <p className="text-gray-400 text-sm">Um Conto de Desespero e Redenção</p>
            <Progress value={66} className="h-3 bg-gray-800 border border-red-900/30" />
            <p className="text-gray-300 text-sm">Despertando nas sombras etéreas...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-purple-950/20">
      <div className="relative min-h-screen">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_70%)]" />
        
        {/* Header */}
        <header className="relative z-10 border-b border-red-900/30 backdrop-blur-sm bg-black/30">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-purple-800 rounded-full flex items-center justify-center">
                  <Bird className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
                    Arena das Sombras
                  </h1>
                  <p className="text-sm text-gray-400">Inspirado em Edgar Allan Poe</p>
                </div>
              </div>
              
              {/* Player Status */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-black/60 rounded-lg p-2 border border-red-900/30">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{playerState.hp}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{playerState.mp}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">{playerState.sanity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-red-900/30 backdrop-blur-sm bg-black/30">
            <div className="max-w-7xl mx-auto px-6">
              <TabsList className="grid w-full grid-cols-4 bg-transparent h-16">
                <TabsTrigger value="home" className="data-[state=active]:bg-red-900/50 flex flex-col items-center transition-colors duration-300">
                  <Moon className="w-5 h-5 mb-1" />
                  <span className="text-xs">Entrada</span>
                </TabsTrigger>
                <TabsTrigger value="narrative" className="data-[state=active]:bg-red-900/50 flex flex-col items-center transition-colors duration-300">
                  <BookOpen className="w-5 h-5 mb-1" />
                  <span className="text-xs">Narrativa</span>
                </TabsTrigger>
                <TabsTrigger value="battle" className="data-[state=active]:bg-red-900/50 flex flex-col items-center transition-colors duration-300">
                  <Sword className="w-5 h-5 mb-1" />
                  <span className="text-xs">Combate</span>
                </TabsTrigger>
                <TabsTrigger value="lore" className="data-[state=active]:bg-red-900/50 flex flex-col items-center transition-colors duration-300">
                  <Skull className="w-5 h-5 mb-1" />
                  <span className="text-xs">Lore</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            <TabsContent value="home">
              <div className="space-y-8">
                {/* Welcome Section */}
                <Card className="bg-gradient-to-br from-red-900/30 to-black/50 border-red-900/30 p-8">
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-white mb-4">
                      Bem-vindo à Arena das Sombras
                    </h2>
                    <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto">
                      Você desperta em uma arena etérea e labiríntica, sem memória de como chegou aqui. 
                      O ar é pesado com o cheiro de mofo e melancolia. Sombras dançam nas paredes, 
                      sussurrando segredos esquecidos. Sua única posse é um fragmento de medalhão antigo 
                      que vibra com uma energia sombria e familiar.
                    </p>
                    <div className="flex justify-center space-x-4 mt-6">
                      <Button 
                        onClick={() => setActiveTab("narrative")}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
                      >
                        Começar Jornada
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("lore")}
                        className="border-purple-500 text-purple-400 hover:bg-purple-900/20"
                      >
                        Descobrir Lore
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Game Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-purple-900/30 to-black/50 border-purple-900/30 p-6">
                    <div className="flex items-center mb-4">
                      <Eye className="w-8 h-8 text-purple-400 mr-3" />
                      <h3 className="text-xl font-bold">Sistema de Sanidade</h3>
                    </div>
                    <p className="text-gray-300 mb-4">
                      Sua sanidade mental afeta diretamente a realidade ao seu redor. 
                      Mantenha-se são ou sucumba à loucura.
                    </p>
                    <Badge className="bg-purple-600/80">Psicológico</Badge>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-900/30 to-black/50 border-blue-900/30 p-6">
                    <div className="flex items-center mb-4">
                      <BookOpen className="w-8 h-8 text-blue-400 mr-3" />
                      <h3 className="text-xl font-bold">Narrativa Ramificada</h3>
                    </div>
                    <p className="text-gray-300 mb-4">
                      Suas escolhas moldam a história. Cada decisão leva a consequências 
                      únicas e múltiplos finais possíveis.
                    </p>
                    <Badge className="bg-blue-600/80">Interativo</Badge>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-900/30 to-black/50 border-red-900/30 p-6">
                    <div className="flex items-center mb-4">
                      <Skull className="w-8 h-8 text-red-400 mr-3" />
                      <h3 className="text-xl font-bold">Adversários Sombrios</h3>
                    </div>
                    <p className="text-gray-300 mb-4">
                      Enfrente manifestações de obsessões humanas: o Espectro da Vaidade, 
                      o Carrasco da Culpa, a Sereia da Melancolia.
                    </p>
                    <Badge className="bg-red-600/80">Combate Psicológico</Badge>
                  </Card>
                </div>

                {/* Generated Images Section */}
                <Card className="bg-gradient-to-br from-gray-900/50 to-purple-900/20 border-gray-700/30 p-6">
                  <h3 className="text-xl font-bold mb-4">Galeria das Sombras</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-red-900/30">
                      <Image
                        src="/arena-entrance.png"
                        alt="Entrada da Arena"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-red-900/30">
                      <Image
                        src="/raven-guardian.png"
                        alt="Guardião Corvo"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-red-900/30">
                      <Image
                        src="/specter-vanity.png"
                        alt="Espectro da Vaidade"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-red-900/30">
                      <Image
                        src="/executioner-guilt.png"
                        alt="Carrasco da Culpa"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-red-900/30">
                      <Image
                        src="/medallion-fragment.png"
                        alt="Fragmento do Medalhão"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="narrative">
              <Card className="bg-gradient-to-br from-red-900/30 to-purple-900/30 border-red-900/30 p-8">
                <h3 className="text-2xl font-bold mb-6">O Despertar</h3>
                <div className="space-y-4 text-gray-300">
                  <p className="text-lg leading-relaxed">
                    Você desperta em um corredor de pedra fria, iluminado apenas pela luz fantasmagórica 
                    de tochas que nunca se apagam. O eco de seus passos ressoa infinitamente, como se 
                    o próprio espaço fosse uma extensão de sua mente fragmentada.
                  </p>
                  <p className="text-lg leading-relaxed">
                    Em sua mão, um fragmento de medalhão pulsa com uma energia familiar, mas perturbadora. 
                    Gravações em uma língua esquecida dançam em sua superfície, mudando conforme sua 
                    sanidade oscila.
                  </p>
                  <div className="mt-8 space-y-4">
                    <h4 className="text-xl font-bold text-purple-400">Escolha seu caminho:</h4>
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full text-left justify-start border-purple-500 text-purple-300 hover:bg-purple-900/20"
                        onClick={() => {
                          setPlayerState(prev => ({ ...prev, sanity: prev.sanity - 5 }))
                        }}
                      >
                        Examinar o medalhão mais de perto (-5 Sanidade)
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full text-left justify-start border-blue-500 text-blue-300 hover:bg-blue-900/20"
                        onClick={() => {
                          setPlayerState(prev => ({ ...prev, mp: prev.mp + 10 }))
                        }}
                      >
                        Meditar para recuperar energia (+10 MP)
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full text-left justify-start border-red-500 text-red-300 hover:bg-red-900/20"
                        onClick={() => setActiveTab("battle")}
                      >
                        Avançar pelos corredores sombrios
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="battle">
              <Card className="bg-gradient-to-br from-red-900/30 to-black/50 border-red-900/30 p-8">
                <h3 className="text-2xl font-bold mb-6">Confronto nas Sombras</h3>
                <div className="w-full mb-4 rounded-lg overflow-hidden border border-red-900/30 bg-black/60">
                  <iframe
                    src="/batalha/index.html"
                    title="Arena das Sombras - Batalha"
                    className="w-full"
                    style={{ height: "720px" }}
                  />
                </div>
                <div className="mb-8">
                  <Link href="/batalha/" className="inline-block">
                    <Button className="bg-red-600 hover:bg-red-700">Abrir Batalha em Tela Cheia</Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-red-400">{enemyState.name}</h4>
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-red-900/30">
                      <Image
                        src="/specter-vanity.png"
                        alt="Espectro da Vaidade"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-gray-300">
                      Uma figura etérea obcecada com seu reflexo, cercada por espelhos quebrados 
                      que mostram diferentes aspectos da vaidade e do vazio.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Vida do Inimigo</span>
                        <span className="text-sm text-red-400">{enemyState.hp}/100</span>
                      </div>
                      <Progress value={enemyState.hp} className="h-2 bg-gray-800" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-purple-400">Suas Ações</h4>
                    <div className="space-y-3">
                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={handlePhysicalAttack}
                        disabled={isBattleOver || playerState.mp < 5}
                      >
                        Ataque Físico (-5 MP)
                      </Button>
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={handlePsychAnalysis}
                        disabled={isBattleOver || playerState.mp < 10}
                      >
                        Análise Psicológica (-10 MP, -3 Sanidade)
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full border-blue-500 text-blue-300"
                        onClick={handleMeditate}
                        disabled={isBattleOver}
                      >
                        Meditar e Curar (+15 HP)
                      </Button>
                    </div>
                    
                    <div className="mt-6 p-4 bg-black/50 rounded border border-gray-700">
                      <h5 className="font-bold mb-2">Log de Batalha</h5>
                      <div className="text-sm text-gray-400 space-y-1">
                        {battleLog.map((entry, idx) => (
                          <p key={idx}>{entry}</p>
                        ))}
                        {isBattleOver && (
                          <p className="text-red-300">
                            {enemyState.hp <= 0
                              ? "• Você derrotou o Espectro da Vaidade!"
                              : playerState.hp <= 0
                              ? "• Você foi derrotado..."
                              : "• Sua mente sucumbiu às sombras..."}
                          </p>
                        )}
                      </div>
                      <div className="mt-4">
                        <Button variant="outline" className="border-gray-600 text-gray-200" onClick={handleResetBattle}>
                          Reiniciar Batalha
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="lore">
              <Card className="bg-gradient-to-br from-red-900/30 to-purple-900/30 border-red-900/30 p-8">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  Os Segredos da Arena das Sombras
                </h3>
                <div className="prose prose-invert max-w-none space-y-6">
                  <p className="text-gray-300 leading-relaxed text-lg">
                    No coração de uma era esquecida, onde a luz da razão tremeluzia sob o peso de uma 
                    escuridão ancestral, ergue-se a Arena das Sombras. Não é um mero palco de combate, 
                    mas um purgatório etéreo, forjado pelas almas atormentadas de poetas perdidos e 
                    mentes fraturadas.
                  </p>
                  
                  <h4 className="text-xl font-bold text-purple-400 mt-8">O Guardião Corvo</h4>
                  <div className="flex items-start space-x-4">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-purple-900/30 flex-shrink-0">
                      <Image
                        src="/raven-guardian.png"
                        alt="Guardião Corvo"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      Uma criatura ancestral que observa silenciosamente cada batalha. Seus olhos dourados 
                      contêm a sabedoria de eras passadas e as dores de incontáveis almas que buscaram 
                      redenção nestas sombras. Ele é tanto juiz quanto testemunha, guiando os perdidos 
                      através de sua jornada de autodescoberta.
                    </p>
                  </div>
                  
                  <h4 className="text-xl font-bold text-red-400 mt-8">Os Adversários das Obsessões</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-3">
                      <h5 className="font-bold text-purple-300">Espectro da Vaidade</h5>
                      <p className="text-gray-400 text-sm">
                        Manifestação da obsessão pela aparência e reconhecimento. Ataca através de 
                        ilusões que distorcem a autoimagem do jogador.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h5 className="font-bold text-red-300">Carrasco da Culpa</h5>
                      <p className="text-gray-400 text-sm">
                        Personificação do remorso e da culpa. Carrega o peso de pecados não confessados 
                        e atormenta através de memórias dolorosas.
                      </p>
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-blue-400 mt-8">O Medalhão Fragmentado</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Sua única posse neste reino sombrio. Cada fragmento coletado revela mais sobre sua 
                    verdadeira identidade e o motivo de sua presença na Arena. As runas gravadas em sua 
                    superfície mudam conforme sua sanidade mental, revelando verdades ocultas ou 
                    mergulhando-o mais profundamente na loucura.
                  </p>
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

