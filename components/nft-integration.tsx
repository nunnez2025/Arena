"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Zap, Shield, Sword } from "lucide-react"

interface NFTItem {
  id: string
  name: string
  description: string
  rarity: "Common" | "Rare" | "Epic" | "Legendary"
  type: "weapon" | "armor" | "accessory" | "character"
  stats: {
    attack?: number
    defense?: number
    hp?: number
    mp?: number
    speed?: number
  }
  image: string
  owned: boolean
  price?: number
}

export function NFTIntegration() {
  const [nftItems, setNftItems] = useState<NFTItem[]>([])
  const [selectedItem, setSelectedItem] = useState<NFTItem | null>(null)

  useEffect(() => {
    // Load NFT items from blockchain/API
    loadNFTItems()
  }, [])

  const loadNFTItems = async () => {
    // Simulate loading NFT items
    const items: NFTItem[] = [
      {
        id: "shadow-warrior-001",
        name: "Shadow Warrior Elite",
        description: "Um guerreiro das sombras com poderes ancestrais",
        rarity: "Legendary",
        type: "character",
        stats: { attack: 95, defense: 80, hp: 150, mp: 100, speed: 75 },
        image: "/placeholder.svg?height=200&width=200",
        owned: true,
      },
      {
        id: "cosmic-blade-001",
        name: "Cosmic Blade",
        description: "Espada forjada com energia cósmica",
        rarity: "Epic",
        type: "weapon",
        stats: { attack: 87, speed: 10 },
        image: "/placeholder.svg?height=200&width=200",
        owned: true,
      },
      {
        id: "void-armor-001",
        name: "Void Guardian Armor",
        description: "Armadura que absorve ataques sombrios",
        rarity: "Rare",
        type: "armor",
        stats: { defense: 76, hp: 50 },
        image: "/placeholder.svg?height=200&width=200",
        owned: false,
        price: 250,
      },
      {
        id: "shadow-cloak-001",
        name: "Shadow Cloak",
        description: "Manto que aumenta velocidade e evasão",
        rarity: "Common",
        type: "accessory",
        stats: { speed: 25, defense: 15 },
        image: "/placeholder.svg?height=200&width=200",
        owned: true,
      },
    ]
    setNftItems(items)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Legendary":
        return "bg-yellow-600"
      case "Epic":
        return "bg-purple-600"
      case "Rare":
        return "bg-blue-600"
      default:
        return "bg-gray-600"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "weapon":
        return <Sword className="w-4 h-4" />
      case "armor":
        return <Shield className="w-4 h-4" />
      case "character":
        return <Star className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  const mintNFT = async (itemId: string) => {
    // Simulate NFT minting process
    console.log(`Minting NFT: ${itemId}`)
    // Update item as owned
    setNftItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, owned: true } : item)))
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Coleção NFT
        </h2>
        <p className="text-gray-300">Colecione, negocie e use NFTs únicos para potencializar seu personagem</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nftItems.map((item) => (
          <Card
            key={item.id}
            className={`bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500/30 p-4 cursor-pointer transition-transform hover:scale-105 ${
              selectedItem?.id === item.id ? "ring-2 ring-purple-500" : ""
            }`}
            onClick={() => setSelectedItem(item)}
          >
            <div className="relative">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <Badge className={`absolute top-2 right-2 ${getRarityColor(item.rarity)}`}>{item.rarity}</Badge>
              <div className="absolute top-2 left-2 bg-black/70 rounded-full p-2">{getTypeIcon(item.type)}</div>
            </div>

            <h3 className="text-lg font-bold text-purple-300 mb-2">{item.name}</h3>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{item.description}</p>

            <div className="space-y-2 mb-4">
              {Object.entries(item.stats).map(([stat, value]) => (
                <div key={stat} className="flex justify-between text-sm">
                  <span className="text-gray-400 capitalize">{stat}:</span>
                  <span className="text-white font-bold">+{value}</span>
                </div>
              ))}
            </div>

            {item.owned ? (
              <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                Equipado
              </Button>
            ) : (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  mintNFT(item.id)
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                size="sm"
              >
                Comprar - {item.price} SHADOW
              </Button>
            )}
          </Card>
        ))}
      </div>

      {selectedItem && (
        <Card className="bg-gradient-to-br from-purple-900/70 to-blue-900/70 border-purple-500/50 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <img
                src={selectedItem.image || "/placeholder.svg"}
                alt={selectedItem.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-2xl font-bold text-purple-300">{selectedItem.name}</h3>
                <Badge className={getRarityColor(selectedItem.rarity)}>{selectedItem.rarity}</Badge>
              </div>
              <p className="text-gray-300 mb-4">{selectedItem.description}</p>

              <div className="space-y-3">
                <h4 className="text-lg font-bold text-white">Atributos:</h4>
                {Object.entries(selectedItem.stats).map(([stat, value]) => (
                  <div key={stat} className="flex justify-between items-center">
                    <span className="text-gray-400 capitalize">{stat}:</span>
                    <span className="text-white font-bold text-lg">+{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                {selectedItem.owned ? (
                  <>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">Equipar</Button>
                    <Button variant="outline" className="flex-1 border-purple-500 text-purple-400 bg-transparent">
                      Vender
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => mintNFT(selectedItem.id)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    Comprar - {selectedItem.price} SHADOW
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export function BlockchainIntegration() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [shadowBalance, setShadowBalance] = useState(1250)
  const [nftCount, setNftCount] = useState(4)

  const connectWallet = async () => {
    // Simulate wallet connection
    setWalletConnected(true)
  }

  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Blockchain Wallet</h3>
            <p className="text-sm text-gray-400">{walletConnected ? "Conectado" : "Desconectado"}</p>
          </div>
        </div>

        {walletConnected ? (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">SHADOW Tokens</p>
              <p className="font-bold text-yellow-400">{shadowBalance.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">NFTs</p>
              <p className="font-bold text-purple-400">{nftCount}</p>
            </div>
          </div>
        ) : (
          <Button onClick={connectWallet} className="bg-gradient-to-r from-purple-600 to-blue-600">
            Conectar Wallet
          </Button>
        )}
      </div>
    </div>
  )
}
