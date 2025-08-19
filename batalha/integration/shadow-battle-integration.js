/**
 * Shadow Battle Integration - Connects NFT Shadow system with battle arena
 * Handles battle initiation, team selection, and results processing
 */

const ShadowBattleScene = require("../ShadowBattleScene")
const ShadowNFTManager = require("../ShadowNFTManager")

class ShadowBattleIntegration {
  constructor(gameManager) {
    this.gameManager = gameManager
    this.shadowManager = null
    this.activeBattles = new Map()
    this.playerQueues = new Map()

    console.log("[ShadowBattleIntegration] Initialized shadow battle integration")
  }

  initialize() {
    // Load shadow configuration
    const shadowConfig = this.loadShadowConfig()

    // Initialize Shadow NFT Manager
    this.shadowManager = new ShadowNFTManager(shadowConfig)

    // Setup event listeners
    this.setupEventListeners()

    // Register battle triggers
    this.registerBattleTriggers()

    console.log("[ShadowBattleIntegration] Shadow battle system ready")
  }

  loadShadowConfig() {
    try {
      const fs = require("fs")
      const path = require("path")
      const configPath = path.join(__dirname, "../config/shadow-nft-config.json")
      return JSON.parse(fs.readFileSync(configPath, "utf8"))
    } catch (error) {
      console.error("[ShadowBattleIntegration] Error loading config:", error)
      return this.getDefaultConfig()
    }
  }

  getDefaultConfig() {
    return {
      shadowClasses: {
        Invoker: {
          baseStats: { powerMultiplier: 1.2, defenseMultiplier: 0.8, speedMultiplier: 1.0 },
          preferredElements: ["Dark", "Light"],
          aiPersonality: "strategic",
        },
      },
      elements: {
        Dark: { color: "#6600cc", strengths: ["Light"], weaknesses: ["Tech"] },
      },
      rarities: {
        Common: { statMultiplier: 1.0, dropRate: 0.6 },
      },
      affinities: {
        Chaos: { bonuses: { powerBonus: 0.15 } },
      },
    }
  }

  setupEventListeners() {
    // Listen for player battle requests
    this.gameManager.events.on("player.request_battle", this.handleBattleRequest.bind(this))
    this.gameManager.events.on("player.join_queue", this.handleJoinQueue.bind(this))
    this.gameManager.events.on("player.leave_queue", this.handleLeaveQueue.bind(this))

    // Listen for battle events
    this.gameManager.events.on("shadow_battle.started", this.handleBattleStarted.bind(this))
    this.gameManager.events.on("shadow_battle.ended", this.handleBattleEnded.bind(this))
  }

  registerBattleTriggers() {
    // Register arena entry triggers
    this.gameManager.roomsManager.registerZoneHandler("shadow_arena", (player, zone) => {
      this.offerBattleOptions(player)
    })

    // Register NPC battle trainers
    this.gameManager.objectsManager.registerInteractionHandler("shadow_trainer", (player, npc) => {
      this.initiatePvEBattle(player, npc)
    })
  }

  async handleBattleRequest(data) {
    const { playerId, battleType, options } = data

    try {
      switch (battleType) {
        case "pve":
          await this.initiatePvEBattle(playerId, options)
          break
        case "pvp":
          await this.initiatePvPBattle(playerId, options)
          break
        case "ranked":
          await this.initiateRankedBattle(playerId, options)
          break
        default:
          console.warn(`[ShadowBattleIntegration] Unknown battle type: ${battleType}`)
      }
    } catch (error) {
      console.error(`[ShadowBattleIntegration] Error handling battle request:`, error)
      this.sendErrorToPlayer(playerId, "Failed to start battle")
    }
  }

  async initiatePvEBattle(playerId, options = {}) {
    console.log(`[ShadowBattleIntegration] Initiating PvE battle for player: ${playerId}`)

    // Get or create player's shadow collection
    let playerShadows = this.shadowManager.getPlayerCollection(playerId)
    if (playerShadows.length === 0) {
      playerShadows = this.shadowManager.createPlayerCollection(playerId, 3)
    }

    // Select player's battle team
    const playerTeam = this.shadowManager.generateBattleTeam(playerId, 3)

    // Generate enemy team
    const playerLevel = this.getPlayerLevel(playerId)
    const enemyTeam = this.shadowManager.generateEnemyTeam(playerLevel, 3)

    // Get player's master affinity
    const masterAffinity = await this.getPlayerMasterAffinity(playerId)

    // Apply affinity bonuses to player team
    playerTeam.forEach((shadow) => {
      this.shadowManager.applyAffinityBonus(shadow, masterAffinity)
    })

    // Create battle data
    const battleData = {
      battleId: this.generateBattleId(),
      type: "pve",
      playerShadows: playerTeam,
      enemyShadows: enemyTeam,
      masterAffinity: masterAffinity,
      playerName: await this.getPlayerName(playerId),
      enemyName: "Shadow Legion",
      environment: options.environment || "cyber_arena",
    }

    // Start battle scene
    await this.startBattleScene(playerId, battleData)
  }

  async initiatePvPBattle(challengerId, options = {}) {
    const { targetPlayerId } = options

    if (!targetPlayerId) {
      this.sendErrorToPlayer(challengerId, "No target player specified")
      return
    }

    console.log(`[ShadowBattleIntegration] Initiating PvP battle: ${challengerId} vs ${targetPlayerId}`)

    // Get both players' teams
    const challengerTeam = this.shadowManager.generateBattleTeam(challengerId, 3)
    const targetTeam = this.shadowManager.generateBattleTeam(targetPlayerId, 3)

    // Get master affinities
    const challengerAffinity = await this.getPlayerMasterAffinity(challengerId)
    const targetAffinity = await this.getPlayerMasterAffinity(targetPlayerId)

    // Apply affinity bonuses
    challengerTeam.forEach((shadow) => {
      this.shadowManager.applyAffinityBonus(shadow, challengerAffinity)
    })

    targetTeam.forEach((shadow) => {
      this.shadowManager.applyAffinityBonus(shadow, targetAffinity)
    })

    // Create battle data
    const battleData = {
      battleId: this.generateBattleId(),
      type: "pvp",
      playerShadows: challengerTeam,
      enemyShadows: targetTeam,
      masterAffinity: challengerAffinity,
      playerName: await this.getPlayerName(challengerId),
      enemyName: await this.getPlayerName(targetPlayerId),
      environment: "pvp_arena",
      players: [challengerId, targetPlayerId],
    }

    // Start battle for both players
    await this.startBattleScene(challengerId, battleData)
    await this.startBattleScene(targetPlayerId, battleData)
  }

  async startBattleScene(playerId, battleData) {
    const player = this.gameManager.getPlayerBySessionId(playerId)
    if (!player) {
      console.error(`[ShadowBattleIntegration] Player not found: ${playerId}`)
      return
    }

    // Store active battle
    this.activeBattles.set(playerId, battleData)

    // Send battle start data to player
    player.send("shadow_battle_start", {
      battleData: battleData,
      sceneKey: "ShadowBattleScene",
    })

    // Freeze player in overworld
    player.send("freeze_movement", { reason: "shadow_battle" })

    console.log(`[ShadowBattleIntegration] Battle scene started for player: ${playerId}`)
  }

  handleJoinQueue(data) {
    const { playerId, queueType } = data

    if (!this.playerQueues.has(queueType)) {
      this.playerQueues.set(queueType, [])
    }

    const queue = this.playerQueues.get(queueType)

    // Check if player already in queue
    if (queue.includes(playerId)) {
      return
    }

    queue.push(playerId)

    console.log(`[ShadowBattleIntegration] Player ${playerId} joined ${queueType} queue`)

    // Try to match players
    this.tryMatchmaking(queueType)
  }

  handleLeaveQueue(data) {
    const { playerId, queueType } = data

    if (!this.playerQueues.has(queueType)) return

    const queue = this.playerQueues.get(queueType)
    const index = queue.indexOf(playerId)

    if (index !== -1) {
      queue.splice(index, 1)
      console.log(`[ShadowBattleIntegration] Player ${playerId} left ${queueType} queue`)
    }
  }

  tryMatchmaking(queueType) {
    const queue = this.playerQueues.get(queueType)

    if (queue.length >= 2) {
      const player1 = queue.shift()
      const player2 = queue.shift()

      console.log(`[ShadowBattleIntegration] Matched players: ${player1} vs ${player2}`)

      // Start PvP battle
      this.initiatePvPBattle(player1, { targetPlayerId: player2 })
    }
  }

  handleBattleStarted(data) {
    const { battleId, participants } = data

    console.log(`[ShadowBattleIntegration] Shadow battle started: ${battleId}`)

    // Notify participants
    participants.forEach((playerId) => {
      const player = this.gameManager.getPlayerBySessionId(playerId)
      if (player) {
        player.send("shadow_battle_notification", {
          type: "battle_started",
          battleId: battleId,
        })
      }
    })
  }

  handleBattleEnded(data) {
    const { battleId, winner, participants, battleData } = data

    console.log(`[ShadowBattleIntegration] Shadow battle ended: ${battleId}, winner: ${winner}`)

    // Process results for each participant
    participants.forEach(async (playerId) => {
      await this.processBattleResults(playerId, winner, battleData)
    })

    // Clean up active battles
    participants.forEach((playerId) => {
      this.activeBattles.delete(playerId)
    })
  }

  async processBattleResults(playerId, winner, battleData) {
    const player = this.gameManager.getPlayerBySessionId(playerId)
    if (!player) return

    const isWinner = winner === "player"

    // Calculate rewards
    const rewards = this.calculateBattleRewards(playerId, isWinner, battleData)

    // Apply rewards
    if (rewards.experience > 0) {
      await this.addPlayerExperience(playerId, rewards.experience)
    }

    if (rewards.shadowTokens > 0) {
      await this.addPlayerTokens(playerId, rewards.shadowTokens)
    }

    // Award new shadows for significant victories
    if (isWinner && rewards.newShadow) {
      const newShadow = this.shadowManager.generateRandomShadow(rewards.newShadow.level, rewards.newShadow.rarity)
      this.shadowManager.addShadowToPlayer(playerId, newShadow)
      rewards.shadows = [newShadow]
    }

    // Send results to player
    player.send("shadow_battle_results", {
      winner: winner,
      rewards: rewards,
      battleData: battleData,
    })

    // Unfreeze player
    player.send("unfreeze_movement", { reason: "battle_ended" })

    console.log(`[ShadowBattleIntegration] Battle results processed for player: ${playerId}`)
  }

  calculateBattleRewards(playerId, isWinner, battleData) {
    const rewards = {
      experience: 0,
      shadowTokens: 0,
      newShadow: null,
      shadows: [],
    }

    if (isWinner) {
      // Base rewards for winning
      rewards.experience = 100
      rewards.shadowTokens = 50

      // Bonus rewards based on battle type
      switch (battleData.type) {
        case "pve":
          rewards.experience += 50
          rewards.shadowTokens += 25

          // Chance for new shadow
          if (Math.random() < 0.3) {
            rewards.newShadow = {
              level: Math.max(1, this.getPlayerLevel(playerId)),
              rarity: Math.random() < 0.1 ? "Rare" : "Common",
            }
          }
          break

        case "pvp":
          rewards.experience += 75
          rewards.shadowTokens += 40

          // Higher chance for rare shadow
          if (Math.random() < 0.2) {
            rewards.newShadow = {
              level: Math.max(1, this.getPlayerLevel(playerId)),
              rarity: Math.random() < 0.3 ? "Epic" : "Rare",
            }
          }
          break

        case "ranked":
          rewards.experience += 100
          rewards.shadowTokens += 75

          // Guaranteed rare+ shadow
          rewards.newShadow = {
            level: Math.max(1, this.getPlayerLevel(playerId) + 1),
            rarity: Math.random() < 0.1 ? "Legendary" : Math.random() < 0.4 ? "Epic" : "Rare",
          }
          break
      }
    } else {
      // Consolation rewards for losing
      rewards.experience = 25
      rewards.shadowTokens = 10
    }

    return rewards
  }

  async getPlayerMasterAffinity(playerId) {
    // Get from player data or default to Chaos
    try {
      const playerData = await this.gameManager.dataServer.getEntity("players", playerId)
      return playerData.master_affinity || "Chaos"
    } catch (error) {
      console.warn(`[ShadowBattleIntegration] Could not get master affinity for ${playerId}, using default`)
      return "Chaos"
    }
  }

  async getPlayerName(playerId) {
    try {
      const playerData = await this.gameManager.dataServer.getEntity("players", playerId)
      return playerData.name || `Player_${playerId.substr(0, 6)}`
    } catch (error) {
      return `Player_${playerId.substr(0, 6)}`
    }
  }

  getPlayerLevel(playerId) {
    // Get player level or default to 1
    try {
      const player = this.gameManager.getPlayerBySessionId(playerId)
      return player?.level || 1
    } catch (error) {
      return 1
    }
  }

  async addPlayerExperience(playerId, experience) {
    try {
      await this.gameManager.dataServer.addPlayerExperience(playerId, experience)
      console.log(`[ShadowBattleIntegration] Added ${experience} XP to player ${playerId}`)
    } catch (error) {
      console.error(`[ShadowBattleIntegration] Error adding experience:`, error)
    }
  }

  async addPlayerTokens(playerId, tokens) {
    try {
      await this.gameManager.dataServer.addPlayerCurrency(playerId, "shadow_tokens", tokens)
      console.log(`[ShadowBattleIntegration] Added ${tokens} Shadow Tokens to player ${playerId}`)
    } catch (error) {
      console.error(`[ShadowBattleIntegration] Error adding tokens:`, error)
    }
  }

  generateBattleId() {
    return `shadow_battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  sendErrorToPlayer(playerId, message) {
    const player = this.gameManager.getPlayerBySessionId(playerId)
    if (player) {
      player.send("shadow_battle_error", { message: message })
    }
  }

  offerBattleOptions(player) {
    player.send("shadow_battle_options", {
      availableOptions: [
        { type: "pve", name: "Challenge Shadow Legion", description: "Fight AI-controlled shadows" },
        { type: "pvp", name: "Player vs Player", description: "Battle another summoner" },
        { type: "ranked", name: "Ranked Battle", description: "Competitive ranked matches" },
        { type: "tournament", name: "Tournament", description: "Join ongoing tournaments" },
      ],
    })
  }

  // Utility methods
  isPlayerInBattle(playerId) {
    return this.activeBattles.has(playerId)
  }

  getActiveBattle(playerId) {
    return this.activeBattles.get(playerId)
  }

  getQueueStatus(queueType) {
    const queue = this.playerQueues.get(queueType) || []
    return {
      queueType: queueType,
      playersInQueue: queue.length,
      estimatedWaitTime: this.calculateWaitTime(queue.length),
    }
  }

  calculateWaitTime(queueLength) {
    // Simple wait time calculation
    if (queueLength === 0) return 0
    if (queueLength === 1) return 30 // 30 seconds average
    return Math.max(5, 60 - queueLength * 10) // Decreasing wait time with more players
  }
}

module.exports = ShadowBattleIntegration
