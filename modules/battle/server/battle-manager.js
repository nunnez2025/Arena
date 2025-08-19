const BattleRoom = require("./battle-room")

class BattleManager {
  constructor(gameManager) {
    this.gameManager = gameManager
    this.activeBattles = new Map()
    this.battleQueue = []
  }

  initiateBattle(players, battleConfig = {}) {
    console.log(
      "[BattleManager] Initiating battle with players:",
      players.map((p) => p.id),
    )

    const battleId = this.generateBattleId()

    // Create battle room
    const battleRoom = new BattleRoom()
    battleRoom.onCreate({
      battleId: battleId,
      maxClients: players.length + 2, // Players + AI enemies
      battleConfig: battleConfig,
    })

    this.activeBattles.set(battleId, {
      room: battleRoom,
      players: players,
      startTime: Date.now(),
      status: "active",
    })

    // Notify players to join battle
    players.forEach((player) => {
      this.gameManager.sendToPlayer(player.id, "battle-invitation", {
        battleId: battleId,
        roomId: battleRoom.roomId,
        playerData: this.getPlayerBattleData(player),
      })
    })

    return battleId
  }

  getPlayerBattleData(player) {
    return {
      playerId: player.id,
      playerName: player.state.name || "Unknown",
      level: player.state.level || 1,
      maxHp: this.calculateMaxHp(player),
      maxMp: this.calculateMaxMp(player),
      attack: this.calculateAttack(player),
      defense: this.calculateDefense(player),
      speed: this.calculateSpeed(player),
      skills: this.getPlayerSkills(player),
      items: this.getPlayerItems(player),
      team: "player",
    }
  }

  calculateMaxHp(player) {
    const baseHp = 100
    const level = player.state.level || 1
    const constitution = player.state.stats?.constitution || 10

    return Math.floor(baseHp + level * 10 + constitution * 2)
  }

  calculateMaxMp(player) {
    const baseMp = 50
    const level = player.state.level || 1
    const intelligence = player.state.stats?.intelligence || 10

    return Math.floor(baseMp + level * 5 + intelligence * 1.5)
  }

  calculateAttack(player) {
    const baseAttack = 20
    const level = player.state.level || 1
    const strength = player.state.stats?.strength || 10
    const weapon = player.state.equipment?.weapon

    let attack = baseAttack + level * 2 + strength

    if (weapon) {
      attack += weapon.attack || 0
    }

    return Math.floor(attack)
  }

  calculateDefense(player) {
    const baseDefense = 15
    const level = player.state.level || 1
    const constitution = player.state.stats?.constitution || 10
    const armor = player.state.equipment?.armor

    let defense = baseDefense + level + Math.floor(constitution * 0.5)

    if (armor) {
      defense += armor.defense || 0
    }

    return Math.floor(defense)
  }

  calculateSpeed(player) {
    const baseSpeed = 10
    const level = player.state.level || 1
    const agility = player.state.stats?.agility || 10

    return Math.floor(baseSpeed + Math.floor(level * 0.5) + Math.floor(agility * 0.8))
  }

  getPlayerSkills(player) {
    // Get skills from player's class and learned skills
    const playerClass = player.state.class
    const learnedSkills = player.state.skills || []

    const availableSkills = []

    // Add class-based skills
    if (playerClass) {
      const classSkills = this.gameManager.getClassSkills(playerClass)
      availableSkills.push(...classSkills)
    }

    // Add learned skills
    availableSkills.push(...learnedSkills)

    return availableSkills
  }

  getPlayerItems(player) {
    return player.state.inventory?.filter((item) => item.usableInBattle) || []
  }

  checkBattleTrigger(player, targetEntity) {
    // Check if battle should be triggered
    if (targetEntity.type === "npc" && targetEntity.hostile) {
      return this.triggerNPCBattle(player, targetEntity)
    }

    if (targetEntity.type === "player" && this.isPvPEnabled(player, targetEntity)) {
      return this.triggerPvPBattle(player, targetEntity)
    }

    return false
  }

  triggerNPCBattle(player, npc) {
    console.log("[BattleManager] Triggering NPC battle:", player.id, "vs", npc.id)

    const battleConfig = {
      type: "pve",
      environment: npc.battleEnvironment || "forest",
      enemies: [this.createEnemyFromNPC(npc)],
    }

    return this.initiateBattle([player], battleConfig)
  }

  triggerPvPBattle(player1, player2) {
    console.log("[BattleManager] Triggering PvP battle:", player1.id, "vs", player2.id)

    const battleConfig = {
      type: "pvp",
      environment: "arena",
      allowSpectators: true,
    }

    return this.initiateBattle([player1, player2], battleConfig)
  }

  createEnemyFromNPC(npc) {
    return {
      id: npc.id,
      name: npc.name,
      level: npc.level || 1,
      maxHp: npc.stats?.hp || 80,
      maxMp: npc.stats?.mp || 30,
      attack: npc.stats?.attack || 25,
      defense: npc.stats?.defense || 15,
      speed: npc.stats?.speed || 8,
      skills: npc.skills || [],
      aiType: npc.aiType || "aggressive",
      sprite: npc.battleSprite || "enemy-default",
      team: "enemy",
    }
  }

  isPvPEnabled(player1, player2) {
    // Check PvP rules and player consent
    return player1.state.pvpEnabled && player2.state.pvpEnabled
  }

  onBattleEnd(battleId, result) {
    console.log("[BattleManager] Battle ended:", battleId, result)

    const battle = this.activeBattles.get(battleId)
    if (!battle) return

    // Process battle results
    this.processBattleRewards(battle, result)

    // Update player states
    battle.players.forEach((player) => {
      this.updatePlayerAfterBattle(player, result)
    })

    // Clean up battle
    this.activeBattles.delete(battleId)

    console.log("[BattleManager] Battle cleanup completed for:", battleId)
  }

  processBattleRewards(battle, result) {
    if (result.winner === "player") {
      battle.players.forEach((player) => {
        // Award experience
        const expGained = result.rewards?.experience || 0
        this.gameManager.awardExperience(player.id, expGained)

        // Award gold
        const goldGained = result.rewards?.gold || 0
        this.gameManager.awardGold(player.id, goldGained)

        // Award items
        if (result.rewards?.items) {
          result.rewards.items.forEach((item) => {
            this.gameManager.addItemToInventory(player.id, item)
          })
        }
      })
    }
  }

  updatePlayerAfterBattle(player, result) {
    // Restore player to overworld
    this.gameManager.sendToPlayer(player.id, "battle-completed", {
      result: result,
      returnToOverworld: true,
    })

    // Update player state
    player.state.inBattle = false
    player.state.battleId = null
  }

  generateBattleId() {
    return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getActiveBattles() {
    return Array.from(this.activeBattles.values())
  }

  getBattle(battleId) {
    return this.activeBattles.get(battleId)
  }

  cleanup() {
    // Clean up all active battles
    this.activeBattles.forEach((battle, battleId) => {
      if (battle.room) {
        battle.room.disconnect()
      }
    })

    this.activeBattles.clear()
    console.log("[BattleManager] Cleanup completed")
  }
}

module.exports = BattleManager
