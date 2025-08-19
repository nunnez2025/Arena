"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Book, Brain, Sparkles, MapPin, Sword, Star, Zap, Map, Lock, Users, Eye, Navigation } from "lucide-react"
import { MotionWrapper } from "./motion-wrapper"
import { AIService } from "@/lib/ai-service"

interface Location {
  id: string
  name: string
  level: number
  description: string
  creatures: string[]
  isUnlocked: boolean
  isCurrent: boolean
  type: "forest" | "dungeon" | "temple" | "city" | "void"
  rewards: string[]
  storyChapter?: number
}

interface StoryChapter {
  id: number
  title: string
  progress: number
  isCompleted: boolean
  locations: string[]
}

export function AIStoryMode() {
  const [currentChapter, setCurrentChapter] = useState(1)
  const [storyData, setStoryData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [playerChoices, setPlayerChoices] = useState<string[]>([])
  const [storyProgress, setStoryProgress] = useState(15)
  const [currentLocation, setCurrentLocation] = useState("floresta-sombria")
  const [playerLevel, setPlayerLevel] = useState(1)
  const [activeTab, setActiveTab] = useState("story")

  const [locations, setLocations] = useState<Location[]>([
    {
      id: "floresta-sombria",
      name: "Floresta Sombria",
      level: 1,
      description: "Uma floresta onde as árvores sussurram segredos antigos e as sombras ganham vida.",
      creatures: ["umbrafox", "garra de sombra", "presa noturna"],
      isUnlocked: true,
      isCurrent: true,
      type: "forest",
      rewards: ["Essência Sombria", "Cristal da Floresta"],
      storyChapter: 1,
    },
    {
      id: "pantano-maldito",
      name: "Pântano Maldito",
      level: 5,
      description: "Águas negras escondem criaturas venenosas em suas turvas profundas.",
      creatures: ["vorgorger", "abismo", "tenebwraith"],
      isUnlocked: false,
      isCurrent: false,
      type: "dungeon",
      rewards: ["Poção Venenosa", "Amuleto do Pântano"],
      storyChapter: 2,
    },
    {
      id: "void-temple",
      name: "Void Temple",
      level: 10,
      description: "A place where shadows and light dance in eternal conflict",
      creatures: ["void guardian", "shadow priest", "light wraith"],
      isUnlocked: false,
      isCurrent: false,
      type: "temple",
      rewards: ["Void Crystal", "Sacred Relic"],
      storyChapter: 3,
    },
    {
      id: "cidade-perdida",
      name: "Cidade Perdida",
      level: 15,
      description: "Ruínas de uma civilização antiga onde ecos do passado ainda ressoam.",
      creatures: ["espectro antigo", "golem de pedra", "alma perdida"],
      isUnlocked: false,
      isCurrent: false,
      type: "city",
      rewards: ["Artefato Antigo", "Pergaminho Místico"],
      storyChapter: 4,
    },
    {
      id: "abismo-eterno",
      name: "Abismo Eterno",
      level: 25,
      description: "O coração das trevas onde apenas os mais corajosos ousam entrar.",
      creatures: ["senhor das sombras", "devorador de almas", "guardião do abismo"],
      isUnlocked: false,
      isCurrent: false,
      type: "void",
      rewards: ["Essência do Vazio", "Coroa das Trevas"],
      storyChapter: 5,
    },
  ])

  const [storyChapters, setStoryChapters] = useState<StoryChapter[]>([
    {
      id: 1,
      title: "A Jornada das Sombras",
      progress: 15,
      isCompleted: false,
      locations: ["floresta-sombria"],
    },
    {
      id: 2,
      title: "Mistérios do Pântano",
      progress: 0,
      isCompleted: false,
      locations: ["pantano-maldito"],
    },
    {
      id: 3,
      title: "O Templo Perdido",
      progress: 0,
      isCompleted: false,
      locations: ["void-temple"],
    },
    {
      id: 4,
      title: "Segredos Ancestrais",
      progress: 0,
      isCompleted: false,
      locations: ["cidade-perdida"],
    },
    {
      id: 5,
      title: "Confronto Final",
      progress: 0,
      isCompleted: false,
      locations: ["abismo-eterno"],
    },
  ])

  useEffect(() => {
    if (activeTab === "story") {
      generateStoryChapter()
    }
  }, [currentChapter, activeTab])

  const generateStoryChapter = async () => {
    setLoading(true)
    try {
      const chapter = await AIService.generateStoryChapter(currentChapter, playerChoices)
      setStoryData(chapter)
    } catch (error) {
      console.error("Erro ao gerar capítulo:", error)
      // Fallback story data
      setStoryData({
        location: locations.find((l) => l.isCurrent)?.name || "Floresta Sombria",
        description: "As sombras dançam entre as árvores antigas...",
        narrative:
          "Você se encontra em uma floresta misteriosa onde cada passo ecoa com segredos antigos. As árvores parecem sussurrar histórias de tempos esquecidos, e você sente uma presença observando seus movimentos.",
        characters: [
          { name: "Guardião da Floresta", role: "Guia Místico" },
          { name: "Sombra Errante", role: "Entidade Misteriosa" },
        ],
        choices: [
          {
            text: "Seguir o caminho iluminado pela lua",
            type: "exploration",
            consequence: "Pode revelar segredos ocultos",
          },
          {
            text: "Investigar os sussurros nas árvores",
            type: "investigation",
            consequence: "Pode encontrar aliados ou inimigos",
          },
          {
            text: "Acampar e esperar o amanhecer",
            type: "rest",
            consequence: "Recupera energia mas pode perder oportunidades",
          },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const makeChoice = async (choice: string) => {
    setPlayerChoices([...playerChoices, choice])
    setStoryProgress(Math.min(100, storyProgress + 10))

    // Gerar próximo segmento baseado na escolha
    try {
      const nextSegment = await AIService.generateStorySegment(choice, storyData)
      setStoryData({ ...storyData, ...nextSegment })
    } catch (error) {
      console.error("Erro ao gerar segmento:", error)
    }
  }

  const nextChapter = () => {
    setCurrentChapter(currentChapter + 1)
    setStoryProgress(Math.min(100, storyProgress + 15))

    // Unlock next location
    const nextLocation = locations.find((l) => l.storyChapter === currentChapter + 1)
    if (nextLocation) {
      setLocations((prev) => prev.map((loc) => (loc.id === nextLocation.id ? { ...loc, isUnlocked: true } : loc)))
    }
  }

  const selectLocation = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId)
    if (location && location.isUnlocked) {
      setLocations((prev) =>
        prev.map((loc) => ({
          ...loc,
          isCurrent: loc.id === locationId,
        })),
      )
      setCurrentLocation(locationId)

      // Update story chapter if needed
      if (location.storyChapter && location.storyChapter !== currentChapter) {
        setCurrentChapter(location.storyChapter)
      }
    }
  }

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case "forest":
        return "🌲"
      case "dungeon":
        return "🏚️"
      case "temple":
        return "🏛️"
      case "city":
        return "🏛️"
      case "void":
        return "🌌"
      default:
        return "📍"
    }
  }

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case "forest":
        return "from-green-900/50 to-emerald-900/50 border-green-500/30"
      case "dungeon":
        return "from-gray-900/50 to-slate-900/50 border-gray-500/30"
      case "temple":
        return "from-purple-900/50 to-violet-900/50 border-purple-500/30"
      case "city":
        return "from-blue-900/50 to-cyan-900/50 border-blue-500/30"
      case "void":
        return "from-black/50 to-purple-900/50 border-purple-500/30"
      default:
        return "from-gray-900/50 to-slate-900/50 border-gray-500/30"
    }
  }

  return (
    <MotionWrapper initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent flex items-center justify-center">
            <Book className="w-8 h-8 mr-2 text-red-400" />
            Modo História IA
          </h2>
          <p className="text-gray-300">História dinâmica com mapa interativo, gerada por múltiplas IAs</p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 bg-gradient-to-r from-red-900/50 to-pink-900/50 border-red-500/30 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-red-300 font-bold">
              Capítulo {currentChapter}: {storyChapters.find((c) => c.id === currentChapter)?.title}
            </span>
            <span className="text-sm text-gray-400">{storyProgress}% Completo</span>
          </div>
          <Progress value={storyProgress} className="h-3" />
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/50 backdrop-blur-sm mb-6">
            <TabsTrigger value="story" className="data-[state=active]:bg-red-600">
              <Book className="w-4 h-4 mr-2" />
              História
            </TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-purple-600">
              <Map className="w-4 h-4 mr-2" />
              Mapa das Sombras
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-blue-600">
              <Star className="w-4 h-4 mr-2" />
              Progresso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="story" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* História Principal */}
              <div className="lg:col-span-2">
                <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500/30 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-purple-300 flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      História Atual
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-600 flex items-center">
                        <Sparkles className="w-3 h-3 mr-1" />
                        IA Ativa
                      </Badge>
                      <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                        <MapPin className="w-3 h-3 mr-1" />
                        {locations.find((l) => l.isCurrent)?.name}
                      </Badge>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      <p className="text-gray-400">Gerando história com IA...</p>
                    </div>
                  ) : storyData ? (
                    <div className="space-y-4">
                      {/* Cenário */}
                      <div className="bg-black/30 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <MapPin className="w-4 h-4 text-cyan-400 mr-2" />
                          <span className="text-cyan-300 font-bold">{storyData.location}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{storyData.description}</p>
                      </div>

                      {/* Narrativa */}
                      <div className="prose prose-invert max-w-none">
                        <p className="text-gray-200 leading-relaxed">{storyData.narrative}</p>
                      </div>

                      {/* Personagens Presentes */}
                      {storyData.characters && (
                        <div className="bg-black/30 p-4 rounded-lg">
                          <h4 className="text-sm font-bold text-purple-300 mb-2 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Personagens Presentes:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {storyData.characters.map((char: any, index: number) => (
                              <Badge key={index} variant="outline" className="border-purple-500 text-purple-400">
                                {char.name} - {char.role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Escolhas */}
                      {storyData.choices && (
                        <div className="space-y-3">
                          <h4 className="text-lg font-bold text-yellow-300 flex items-center">
                            <Zap className="w-5 h-5 mr-2" />
                            Suas Escolhas:
                          </h4>
                          {storyData.choices.map((choice: any, index: number) => (
                            <Button
                              key={index}
                              onClick={() => makeChoice(choice.text)}
                              className={`w-full text-left p-4 h-auto ${
                                choice.type === "combat"
                                  ? "bg-red-600 hover:bg-red-700"
                                  : choice.type === "diplomatic"
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : choice.type === "exploration"
                                      ? "bg-green-600 hover:bg-green-700"
                                      : "bg-purple-600 hover:bg-purple-700"
                              }`}
                            >
                              <div className="flex items-start">
                                {choice.type === "combat" ? (
                                  <Sword className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
                                ) : choice.type === "diplomatic" ? (
                                  <Star className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
                                ) : choice.type === "exploration" ? (
                                  <Navigation className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
                                ) : (
                                  <Brain className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
                                )}
                                <div>
                                  <p className="font-bold">{choice.text}</p>
                                  <p className="text-sm opacity-80 mt-1">{choice.consequence}</p>
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-gray-400">Carregando história...</p>
                    </div>
                  )}
                </Card>

                {/* Ações do Capítulo */}
                <div className="flex gap-4">
                  <Button
                    onClick={nextChapter}
                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                  >
                    <Book className="w-4 h-4 mr-2" />
                    Próximo Capítulo
                  </Button>
                  <Button
                    onClick={generateStoryChapter}
                    variant="outline"
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/20 bg-transparent"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Regenerar com IA
                  </Button>
                  <Button
                    onClick={() => setActiveTab("map")}
                    variant="outline"
                    className="border-green-500 text-green-400 hover:bg-green-500/20 bg-transparent"
                  >
                    <Map className="w-4 h-4 mr-2" />
                    Ver Mapa
                  </Button>
                </div>
              </div>

              {/* Painel Lateral */}
              <div className="space-y-6">
                {/* Status do Jogador */}
                <Card className="bg-gradient-to-br from-green-900/50 to-cyan-900/50 border-green-500/30 p-4">
                  <h3 className="text-lg font-bold text-green-300 mb-3">Status do Herói</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-400">Vida</span>
                        <span className="text-white">85/100</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-400">Mana</span>
                        <span className="text-white">60/80</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-yellow-400">Nível</span>
                        <span className="text-white">{playerLevel}</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                  </div>
                </Card>

                {/* Localização Atual */}
                <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30 p-4">
                  <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Localização Atual
                  </h3>
                  {(() => {
                    const currentLoc = locations.find((l) => l.isCurrent)
                    return currentLoc ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{currentLoc.name}</span>
                          <Badge className="bg-purple-600">Nv.{currentLoc.level}+</Badge>
                        </div>
                        <p className="text-sm text-gray-300">{currentLoc.description}</p>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400">Criaturas:</p>
                          <div className="flex flex-wrap gap-1">
                            {currentLoc.creatures.map((creature, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs px-1 py-0 border-red-500 text-red-400"
                              >
                                {creature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null
                  })()}
                </Card>

                {/* Inventário */}
                <Card className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border-yellow-500/30 p-4">
                  <h3 className="text-lg font-bold text-yellow-300 mb-3">Inventário</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-black/30 rounded">
                      <span className="text-sm">Espada Sombria</span>
                      <Badge className="bg-purple-600">Épico</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-black/30 rounded">
                      <span className="text-sm">Poção de Cura</span>
                      <span className="text-xs text-gray-400">x3</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-black/30 rounded">
                      <span className="text-sm">Cristal Cósmico</span>
                      <Badge className="bg-cyan-600">Raro</Badge>
                    </div>
                  </div>
                </Card>

                {/* Configurações de IA */}
                <Card className="bg-gradient-to-br from-gray-900/50 to-blue-900/50 border-gray-500/30 p-4">
                  <h3 className="text-lg font-bold text-gray-300 mb-3 flex items-center">
                    <Brain className="w-4 h-4 mr-2" />
                    IA Ativa
                  </h3>
                  <div className="space-y-2">
                    <Badge className="w-full justify-center bg-green-600">OpenAI GPT-4</Badge>
                    <p className="text-xs text-gray-400 text-center">
                      Gerando narrativa adaptativa baseada em suas escolhas
                    </p>
                    <Button variant="outline" size="sm" className="w-full border-gray-500 text-gray-400 bg-transparent">
                      Trocar IA
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center">
                <Map className="w-6 h-6 mr-2 text-purple-400" />
                Mapa das Sombras
              </h3>
              <p className="text-gray-300">Explore localizações místicas e desbloqueie novos capítulos</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location, index) => (
                <MotionWrapper
                  key={location.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <Card
                    className={`bg-gradient-to-br ${getLocationTypeColor(location.type)} p-6 cursor-pointer transition-all duration-300 ${
                      location.isCurrent
                        ? "ring-2 ring-purple-500 scale-105"
                        : location.isUnlocked
                          ? "hover:scale-105"
                          : "opacity-60"
                    }`}
                    onClick={() => selectLocation(location.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{getLocationTypeIcon(location.type)}</span>
                        <div>
                          <h3 className="text-lg font-bold text-white">{location.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={location.isUnlocked ? "bg-green-600" : "bg-gray-600"}>
                              Nv.{location.level}+
                            </Badge>
                            {location.isCurrent && <Badge className="bg-purple-600 animate-pulse">Atual</Badge>}
                            {!location.isUnlocked && <Lock className="w-4 h-4 text-gray-400" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4">{location.description}</p>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Criaturas Encontradas:</p>
                        <div className="flex flex-wrap gap-1">
                          {location.creatures.map((creature, i) => (
                            <Badge key={i} variant="outline" className="text-xs px-2 py-1 border-red-500 text-red-400">
                              {creature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 mb-2">Recompensas:</p>
                        <div className="flex flex-wrap gap-1">
                          {location.rewards.map((reward, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs px-2 py-1 border-yellow-500 text-yellow-400"
                            >
                              {reward}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {location.isUnlocked ? (
                      <Button
                        className={`w-full mt-4 ${
                          location.isCurrent
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          selectLocation(location.id)
                          setActiveTab("story")
                        }}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        {location.isCurrent ? "Localização Atual" : "Viajar"}
                      </Button>
                    ) : (
                      <Button disabled className="w-full mt-4 bg-gray-600 cursor-not-allowed">
                        <Lock className="w-4 h-4 mr-2" />
                        Bloqueado
                      </Button>
                    )}
                  </Card>
                </MotionWrapper>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent flex items-center justify-center">
                <Star className="w-6 h-6 mr-2 text-blue-400" />
                Progresso da História
              </h3>
              <p className="text-gray-300">Acompanhe sua jornada através dos capítulos</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {storyChapters.map((chapter, index) => (
                <MotionWrapper
                  key={chapter.id}
                  initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <Card
                    className={`p-6 ${
                      chapter.id === currentChapter
                        ? "bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500/30 ring-2 ring-purple-500"
                        : chapter.isCompleted
                          ? "bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500/30"
                          : "bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-gray-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">
                        Capítulo {chapter.id}: {chapter.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {chapter.isCompleted && (
                          <Badge className="bg-green-600">
                            <Star className="w-3 h-3 mr-1" />
                            Completo
                          </Badge>
                        )}
                        {chapter.id === currentChapter && (
                          <Badge className="bg-purple-600 animate-pulse">
                            <Eye className="w-3 h-3 mr-1" />
                            Atual
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Progresso</span>
                          <span className="text-white">{chapter.progress}%</span>
                        </div>
                        <Progress value={chapter.progress} className="h-2" />
                      </div>

                      <div>
                        <p className="text-sm text-gray-400 mb-2">Localizações:</p>
                        <div className="flex flex-wrap gap-2">
                          {chapter.locations.map((locationId) => {
                            const location = locations.find((l) => l.id === locationId)
                            return location ? (
                              <Badge
                                key={locationId}
                                variant="outline"
                                className={`text-xs px-2 py-1 ${
                                  location.isUnlocked
                                    ? "border-green-500 text-green-400"
                                    : "border-gray-500 text-gray-400"
                                }`}
                              >
                                {getLocationTypeIcon(location.type)} {location.name}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </div>
                    </div>

                    {chapter.id === currentChapter && (
                      <Button
                        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        onClick={() => setActiveTab("story")}
                      >
                        <Book className="w-4 h-4 mr-2" />
                        Continuar História
                      </Button>
                    )}
                  </Card>
                </MotionWrapper>
              ))}
            </div>

            {/* Conquistas da História */}
            <Card className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border-yellow-500/30 p-6">
              <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Conquistas da História
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center p-3 bg-black/30 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-400 mr-3" />
                  <div>
                    <p className="font-bold text-white">Primeiro Passo</p>
                    <p className="text-xs text-gray-400">Iniciou a jornada</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-black/30 rounded-lg">
                  <Sword className="w-6 h-6 text-red-400 mr-3" />
                  <div>
                    <p className="font-bold text-white">Guerreiro Corajoso</p>
                    <p className="text-xs text-gray-400">Venceu primeira batalha</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-black/30 rounded-lg opacity-50">
                  <Brain className="w-6 h-6 text-gray-400 mr-3" />
                  <div>
                    <p className="font-bold text-gray-400">Mestre Estrategista</p>
                    <p className="text-xs text-gray-400">Complete 5 capítulos</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MotionWrapper>
  )
}
