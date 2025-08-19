/**
 * Reldens Integration Module
 * Integrates the battle system with the Reldens framework
 */

class ReldensBattleIntegration {
  constructor(gameManager) {
    this.gameManager = gameManager
    this.battleRooms = new Map()
    this.playerBattles = new Map()

    console.log("[ReldensBattleIntegration] Initialized battle integration")
  }

  initialize() {
    // Register battle room with Colyseus
    this.registerBattleRoom()

    // Setup event listeners
    this.setupEventListeners()

    // Register battle triggers
    this.registerBattleTriggers()

    console.log("[ReldensBattleIntegration] Battle system integrated with Reldens")
  }

  registerBattleRoom() {
    const ColyseuseBattleRoom = require("./colyseus-battle-room")

    // Register with Colyseus server
    this.gameManager.colyseus.define("battle_room", ColyseuseBattleRoom, {
      maxClients: 6,
      allowReconnection: true,
      reconnectionTimeout: 30000,
    })

    console.log("[ReldensBattleIntegration] Battle room registered with Colyseus")
  }

  setupEventListeners() {
    // Listen for player events
    this.gameManager.events.on("player.collision", this.handlePlayerCollision.bind(this))
    this.gameManager.events.on("player.npc_interaction", this.handleNPCInteraction.bind(this))
    this.gameManager.events.on("player.enter_battle_zone", this.handleBattleZoneEntry.bind(this))
    this.gameManager.events.on("player.disconnect", this.handlePlayerDisconnect.bind(this))

    // Listen for battle events
    this.gameManager.events.on("battle.started", this.handleBattleStarted.bind(this))
    this.gameManager.events.on("battle.ended", this.handleBattleEnded.bind(this))
  }

  registerBattleTriggers() {
    // Register collision triggers for battle initiation
    this.gameManager.objectsManager.registerCollisionHandler("enemy", (player, enemy) => {
      this.initiateBattle(player, { type: "enemy_encounter", enemy: enemy })
    })

    // Register map zone triggers
    this.gameManager.roomsManager.registerZoneHandler("battle_zone", (player, zone) => {
      this.initiateBattle(player, { type: "zone_battle", zone: zone })
    })

    // Register PvP triggers
    this.gameManager.pvpManager.registerBattleHandler((challenger, target) => {
      this.initiatePvPBattle(challenger, target)
    })
  }

  async initiateBattle(player, battleOptions = {}) {
    try {
      console.log(`[ReldensBattleIntegration] Initiating battle for player: ${player.sessionId}`)

      // Check if player is already in battle
      if (this.playerBattles.has(player.sessionId)) {
        console.warn(`[ReldensBattleIntegration] Player ${player.sessionId} already in battle`)
        return
      }

      // Prepare battle data
      const battleData = await this.prepareBattleData(player, battleOptions)

      // Create or join battle room
      const battleRoom = await this.createBattleRoom(battleData)

      // Connect player to battle room
      await this.connectPlayerToBattle(player, battleRoom, battleData)

      // Store battle reference
      this.playerBattles.set(player.sessionId, battleRoom.roomId)
      this.battleRooms.set(battleRoom.roomId, battleRoom)

      console.log(`[ReldensBattleIntegration] Battle initiated for player: ${player.sessionId}`)
    } catch (error) {
      console.error(`[ReldensBattleIntegration] Error initiating battle:`, error)

      // Send error to player
      player.send("battle_error", {
        message: "Failed to start battle",
        error: error.message,
      })
    }
  }

  async initiatePvPBattle(challenger, target) {
    try {
      console.log(`[ReldensBattleIntegration] Initiating PvP battle: ${challenger.sessionId} vs ${target.sessionId}`)

      // Check if either player is already in battle
      if (this.playerBattles.has(challenger.sessionId) || this.playerBattles.has(target.sessionId)) {
        console.warn(`[ReldensBattleIntegration] One or both players already in battle`)
        return
      }

      // Prepare PvP battle data
      const battleData = await this.preparePvPBattleData(challenger, target)

      // Create battle room
      const battleRoom = await this.createBattleRoom(battleData)

      // Connect both players to battle room
      await this.connectPlayerToBattle(challenger, battleRoom, battleData)
      await this.connectPlayerToBattle(target, battleRoom, battleData)

      // Store battle references
      this.playerBattles.set(challenger.sessionId, battleRoom.roomId)
      this.playerBattles.set(target.sessionId, battleRoom.roomId)
      this.battleRooms.set(battleRoom.roomId, battleRoom)

      console.log(`[ReldensBattleIntegration] PvP battle initiated`)
    } catch (error) {
      console.error(`[ReldensBattleIntegration] Error initiating PvP battle:`, error)
    }
  }

  async prepareBattleData(player, battleOptions) {
    // Get player stats from Reldens
    const playerStats = await this.getPlayerStats(player)
    const playerSkills = await this.getPlayerSkills(player)
    const playerItems = await this.getPlayerItems(player)

    // Prepare battle configuration
    const battleData = {
      type: battleOptions.type || "pve",
      environment: battleOptions.environment || "forest",
      maxClients: battleOptions.maxClients || 4,
      players: [
        {
          sessionId: player.sessionId,
          playerName: player.playerName,
          level: playerStats.level,
          maxHp: playerStats.hp,
          maxMp: playerStats.mp,
          attack: playerStats.atk,
          defense: playerStats.def,
          speed: playerStats.spd,
          accuracy: playerStats.accuracy || 90,
          evasion: playerStats.evasion || 5,
          skills: playerSkills,
          items: playerItems,
          sprite: player.sprite || "warrior",
          portrait: player.portrait || "warrior_portrait",
        },
      ],
      enemies: [],
    }

    // Add enemies based on battle type
    if (battleOptions.type === "enemy_encounter") {
      battleData.enemies = await this.generateEnemies(battleOptions.enemy, playerStats.level)
    } else if (battleOptions.type === "zone_battle") {
      battleData.enemies = await this.generateZoneEnemies(battleOptions.zone, playerStats.level)
    }

    return battleData
  }

  async preparePvPBattleData(challenger, target) {
    // Get stats for both players
    const challengerStats = await this.getPlayerStats(challenger)
    const challengerSkills = await this.getPlayerSkills(challenger)
    const challengerItems = await this.getPlayerItems(challenger)

    const targetStats = await this.getPlayerStats(target)
    const targetSkills = await this.getPlayerSkills(target)
    const targetItems = await this.getPlayerItems(target)

    return {
      type: "pvp",
      environment: "arena",
      maxClients: 2,
      players: [
        {
          sessionId: challenger.sessionId,
          playerName: challenger.playerName,
          level: challengerStats.level,
          maxHp: challengerStats.hp,
          maxMp: challengerStats.mp,
          attack: challengerStats.atk,
          defense: challengerStats.def,
          speed: challengerStats.spd,
          accuracy: challengerStats.accuracy || 90,
          evasion: challengerStats.evasion || 5,
          skills: challengerSkills,
          items: challengerItems,
          sprite: challenger.sprite || "warrior",
          portrait: challenger.portrait || "warrior_portrait",
          team: "team1",
        },
        {
          sessionId: target.sessionId,
          playerName: target.playerName,
          level: targetStats.level,
          maxHp: targetStats.hp,
          maxMp: targetStats.mp,
          attack: targetStats.atk,
          defense: targetStats.def,
          speed: targetStats.spd,
          accuracy: targetStats.accuracy || 90,
          evasion: targetStats.evasion || 5,
          skills: targetSkills,
          items: targetItems,
          sprite: target.sprite || "warrior",
          portrait: target.portrait || "warrior_portrait",
          team: "team2",
        },
      ],
      enemies: [],
    }
  }

  async getPlayerStats(player) {
    // Get player stats from Reldens database
    const playerData = await this.gameManager.dataServer.getEntity("players", player.player_id)
    const playerStats = await this.gameManager.dataServer.getEntity("player_stats", player.player_id)

    return {
      level: playerData.level || 1,
      hp: playerStats.hp || 100,
      mp: playerStats.mp || 50,
      atk: playerStats.atk || 20,
      def: playerStats.def || 15,
      spd: playerStats.spd || 10,
      accuracy: playerStats.accuracy || 90,
      evasion: playerStats.evasion || 5,
    }
  }

  async getPlayerSkills(player) {
    // Get player skills from Reldens database
    const playerSkills = await this.gameManager.dataServer.getPlayerSkills(player.player_id)

    return playerSkills.map((skill) => skill.skill_id)
  }

  async getPlayerItems(player) {
    // Get player items from Reldens database
    const playerItems = await this.gameManager.dataServer.getPlayerItems(player.player_id)

    return playerItems
      .filter((item) => item.usable_in_battle)
      .map((item) => ({
        id: item.item_id,
        name: item.name,
        quantity: item.quantity,
        usableInBattle: true,
        effect: item.effect,
        power: item.power,
        targetType: item.target_type || "single_ally",
      }))
  }

  async generateEnemies(enemyData, playerLevel) {
    // Generate enemies based on player level and encounter type
    const enemies = []
    const enemyCount = Math.max(1, Math.floor(Math.random() * 3) + 1)

    for (let i = 0; i < enemyCount; i++) {
      const enemy = {
        id: `enemy_${i}`,
        name: enemyData.name || "Shadow Warrior",
        level: Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1),
        stats: {
          hp: (enemyData.base_hp || 80) + playerLevel * 10,
          mp: (enemyData.base_mp || 20) + playerLevel * 5,
          attack: (enemyData.base_atk || 18) + playerLevel * 3,
          defense: (enemyData.base_def || 12) + playerLevel * 2,
          speed: (enemyData.base_spd || 8) + Math.floor(Math.random() * 5),
          accuracy: enemyData.accuracy || 85,
          evasion: enemyData.evasion || 5,
        },
        skills: enemyData.skills || ["dark_slash"],
        aiType: enemyData.ai_type || "aggressive",
        aiPersonality: enemyData.ai_personality || "hostile",
        sprite: enemyData.sprite || "shadow_warrior",
        portrait: enemyData.portrait || "shadow_warrior_portrait",
      }

      enemies.push(enemy)
    }

    return enemies
  }

  async generateZoneEnemies(zone, playerLevel) {
    // Generate enemies based on zone configuration
    const zoneEnemies = await this.gameManager.dataServer.getZoneEnemies(zone.id)
    const enemies = []

    zoneEnemies.forEach((enemyTemplate, index) => {
      const enemy = {
        id: `zone_enemy_${index}`,
        name: enemyTemplate.name,
        level: Math.max(1, playerLevel + enemyTemplate.level_modifier),
        stats: {
          hp: enemyTemplate.base_hp + playerLevel * enemyTemplate.hp_scaling,
          mp: enemyTemplate.base_mp + playerLevel * enemyTemplate.mp_scaling,
          attack: enemyTemplate.base_atk + playerLevel * enemyTemplate.atk_scaling,
          defense: enemyTemplate.base_def + playerLevel * enemyTemplate.def_scaling,
          speed: enemyTemplate.base_spd + Math.floor(Math.random() * 5),
          accuracy: enemyTemplate.accuracy || 85,
          evasion: enemyTemplate.evasion || 5,
        },
        skills: enemyTemplate.skills || ["basic_attack"],
        aiType: enemyTemplate.ai_type || "aggressive",
        aiPersonality: enemyTemplate.ai_personality || "hostile",
        sprite: enemyTemplate.sprite,
        portrait: enemyTemplate.portrait,
      }

      enemies.push(enemy)
    })

    return enemies
  }

  async createBattleRoom(battleData) {
    // Create new battle room
    const battleRoom = await this.gameManager.colyseus.create("battle_room", {
      battleData: battleData,
      maxClients: battleData.maxClients,
    })

    console.log(`[ReldensBattleIntegration] Created battle room: ${battleRoom.roomId}`)

    return battleRoom
  }

  async connectPlayerToBattle(player, battleRoom, battleData) {
    // Get player's battle data
    const playerBattleData = battleData.players.find((p) => p.sessionId === player.sessionId)

    if (!playerBattleData) {
      throw new Error("Player battle data not found")
    }

    // Send battle invitation to player
    player.send("battle_invitation", {
      battleRoomId: battleRoom.roomId,
      battleType: battleData.type,
      environment: battleData.environment,
      playerData: playerBattleData,
    })

    // Freeze player movement in overworld
    player.send("freeze_movement", { reason: "entering_battle" })

    console.log(`[ReldensBattleIntegration] Player ${player.sessionId} connected to battle room`)
  }

  handlePlayerCollision(data) {
    const { player, target } = data

    // Check if target is an enemy
    if (target.type === "enemy" && target.hostile) {
      this.initiateBattle(player, {
        type: "enemy_encounter",
        enemy: target,
      })
    }
  }

  handleNPCInteraction(data) {
    const { player, npc } = data

    // Check if NPC is a battle trainer or challenge NPC
    if (npc.type === "battle_trainer") {
      this.initiateBattle(player, {
        type: "trainer_battle",
        trainer: npc,
      })
    }
  }

  handleBattleZoneEntry(data) {
    const { player, zone } = data

    // Random encounter chance
    const encounterChance = zone.encounter_rate || 0.3

    if (Math.random() < encounterChance) {
      this.initiateBattle(player, {
        type: "zone_battle",
        zone: zone,
      })
    }
  }

  handlePlayerDisconnect(data) {
    const { player } = data

    // Check if player was in battle
    const battleRoomId = this.playerBattles.get(player.sessionId)

    if (battleRoomId) {
      console.log(`[ReldensBattleIntegration] Player ${player.sessionId} disconnected from battle`)

      // Remove from tracking
      this.playerBattles.delete(player.sessionId)

      // Battle room will handle the disconnection
    }
  }

  handleBattleStarted(data) {
    const { battleId, participants } = data

    console.log(`[ReldensBattleIntegration] Battle started: ${battleId}`)

    // Notify all participants
    participants.forEach((participant) => {
      if (participant.type === "player") {
        const player = this.gameManager.getPlayerBySessionId(participant.id)
        if (player) {
          player.send("battle_started", {
            battleId: battleId,
            participant: participant,
          })
        }
      }
    })
  }

  handleBattleEnded(data) {
    const { battleId, winner, rewards, participants } = data

    console.log(`[ReldensBattleIntegration] Battle ended: ${battleId}, winner: ${winner}`)

    // Process battle results for each participant
    participants.forEach(async (participant) => {
      if (participant.type === "player") {
        await this.processBattleResults(participant, winner, rewards)
      }
    })

    // Clean up battle room reference
    const battleRoom = Array.from(this.battleRooms.values()).find((room) => room.battleId === battleId)

    if (battleRoom) {
      this.battleRooms.delete(battleRoom.roomId)
    }
  }

  async processBattleResults(participant, winner, rewards) {
    const player = this.gameManager.getPlayerBySessionId(participant.id)

    if (!player) return

    // Remove from battle tracking
    this.playerBattles.delete(participant.id)

    // Unfreeze player movement
    player.send("unfreeze_movement", { reason: "battle_ended" })

    // Apply rewards if player won
    if (winner === "player" && rewards) {
      await this.applyBattleRewards(player, rewards)
    }

    // Send battle results
    player.send("battle_results", {
      winner: winner,
      rewards: rewards,
      participant: participant,
    })

    console.log(`[ReldensBattleIntegration] Battle results processed for player: ${participant.id}`)
  }

  async applyBattleRewards(player, rewards) {
    try {
      // Apply experience
      if (rewards.experience > 0) {
        await this.gameManager.dataServer.addPlayerExperience(player.player_id, rewards.experience)
      }

      // Apply gold
      if (rewards.gold > 0) {
        await this.gameManager.dataServer.addPlayerGold(player.player_id, rewards.gold)
      }

      // Apply items
      if (rewards.items && rewards.items.length > 0) {
        for (const item of rewards.items) {
          await this.gameManager.dataServer.addPlayerItem(player.player_id, item.id, item.quantity)
        }
      }

      console.log(`[ReldensBattleIntegration] Rewards applied for player: ${player.sessionId}`)
    } catch (error) {
      console.error(`[ReldensBattleIntegration] Error applying battle rewards:`, error)
    }
  }

  // Utility methods
  isPlayerInBattle(sessionId) {
    return this.playerBattles.has(sessionId)
  }

  getBattleRoomForPlayer(sessionId) {
    const battleRoomId = this.playerBattles.get(sessionId)
    return battleRoomId ? this.battleRooms.get(battleRoomId) : null
  }

  async endBattleForPlayer(sessionId, reason = "player_request") {
    const battleRoom = this.getBattleRoomForPlayer(sessionId)

    if (battleRoom) {
      // Send end battle request to room
      battleRoom.send("end_battle", { reason: reason, playerId: sessionId })
    }
  }
}

module.exports = ReldensBattleIntegration
