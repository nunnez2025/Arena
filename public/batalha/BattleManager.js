/**
 * BattleManager - Orchestrates turn flow, timing, and syncing
 * Core battle logic for Game das Sombras
 */

class BattleManager {
  constructor(battleRoom, config) {
    this.battleRoom = battleRoom
    this.config = config
    this.state = {
      phase: "waiting", // waiting, battle, ended
      currentTurn: 0,
      turnQueue: [],
      participants: new Map(),
      battleLog: [],
      turnTimer: null,
      battleId: this.generateBattleId(),
    }

    this.aiController = null
    this.disconnectedAgents = new Map()
    this.turnTimeLimit = config.turnTimeLimit || 30000

    console.log(`[BattleManager] Initialized battle: ${this.state.battleId}`)
  }

  initialize(aiController) {
    this.aiController = aiController
    this.setupEventHandlers()
  }

  setupEventHandlers() {
    // Handle player disconnection
    this.battleRoom.onMessage("player-disconnected", (client, data) => {
      this.handlePlayerDisconnection(client.sessionId)
    })

    // Handle player reconnection
    this.battleRoom.onMessage("player-reconnected", (client, data) => {
      this.handlePlayerReconnection(client.sessionId)
    })
  }

  addParticipant(sessionId, participantData) {
    const participant = {
      id: sessionId,
      name: participantData.name || `Player_${sessionId.substr(0, 6)}`,
      type: participantData.type || "player", // player, enemy, ai_agent
      team: participantData.team || "player", // player, enemy
      level: participantData.level || 1,

      // Combat Stats
      stats: {
        hp: participantData.maxHp || 100,
        maxHp: participantData.maxHp || 100,
        mp: participantData.maxMp || 50,
        maxMp: participantData.maxMp || 50,
        attack: participantData.attack || 20,
        defense: participantData.defense || 15,
        speed: participantData.speed || 10,
        accuracy: participantData.accuracy || 90,
        evasion: participantData.evasion || 5,
      },

      // Battle State
      statusEffects: new Map(),
      skills: participantData.skills || [],
      items: participantData.items || [],
      position: participantData.position || { x: 0, y: 0 },
      isAlive: true,
      isActive: true,
      lastAction: null,

      // AI Data
      aiType: participantData.aiType || null,
      aiPersonality: participantData.aiPersonality || null,

      // Visual Data
      sprite: participantData.sprite || "default_character",
      portrait: participantData.portrait || "default_portrait",
      animations: participantData.animations || {},
    }

    this.state.participants.set(sessionId, participant)
    this.updateTurnQueue()

    console.log(`[BattleManager] Added participant: ${participant.name} (${participant.type})`)

    return participant
  }

  removeParticipant(sessionId) {
    const participant = this.state.participants.get(sessionId)
    if (participant) {
      console.log(`[BattleManager] Removing participant: ${participant.name}`)
      this.state.participants.delete(sessionId)
      this.updateTurnQueue()
      this.checkBattleEnd()
    }
  }

  updateTurnQueue() {
    // Sort participants by speed (highest first)
    const activeParticipants = Array.from(this.state.participants.values())
      .filter((p) => p.isAlive && p.isActive)
      .sort((a, b) => {
        // Primary sort: Speed
        if (b.stats.speed !== a.stats.speed) {
          return b.stats.speed - a.stats.speed
        }
        // Secondary sort: Level
        if (b.level !== a.level) {
          return b.level - a.level
        }
        // Tertiary sort: Random for ties
        return Math.random() - 0.5
      })

    this.state.turnQueue = activeParticipants.map((p) => p.id)

    // Broadcast turn queue update
    this.battleRoom.broadcast("turn-queue-updated", {
      turnQueue: this.state.turnQueue,
      participants: this.getParticipantsData(),
    })
  }

  async startBattle() {
    if (this.state.phase !== "waiting") return

    console.log(`[BattleManager] Starting battle: ${this.state.battleId}`)

    this.state.phase = "battle"
    this.state.currentTurn = 0

    // Add AI enemies if needed
    await this.spawnAIEnemies()

    // Update turn queue with all participants
    this.updateTurnQueue()

    // Broadcast battle start
    this.battleRoom.broadcast("battle-started", {
      battleId: this.state.battleId,
      participants: this.getParticipantsData(),
      turnQueue: this.state.turnQueue,
      config: this.config,
    })

    // Add initial battle log entry
    this.addToBattleLog("Battle begins!", "system")

    // Start first turn after a brief delay
    setTimeout(() => {
      this.processTurn()
    }, 2000)
  }

  async processTurn() {
    if (this.state.phase !== "battle" || this.state.turnQueue.length === 0) {
      return
    }

    const currentParticipantId = this.state.turnQueue[this.state.currentTurn % this.state.turnQueue.length]
    const currentParticipant = this.state.participants.get(currentParticipantId)

    if (!currentParticipant || !currentParticipant.isAlive) {
      this.nextTurn()
      return
    }

    console.log(`[BattleManager] Processing turn for: ${currentParticipant.name}`)

    // Process status effects at turn start
    await this.processStatusEffects(currentParticipant)

    // Check if participant is still alive after status effects
    if (!currentParticipant.isAlive) {
      this.nextTurn()
      return
    }

    // Broadcast turn start
    this.battleRoom.broadcast("turn-started", {
      participantId: currentParticipantId,
      participant: this.getParticipantData(currentParticipant),
      turnNumber: Math.floor(this.state.currentTurn / this.state.turnQueue.length) + 1,
      turnIndex: this.state.currentTurn,
    })

    // Handle turn based on participant type
    if (currentParticipant.type === "player" && currentParticipant.isActive) {
      // Player turn - wait for input
      this.startTurnTimer(currentParticipantId)
    } else if (currentParticipant.type === "enemy" || !currentParticipant.isActive) {
      // AI turn (enemy or disconnected player)
      await this.processAITurn(currentParticipant)
    }
  }

  startTurnTimer(participantId) {
    // Clear existing timer
    if (this.state.turnTimer) {
      clearTimeout(this.state.turnTimer)
    }

    // Start new timer
    this.state.turnTimer = setTimeout(() => {
      console.log(`[BattleManager] Turn timeout for participant: ${participantId}`)

      const participant = this.state.participants.get(participantId)
      if (participant && participant.isAlive) {
        // Auto-defend on timeout
        this.executeAction(participantId, {
          type: "defend",
          targetId: participantId,
        })
      }
    }, this.turnTimeLimit)

    // Broadcast timer start
    this.battleRoom.broadcast("turn-timer-started", {
      participantId: participantId,
      timeLimit: this.turnTimeLimit,
    })
  }

  async processAITurn(participant) {
    try {
      console.log(`[BattleManager] Processing AI turn for: ${participant.name}`)

      // Get battle state for AI
      const battleState = this.getBattleStateForAI()

      // Get AI action
      let aiAction = null

      if (participant.type === "enemy") {
        // Use external AI for enemies
        aiAction = await this.aiController.getEnemyAction(participant, battleState)
      } else {
        // Use disconnected agent for players
        const agent = this.getDisconnectedAgent(participant.id)
        aiAction = await agent.getAction(participant, battleState)
      }

      if (aiAction) {
        // Execute AI action after a brief delay for realism
        setTimeout(
          () => {
            this.executeAction(participant.id, aiAction)
          },
          1000 + Math.random() * 2000,
        ) // 1-3 second delay
      } else {
        // Fallback to defend if no action received
        console.warn(`[BattleManager] No AI action received for ${participant.name}, defaulting to defend`)
        setTimeout(() => {
          this.executeAction(participant.id, {
            type: "defend",
            targetId: participant.id,
          })
        }, 1500)
      }
    } catch (error) {
      console.error(`[BattleManager] Error processing AI turn:`, error)

      // Fallback to defend on error
      setTimeout(() => {
        this.executeAction(participant.id, {
          type: "defend",
          targetId: participant.id,
        })
      }, 1000)
    }
  }

  async executeAction(participantId, action) {
    const participant = this.state.participants.get(participantId)
    if (!participant || !participant.isAlive) {
      console.warn(`[BattleManager] Cannot execute action for invalid participant: ${participantId}`)
      return
    }

    // Clear turn timer
    if (this.state.turnTimer) {
      clearTimeout(this.state.turnTimer)
      this.state.turnTimer = null
    }

    console.log(`[BattleManager] Executing action:`, action, `for participant:`, participant.name)

    // Validate action
    if (!this.validateAction(participant, action)) {
      console.warn(`[BattleManager] Invalid action:`, action)
      this.nextTurn()
      return
    }

    // Store last action
    participant.lastAction = action

    // Execute action based on type
    let result = null

    switch (action.type) {
      case "attack":
        result = await this.executeAttack(participant, action.targetId)
        break

      case "skill":
        result = await this.executeSkill(participant, action.skillId, action.targetId)
        break

      case "item":
        result = await this.executeItem(participant, action.itemId, action.targetId)
        break

      case "defend":
        result = await this.executeDefend(participant)
        break

      default:
        console.warn(`[BattleManager] Unknown action type: ${action.type}`)
        result = { success: false, message: "Unknown action type" }
    }

    // Broadcast action result
    this.battleRoom.broadcast("action-executed", {
      participantId: participantId,
      action: action,
      result: result,
      participant: this.getParticipantData(participant),
    })

    // Add to battle log
    if (result && result.message) {
      this.addToBattleLog(result.message, "action")
    }

    // Check for battle end
    if (this.checkBattleEnd()) {
      return
    }

    // Move to next turn
    setTimeout(() => {
      this.nextTurn()
    }, 1000)
  }

  async executeAttack(attacker, targetId) {
    const target = this.state.participants.get(targetId)
    if (!target || !target.isAlive) {
      return { success: false, message: "Invalid target" }
    }

    // Calculate hit chance
    const hitChance = Math.max(10, attacker.stats.accuracy - target.stats.evasion)
    const isHit = Math.random() * 100 < hitChance

    if (!isHit) {
      return {
        success: true,
        type: "miss",
        message: `${attacker.name} attacks ${target.name} but misses!`,
        targetId: targetId,
      }
    }

    // Calculate damage
    const baseDamage = attacker.stats.attack
    const defense = target.stats.defense
    const randomFactor = 0.8 + Math.random() * 0.4 // 80-120% damage variance

    let damage = Math.max(1, Math.floor((baseDamage - defense * 0.5) * randomFactor))

    // Check for critical hit
    const criticalChance = 10 + (attacker.level - target.level) * 2
    const isCritical = Math.random() * 100 < criticalChance

    if (isCritical) {
      damage = Math.floor(damage * 1.5)
    }

    // Apply damage
    target.stats.hp = Math.max(0, target.stats.hp - damage)

    // Check if target dies
    if (target.stats.hp === 0) {
      target.isAlive = false
      this.updateTurnQueue()
    }

    return {
      success: true,
      type: "attack",
      damage: damage,
      isCritical: isCritical,
      targetId: targetId,
      targetHp: target.stats.hp,
      targetMaxHp: target.stats.maxHp,
      message: `${attacker.name} attacks ${target.name} for ${damage} damage${isCritical ? " (CRITICAL!)" : ""}!`,
    }
  }

  async executeSkill(caster, skillId, targetId) {
    const skill = this.config.skills[skillId]
    if (!skill) {
      return { success: false, message: "Skill not found" }
    }

    // Check MP cost
    if (caster.stats.mp < skill.mpCost) {
      return { success: false, message: "Not enough MP!" }
    }

    // Consume MP
    caster.stats.mp -= skill.mpCost

    const target = this.state.participants.get(targetId)
    if (!target) {
      return { success: false, message: "Invalid target" }
    }

    const result = {
      success: true,
      type: "skill",
      skillId: skillId,
      skill: skill,
      targetId: targetId,
      casterMp: caster.stats.mp,
    }

    // Execute skill effect based on type
    switch (skill.type) {
      case "damage":
        const damage = Math.floor(skill.power * (1 + caster.level * 0.1))
        target.stats.hp = Math.max(0, target.stats.hp - damage)

        if (target.stats.hp === 0) {
          target.isAlive = false
          this.updateTurnQueue()
        }

        result.damage = damage
        result.targetHp = target.stats.hp
        result.message = `${caster.name} casts ${skill.name} on ${target.name} for ${damage} damage!`
        break

      case "heal":
        const healAmount = Math.floor(skill.power * (1 + caster.level * 0.1))
        const actualHeal = Math.min(healAmount, target.stats.maxHp - target.stats.hp)
        target.stats.hp += actualHeal

        result.heal = actualHeal
        result.targetHp = target.stats.hp
        result.message = `${caster.name} casts ${skill.name} on ${target.name}, restoring ${actualHeal} HP!`
        break

      case "status":
        if (skill.statusEffect) {
          this.applyStatusEffect(target, skill.statusEffect)
          result.statusEffect = skill.statusEffect
          result.message = `${caster.name} casts ${skill.name} on ${target.name}!`
        }
        break

      case "buff":
        if (skill.buffEffect) {
          this.applyStatusEffect(target, skill.buffEffect)
          result.buffEffect = skill.buffEffect
          result.message = `${caster.name} casts ${skill.name} on ${target.name}!`
        }
        break
    }

    return result
  }

  async executeItem(user, itemId, targetId) {
    const item = this.config.items[itemId]
    if (!item) {
      return { success: false, message: "Item not found" }
    }

    // Check if user has the item
    const userItem = user.items.find((i) => i.id === itemId && i.quantity > 0)
    if (!userItem) {
      return { success: false, message: "Item not available" }
    }

    // Consume item
    userItem.quantity--

    const target = this.state.participants.get(targetId)
    if (!target) {
      return { success: false, message: "Invalid target" }
    }

    const result = {
      success: true,
      type: "item",
      itemId: itemId,
      item: item,
      targetId: targetId,
    }

    // Execute item effect
    switch (item.effect) {
      case "heal":
        const healAmount = item.power
        const actualHeal = Math.min(healAmount, target.stats.maxHp - target.stats.hp)
        target.stats.hp += actualHeal

        result.heal = actualHeal
        result.targetHp = target.stats.hp
        result.message = `${user.name} uses ${item.name} on ${target.name}, restoring ${actualHeal} HP!`
        break

      case "restore_mp":
        const mpAmount = item.power
        const actualMp = Math.min(mpAmount, target.stats.maxMp - target.stats.mp)
        target.stats.mp += actualMp

        result.mpRestore = actualMp
        result.targetMp = target.stats.mp
        result.message = `${user.name} uses ${item.name} on ${target.name}, restoring ${actualMp} MP!`
        break

      case "cure_status":
        if (item.statusType && target.statusEffects.has(item.statusType)) {
          target.statusEffects.delete(item.statusType)
          result.message = `${user.name} uses ${item.name} on ${target.name}, curing ${item.statusType}!`
        } else {
          result.message = `${user.name} uses ${item.name} on ${target.name}, but it has no effect.`
        }
        break
    }

    return result
  }

  async executeDefend(defender) {
    // Apply defense boost status effect
    const defenseBoost = {
      type: "defense_boost",
      name: "Defending",
      duration: 1,
      power: 50, // 50% defense increase
      icon: "shield",
      color: "#0088ff",
    }

    this.applyStatusEffect(defender, defenseBoost)

    return {
      success: true,
      type: "defend",
      statusEffect: defenseBoost,
      message: `${defender.name} takes a defensive stance!`,
    }
  }

  applyStatusEffect(target, effect) {
    const statusEffect = {
      ...effect,
      remainingDuration: effect.duration,
      appliedAt: Date.now(),
    }

    target.statusEffects.set(effect.type, statusEffect)

    console.log(`[BattleManager] Applied status effect ${effect.type} to ${target.name}`)
  }

  async processStatusEffects(participant) {
    const effects = Array.from(participant.statusEffects.values())

    for (const effect of effects) {
      switch (effect.type) {
        case "poison":
          const poisonDamage = Math.floor(participant.stats.maxHp * 0.1)
          participant.stats.hp = Math.max(0, participant.stats.hp - poisonDamage)

          this.battleRoom.broadcast("status-effect-damage", {
            participantId: participant.id,
            effectType: "poison",
            damage: poisonDamage,
            hp: participant.stats.hp,
          })

          this.addToBattleLog(`${participant.name} takes ${poisonDamage} poison damage!`, "status")
          break

        case "regeneration":
          const healAmount = Math.floor(participant.stats.maxHp * 0.05)
          const actualHeal = Math.min(healAmount, participant.stats.maxHp - participant.stats.hp)
          participant.stats.hp += actualHeal

          this.battleRoom.broadcast("status-effect-heal", {
            participantId: participant.id,
            effectType: "regeneration",
            heal: actualHeal,
            hp: participant.stats.hp,
          })

          this.addToBattleLog(`${participant.name} regenerates ${actualHeal} HP!`, "status")
          break

        case "stun":
          // Stunned participants skip their turn
          this.addToBattleLog(`${participant.name} is stunned and cannot act!`, "status")
          break
      }

      // Decrease duration
      effect.remainingDuration--

      if (effect.remainingDuration <= 0) {
        participant.statusEffects.delete(effect.type)

        this.battleRoom.broadcast("status-effect-expired", {
          participantId: participant.id,
          effectType: effect.type,
        })
      }
    }

    // Check if participant died from status effects
    if (participant.stats.hp === 0) {
      participant.isAlive = false
      this.updateTurnQueue()
    }
  }

  validateAction(participant, action) {
    // Basic validation
    if (!action || !action.type) {
      return false
    }

    // Check if participant is stunned
    if (participant.statusEffects.has("stun")) {
      return false
    }

    // Validate based on action type
    switch (action.type) {
      case "attack":
        return action.targetId && this.state.participants.has(action.targetId)

      case "skill":
        const skill = this.config.skills[action.skillId]
        return (
          skill &&
          participant.stats.mp >= skill.mpCost &&
          action.targetId &&
          this.state.participants.has(action.targetId)
        )

      case "item":
        const item = this.config.items[action.itemId]
        const userItem = participant.items.find((i) => i.id === action.itemId && i.quantity > 0)
        return item && userItem && action.targetId && this.state.participants.has(action.targetId)

      case "defend":
        return true

      default:
        return false
    }
  }

  nextTurn() {
    this.state.currentTurn++

    // Clean up dead participants
    this.updateTurnQueue()

    if (this.state.turnQueue.length === 0) {
      this.endBattle("draw")
      return
    }

    // Process next turn after a brief delay
    setTimeout(() => {
      this.processTurn()
    }, 500)
  }

  checkBattleEnd() {
    const aliveParticipants = Array.from(this.state.participants.values()).filter((p) => p.isAlive)

    const alivePlayers = aliveParticipants.filter((p) => p.team === "player")
    const aliveEnemies = aliveParticipants.filter((p) => p.team === "enemy")

    if (alivePlayers.length === 0) {
      this.endBattle("enemy")
      return true
    } else if (aliveEnemies.length === 0) {
      this.endBattle("player")
      return true
    }

    return false
  }

  endBattle(winner) {
    console.log(`[BattleManager] Battle ended. Winner: ${winner}`)

    this.state.phase = "ended"

    // Clear any active timers
    if (this.state.turnTimer) {
      clearTimeout(this.state.turnTimer)
    }

    // Calculate rewards
    const rewards = this.calculateRewards(winner)

    // Broadcast battle end
    this.battleRoom.broadcast("battle-ended", {
      winner: winner,
      rewards: rewards,
      battleLog: this.state.battleLog,
      finalStats: this.getParticipantsData(),
    })

    this.addToBattleLog(`Battle ended! Winner: ${winner}`, "system")
  }

  calculateRewards(winner) {
    const rewards = {
      experience: 0,
      gold: 0,
      items: [],
    }

    if (winner === "player") {
      const playerCount = Array.from(this.state.participants.values()).filter((p) => p.team === "player").length

      rewards.experience = 100 * playerCount
      rewards.gold = 50 * playerCount

      // Random item drops
      if (Math.random() < 0.3) {
        rewards.items.push({
          id: "health_potion",
          name: "Health Potion",
          quantity: 1,
        })
      }

      if (Math.random() < 0.2) {
        rewards.items.push({
          id: "mana_potion",
          name: "Mana Potion",
          quantity: 1,
        })
      }
    }

    return rewards
  }

  async spawnAIEnemies() {
    const playerCount = Array.from(this.state.participants.values()).filter((p) => p.team === "player").length

    const enemyCount = Math.max(1, Math.ceil(playerCount / 2))

    for (let i = 0; i < enemyCount; i++) {
      const enemyTemplate = this.selectRandomEnemy()
      const enemyId = `ai_enemy_${i}_${Date.now()}`

      const enemy = {
        name: `${enemyTemplate.name} ${i + 1}`,
        type: "enemy",
        team: "enemy",
        level: enemyTemplate.level + Math.floor(Math.random() * 3),
        maxHp: enemyTemplate.stats.hp,
        maxMp: enemyTemplate.stats.mp,
        attack: enemyTemplate.stats.attack,
        defense: enemyTemplate.stats.defense,
        speed: enemyTemplate.stats.speed,
        accuracy: enemyTemplate.stats.accuracy || 85,
        evasion: enemyTemplate.stats.evasion || 5,
        skills: enemyTemplate.skills || [],
        items: [],
        position: { x: 400 + i * 100, y: 200 },
        sprite: enemyTemplate.sprite,
        portrait: enemyTemplate.portrait,
        aiType: enemyTemplate.aiType || "aggressive",
        aiPersonality: enemyTemplate.aiPersonality || "hostile",
      }

      this.addParticipant(enemyId, enemy)
    }
  }

  selectRandomEnemy() {
    const enemies = Object.values(this.config.enemies)
    return enemies[Math.floor(Math.random() * enemies.length)]
  }

  handlePlayerDisconnection(sessionId) {
    const participant = this.state.participants.get(sessionId)
    if (participant && participant.team === "player") {
      console.log(`[BattleManager] Player disconnected: ${participant.name}`)

      participant.isActive = false

      // Create disconnected agent
      const DisconnectedAgent = require("./DisconnectedAgent")
      const agent = new DisconnectedAgent(participant, this.config)
      this.disconnectedAgents.set(sessionId, agent)

      this.addToBattleLog(`${participant.name} has been disconnected. AI taking control.`, "system")

      this.battleRoom.broadcast("player-disconnected", {
        participantId: sessionId,
        participant: this.getParticipantData(participant),
      })
    }
  }

  handlePlayerReconnection(sessionId) {
    const participant = this.state.participants.get(sessionId)
    if (participant && participant.team === "player") {
      console.log(`[BattleManager] Player reconnected: ${participant.name}`)

      participant.isActive = true

      // Remove disconnected agent
      this.disconnectedAgents.delete(sessionId)

      this.addToBattleLog(`${participant.name} has reconnected.`, "system")

      this.battleRoom.broadcast("player-reconnected", {
        participantId: sessionId,
        participant: this.getParticipantData(participant),
      })
    }
  }

  getDisconnectedAgent(sessionId) {
    return this.disconnectedAgents.get(sessionId)
  }

  getBattleStateForAI() {
    return {
      battleId: this.state.battleId,
      phase: this.state.phase,
      currentTurn: this.state.currentTurn,
      turnQueue: this.state.turnQueue,
      participants: Array.from(this.state.participants.values()).map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        team: p.team,
        level: p.level,
        stats: { ...p.stats },
        statusEffects: Array.from(p.statusEffects.values()),
        skills: p.skills,
        items: p.items,
        isAlive: p.isAlive,
        isActive: p.isActive,
        position: p.position,
      })),
      availableSkills: this.config.skills,
      availableItems: this.config.items,
    }
  }

  getParticipantsData() {
    return Array.from(this.state.participants.values()).map((p) => this.getParticipantData(p))
  }

  getParticipantData(participant) {
    return {
      id: participant.id,
      name: participant.name,
      type: participant.type,
      team: participant.team,
      level: participant.level,
      stats: { ...participant.stats },
      statusEffects: Array.from(participant.statusEffects.values()),
      skills: participant.skills,
      items: participant.items,
      isAlive: participant.isAlive,
      isActive: participant.isActive,
      position: participant.position,
      sprite: participant.sprite,
      portrait: participant.portrait,
      lastAction: participant.lastAction,
    }
  }

  addToBattleLog(message, type = "info") {
    const logEntry = {
      message: message,
      type: type,
      timestamp: Date.now(),
    }

    this.state.battleLog.push(logEntry)

    // Broadcast log update
    this.battleRoom.broadcast("battle-log-updated", logEntry)
  }

  generateBattleId() {
    return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Cleanup method
  destroy() {
    if (this.state.turnTimer) {
      clearTimeout(this.state.turnTimer)
    }

    this.disconnectedAgents.clear()
    this.state.participants.clear()

    console.log(`[BattleManager] Battle manager destroyed: ${this.state.battleId}`)
  }
}

module.exports = BattleManager
