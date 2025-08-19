/**
 * Colyseus Battle Room Integration
 * Integrates the battle system with Colyseus for multiplayer support
 */

const { Room } = require("colyseus")
const { Schema, MapSchema, ArraySchema, type } = require("@colyseus/schema")
const BattleManager = require("../BattleManager")
const AIController = require("../AIController")

// Colyseus State Schemas
class BattleParticipantState extends Schema {}
type({
  id: "string",
  name: "string",
  type: "string",
  team: "string",
  level: "number",
  stats: "object",
  statusEffects: { map: "object" },
  skills: ["string"],
  items: ["object"],
  position: "object",
  isAlive: "boolean",
  isActive: "boolean",
  sprite: "string",
  portrait: "string",
})(BattleParticipantState)

class BattleRoomState extends Schema {}
type({
  battleId: "string",
  phase: "string",
  currentTurn: "number",
  turnQueue: ["string"],
  participants: { map: BattleParticipantState },
  battleLog: ["object"],
  winner: "string",
  config: "object",
})(BattleRoomState)

class ColyseuseBattleRoom extends Room {
  onCreate(options) {
    console.log("[ColyseuseBattleRoom] Creating battle room with options:", options)

    this.setState(new BattleRoomState())
    this.maxClients = options.maxClients || 6

    // Initialize battle configuration
    this.battleConfig = this.loadBattleConfig()

    // Initialize AI Controller
    this.aiController = new AIController(this.battleConfig)

    // Initialize Battle Manager
    this.battleManager = new BattleManager(this, this.battleConfig)
    this.battleManager.initialize(this.aiController)

    // Set initial state
    this.state.battleId = this.battleManager.state.battleId
    this.state.phase = "waiting"
    this.state.currentTurn = 0
    this.state.turnQueue = new ArraySchema()
    this.state.participants = new MapSchema()
    this.state.battleLog = new ArraySchema()
    this.state.winner = ""
    this.state.config = this.battleConfig

    // Auto-start battle after delay if enough players
    this.autoStartTimer = this.clock.setTimeout(() => {
      if (this.clients.length > 0 && this.state.phase === "waiting") {
        this.startBattle()
      }
    }, 5000)

    console.log(`[ColyseuseBattleRoom] Battle room created: ${this.state.battleId}`)
  }

  onJoin(client, options) {
    console.log(`[ColyseuseBattleRoom] Player ${client.sessionId} joined battle`)

    // Add participant to battle manager
    const participantData = {
      name: options.playerName || `Player_${client.sessionId.substr(0, 6)}`,
      type: "player",
      team: "player",
      level: options.level || 1,
      maxHp: options.maxHp || 100,
      maxMp: options.maxMp || 50,
      attack: options.attack || 20,
      defense: options.defense || 15,
      speed: options.speed || 10,
      accuracy: options.accuracy || 90,
      evasion: options.evasion || 5,
      skills: options.skills || ["attack"],
      items: options.items || [
        { id: "health_potion", name: "Health Potion", quantity: 3, usableInBattle: true },
        { id: "mana_potion", name: "Mana Potion", quantity: 2, usableInBattle: true },
      ],
      position: { x: 150, y: 200 + this.clients.length * 80 },
      sprite: options.sprite || "warrior",
      portrait: options.portrait || "warrior_portrait",
    }

    const participant = this.battleManager.addParticipant(client.sessionId, participantData)

    // Add to Colyseus state
    const participantState = new BattleParticipantState()
    participantState.assign(participant)
    this.state.participants.set(client.sessionId, participantState)

    // Send welcome message
    client.send("battle-joined", {
      battleId: this.state.battleId,
      participantId: client.sessionId,
      participant: participant,
      config: this.battleConfig,
    })

    // Update turn queue
    this.updateColyseusState()
  }

  onMessage(client, type, message) {
    console.log(`[ColyseuseBattleRoom] Message from ${client.sessionId}:`, type, message)

    switch (type) {
      case "battle-action":
        this.handleBattleAction(client, message)
        break

      case "ready-for-battle":
        this.handlePlayerReady(client)
        break

      case "player-disconnected":
        this.handlePlayerDisconnection(client.sessionId)
        break

      case "player-reconnected":
        this.handlePlayerReconnection(client.sessionId)
        break

      default:
        console.warn(`[ColyseuseBattleRoom] Unknown message type: ${type}`)
    }
  }

  onLeave(client, consented) {
    console.log(`[ColyseuseBattleRoom] Player ${client.sessionId} left battle`)

    // Handle disconnection in battle manager
    this.battleManager.handlePlayerDisconnection(client.sessionId)

    // Update Colyseus state
    this.updateColyseusState()

    // End battle if no players left
    if (this.clients.length === 0) {
      this.disconnect()
    }
  }

  handleBattleAction(client, action) {
    // Validate that it's the player's turn
    const currentTurnId =
      this.battleManager.state.turnQueue[
        this.battleManager.state.currentTurn % this.battleManager.state.turnQueue.length
      ]

    if (client.sessionId !== currentTurnId) {
      client.send("error", { message: "Not your turn!" })
      return
    }

    // Execute action through battle manager
    this.battleManager.executeAction(client.sessionId, action)
  }

  handlePlayerReady(client) {
    console.log(`[ColyseuseBattleRoom] Player ${client.sessionId} is ready`)

    // Check if all players are ready
    const allReady = this.clients.every((c) => c.userData?.ready)

    if (allReady && this.state.phase === "waiting") {
      this.startBattle()
    }
  }

  handlePlayerDisconnection(sessionId) {
    this.battleManager.handlePlayerDisconnection(sessionId)
    this.updateColyseusState()
  }

  handlePlayerReconnection(sessionId) {
    this.battleManager.handlePlayerReconnection(sessionId)
    this.updateColyseusState()
  }

  async startBattle() {
    if (this.state.phase !== "waiting") return

    console.log(`[ColyseuseBattleRoom] Starting battle: ${this.state.battleId}`)

    // Clear auto-start timer
    if (this.autoStartTimer) {
      this.autoStartTimer.clear()
    }

    // Start battle in battle manager
    await this.battleManager.startBattle()

    // Update Colyseus state
    this.updateColyseusState()
  }

  updateColyseusState() {
    // Sync battle manager state with Colyseus state
    this.state.phase = this.battleManager.state.phase
    this.state.currentTurn = this.battleManager.state.currentTurn
    this.state.winner = this.battleManager.state.winner || ""

    // Update turn queue
    this.state.turnQueue.clear()
    this.battleManager.state.turnQueue.forEach((id) => {
      this.state.turnQueue.push(id)
    })

    // Update participants
    this.battleManager.state.participants.forEach((participant, id) => {
      if (this.state.participants.has(id)) {
        this.state.participants.get(id).assign(participant)
      } else {
        const participantState = new BattleParticipantState()
        participantState.assign(participant)
        this.state.participants.set(id, participantState)
      }
    })

    // Update battle log
    this.state.battleLog.clear()
    this.battleManager.state.battleLog.forEach((entry) => {
      this.state.battleLog.push(entry)
    })
  }

  loadBattleConfig() {
    // Load battle configuration
    const fs = require("fs")
    const path = require("path")

    try {
      const configPath = path.join(__dirname, "../config/battle-config.json")
      const aiProvidersPath = path.join(__dirname, "../config/ai-providers.json")

      const battleConfig = JSON.parse(fs.readFileSync(configPath, "utf8"))
      const aiProviders = JSON.parse(fs.readFileSync(aiProvidersPath, "utf8"))

      return {
        ...battleConfig,
        ...aiProviders,
      }
    } catch (error) {
      console.error("[ColyseuseBattleRoom] Error loading battle config:", error)
      return this.getDefaultBattleConfig()
    }
  }

  getDefaultBattleConfig() {
    return {
      turnTimeLimit: 30000,
      maxParticipants: 6,
      environment: "forest",
      skills: {
        fireball: {
          id: "fireball",
          name: "Fireball",
          type: "damage",
          power: 40,
          mpCost: 15,
          animation: "fire_cast",
          targetType: "single_enemy",
          description: "Launches a blazing fireball at the enemy",
        },
        heal: {
          id: "heal",
          name: "Heal",
          type: "heal",
          power: 50,
          mpCost: 12,
          animation: "heal_cast",
          targetType: "single_ally",
          description: "Restores HP to target ally",
        },
      },
      items: {
        health_potion: {
          id: "health_potion",
          name: "Health Potion",
          effect: "heal",
          power: 30,
          usableInBattle: true,
          targetType: "single_ally",
          description: "Restores 30 HP",
        },
      },
      enemies: {
        shadow_warrior: {
          name: "Shadow Warrior",
          level: 3,
          stats: {
            hp: 90,
            mp: 20,
            attack: 22,
            defense: 18,
            speed: 10,
            accuracy: 85,
            evasion: 5,
          },
          skills: ["dark_slash"],
          aiType: "aggressive",
          aiPersonality: "hostile",
          sprite: "shadow_warrior",
          portrait: "shadow_warrior_portrait",
        },
      },
      aiProviders: {
        local: {
          type: "local",
          timeout: 1000,
        },
      },
    }
  }

  onDispose() {
    console.log(`[ColyseuseBattleRoom] Disposing battle room: ${this.state.battleId}`)

    // Clean up battle manager
    if (this.battleManager) {
      this.battleManager.destroy()
    }

    // Clear timers
    if (this.autoStartTimer) {
      this.autoStartTimer.clear()
    }
  }
}

module.exports = ColyseuseBattleRoom
