"use client"

import { useEffect, useRef } from "react"

interface GameEngineProps {
  onGameLoad?: () => void
}

export function GameEngine({ onGameLoad }: GameEngineProps) {
  const gameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && gameRef.current) {
      // Initialize Phaser game engine
      initializePhaserGame()
    }
  }, [])

  const initializePhaserGame = () => {
    // Phaser game configuration would go here
    // This is a placeholder for the actual Phaser.js integration
    console.log("Initializing Phaser game engine...")

    // Simulate game loading
    setTimeout(() => {
      onGameLoad?.()
    }, 1000)
  }

  return <div ref={gameRef} id="phaser-game" className="w-full h-full" style={{ minHeight: "600px" }} />
}

// Game classes and utilities
export class Character {
  constructor(
    public name: string,
    public hp: number,
    public maxHp: number,
    public mp: number,
    public maxMp: number,
    public attack: number,
    public defense: number,
    public speed: number,
  ) {}

  takeDamage(damage: number): number {
    const actualDamage = Math.max(1, damage - this.defense)
    this.hp = Math.max(0, this.hp - actualDamage)
    return actualDamage
  }

  heal(amount: number): number {
    const actualHeal = Math.min(amount, this.maxHp - this.hp)
    this.hp += actualHeal
    return actualHeal
  }

  canUseSkill(mpCost: number): boolean {
    return this.mp >= mpCost
  }

  useSkill(mpCost: number): boolean {
    if (this.canUseSkill(mpCost)) {
      this.mp -= mpCost
      return true
    }
    return false
  }
}

export class BattleSystem {
  private turnQueue: Character[] = []
  private currentTurnIndex = 0

  constructor(
    private players: Character[],
    private enemies: Character[],
  ) {
    this.initializeTurnOrder()
  }

  private initializeTurnOrder() {
    const allCharacters = [...this.players, ...this.enemies]
    this.turnQueue = allCharacters.sort((a, b) => b.speed - a.speed)
  }

  getCurrentCharacter(): Character {
    return this.turnQueue[this.currentTurnIndex]
  }

  nextTurn(): Character {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnQueue.length
    return this.getCurrentCharacter()
  }

  isPlayerTurn(): boolean {
    return this.players.includes(this.getCurrentCharacter())
  }

  isBattleOver(): { isOver: boolean; winner?: "player" | "enemy" } {
    const playersAlive = this.players.some((p) => p.hp > 0)
    const enemiesAlive = this.enemies.some((e) => e.hp > 0)

    if (!playersAlive) {
      return { isOver: true, winner: "enemy" }
    }
    if (!enemiesAlive) {
      return { isOver: true, winner: "player" }
    }
    return { isOver: false }
  }
}

export interface Skill {
  id: string
  name: string
  description: string
  mpCost: number
  damage?: number
  heal?: number
  type: "attack" | "heal" | "buff" | "debuff"
  animation: string
}

export const SKILLS: Record<string, Skill> = {
  shadowStrike: {
    id: "shadowStrike",
    name: "Shadow Strike",
    description: "Um ataque sombrio devastador",
    mpCost: 15,
    damage: 35,
    type: "attack",
    animation: "shadow-strike",
  },
  cosmicHeal: {
    id: "cosmicHeal",
    name: "Cosmic Heal",
    description: "Cura usando energia cósmica",
    mpCost: 10,
    heal: 40,
    type: "heal",
    animation: "cosmic-heal",
  },
  voidBlast: {
    id: "voidBlast",
    name: "Void Blast",
    description: "Explosão de energia do vazio",
    mpCost: 20,
    damage: 50,
    type: "attack",
    animation: "void-blast",
  },
}
