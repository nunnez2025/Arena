"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Brain, Sparkles, Wand2, ImageIcon, Zap, Star } from "lucide-react"
import { MotionWrapper } from "./motion-wrapper"
import { AIService } from "@/lib/ai-service"

export function AICharacterGenerator() {
  const [generating, setGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [generatedCharacter, setGeneratedCharacter] = useState<any>(null)
  const [selectedAI, setSelectedAI] = useState("openai")

  const aiOptions = [
    { id: "openai", name: "OpenAI GPT-4", color: "green", icon: Brain },
    { id: "gemini", name: "Google Gemini", color: "blue", icon: Sparkles },
    { id: "deepseek", name: "DeepSeek", color: "purple", icon: Zap },
    { id: "grok", name: "Grok X", color: "red", icon: Star },
  ]

  const generateCharacter = async () => {
    if (!prompt.trim()) return

    setGenerating(true)
    try {
      const character = await AIService.generateCharacter(prompt, selectedAI)
      setGeneratedCharacter(character)
    } catch (error) {
      console.error("Erro ao gerar personagem:", error)
    } finally {
      setGenerating(false)
    }
  }

  const generateImage = async () => {
    if (!generatedCharacter) return

    try {
      const imageUrl = await AIService.generateImage(generatedCharacter.description)
      setGeneratedCharacter((prev: any) => ({ ...prev, imageUrl }))
    } catch (error) {
      console.error("Erro ao gerar imagem:", error)
    }
  }

  const mintAsNFT = async () => {
    if (!generatedCharacter) return

    try {
      const nft = await AIService.mintCharacterAsNFT(generatedCharacter)
      console.log("NFT criado:", nft)
      // Adicionar à coleção do jogador
    } catch (error) {
      console.error("Erro ao criar NFT:", error)
    }
  }

  return (
    <MotionWrapper initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent flex items-center justify-center">
            <Brain className="w-8 h-8 mr-2 text-green-400" />
            Gerador de Personagens IA
          </h2>
          <p className="text-gray-300">Crie personagens únicos usando múltiplas IAs avançadas</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Painel de Geração */}
          <Card className="bg-gradient-to-br from-green-900/50 to-blue-900/50 border-green-500/30 p-6">
            <h3 className="text-xl font-bold text-green-300 mb-4 flex items-center">
              <Wand2 className="w-5 h-5 mr-2" />
              Criar Personagem
            </h3>

            {/* Seleção de IA */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Escolha a IA:</label>
              <div className="grid grid-cols-2 gap-2">
                {aiOptions.map((ai) => (
                  <Button
                    key={ai.id}
                    variant={selectedAI === ai.id ? "default" : "outline"}
                    onClick={() => setSelectedAI(ai.id)}
                    className={`${
                      selectedAI === ai.id
                        ? `bg-${ai.color}-600 hover:bg-${ai.color}-700`
                        : `border-${ai.color}-500 text-${ai.color}-400 hover:bg-${ai.color}-500/20`
                    } transition-all`}
                    size="sm"
                  >
                    <ai.icon className="w-4 h-4 mr-1" />
                    {ai.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Descreva seu personagem:</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Um guerreiro sombrio com poderes cósmicos, especialista em magia elemental..."
                className="bg-black/30 border-gray-600 text-white"
                rows={4}
              />
            </div>

            <Button
              onClick={generateCharacter}
              disabled={generating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              size="lg"
            >
              {generating ? (
                <>
                  <div className="loading-spinner w-5 h-5 mr-2" />
                  Gerando com {aiOptions.find((ai) => ai.id === selectedAI)?.name}...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Gerar Personagem
                </>
              )}
            </Button>
          </Card>

          {/* Resultado */}
          <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30 p-6">
            <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Personagem Gerado
            </h3>

            {generatedCharacter ? (
              <div className="space-y-4">
                {/* Imagem */}
                <div className="w-full h-48 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {generatedCharacter.imageUrl ? (
                    <img
                      src={generatedCharacter.imageUrl || "/placeholder.svg"}
                      alt={generatedCharacter.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Star className="w-16 h-16 text-white mb-2 animate-pulse" />
                      <Button onClick={generateImage} variant="outline" size="sm">
                        <ImageIcon className="w-4 h-4 mr-1" />
                        Gerar Imagem
                      </Button>
                    </div>
                  )}
                </div>

                {/* Informações */}
                <div>
                  <h4 className="text-lg font-bold text-purple-300 mb-2">{generatedCharacter.name}</h4>
                  <p className="text-sm text-gray-300 mb-3">{generatedCharacter.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-black/30 p-2 rounded">
                      <span className="text-xs text-gray-400">HP:</span>
                      <span className="text-white font-bold ml-2">{generatedCharacter.stats?.hp || 100}</span>
                    </div>
                    <div className="bg-black/30 p-2 rounded">
                      <span className="text-xs text-gray-400">Ataque:</span>
                      <span className="text-white font-bold ml-2">{generatedCharacter.stats?.attack || 75}</span>
                    </div>
                    <div className="bg-black/30 p-2 rounded">
                      <span className="text-xs text-gray-400">Defesa:</span>
                      <span className="text-white font-bold ml-2">{generatedCharacter.stats?.defense || 60}</span>
                    </div>
                    <div className="bg-black/30 p-2 rounded">
                      <span className="text-xs text-gray-400">Velocidade:</span>
                      <span className="text-white font-bold ml-2">{generatedCharacter.stats?.speed || 80}</span>
                    </div>
                  </div>

                  {/* Habilidades */}
                  {generatedCharacter.abilities && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">Habilidades:</p>
                      <div className="flex flex-wrap gap-1">
                        {generatedCharacter.abilities.map((ability: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs border-cyan-500 text-cyan-400">
                            {ability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raridade */}
                  <div className="flex justify-between items-center mb-4">
                    <Badge
                      className={`${
                        generatedCharacter.rarity === "Legendary"
                          ? "bg-yellow-600"
                          : generatedCharacter.rarity === "Epic"
                            ? "bg-purple-600"
                            : "bg-blue-600"
                      }`}
                    >
                      {generatedCharacter.rarity || "Rare"}
                    </Badge>
                    <span className="text-sm text-gray-400">
                      Gerado por: {aiOptions.find((ai) => ai.id === selectedAI)?.name}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="space-y-2">
                    <Button onClick={mintAsNFT} className="w-full bg-gradient-to-r from-yellow-600 to-orange-600">
                      <Star className="w-4 h-4 mr-2" />
                      Criar NFT (100 SHADOW)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-purple-500 text-purple-400 hover:bg-purple-500/20 bg-transparent"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Testar em Batalha
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum personagem gerado ainda</p>
                <p className="text-sm">Use o painel ao lado para criar um personagem único</p>
              </div>
            )}
          </Card>
        </div>

        {/* Galeria de Personagens Recentes */}
        <Card className="mt-8 bg-gradient-to-br from-gray-900/50 to-blue-900/50 border-gray-500/30 p-6">
          <h3 className="text-xl font-bold text-gray-300 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Personagens Recentes da Comunidade
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-black/30 p-3 rounded-lg">
                <div className="w-full h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded mb-2"></div>
                <p className="text-sm font-bold text-white">Personagem #{i}</p>
                <p className="text-xs text-gray-400">Por: Jogador{i}</p>
                <Badge className="bg-green-600 text-xs mt-1">Disponível</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MotionWrapper>
  )
}
