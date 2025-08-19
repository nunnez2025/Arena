const { Room } = require("colyseus")
const { Schema, MapSchema, type } = require("@colyseus/schema")

class BattleState extends Schema {}

type({
  battleId: "string",
  phase: "string", // 'waiting', 'battle', 'ended'
  currentTurn: "number",
  turnQueue: ["string"],
  participants: { map: "object" },
  battleLog: ["string"],
  winner: "string",
})(BattleState)

class BattleParticipant extends Schema {}

type({
  playerId: "string",
  name: "string",
  level: "number",
  hp: "number",
  maxHp: "number",
  mp: "number",
  maxMp: "number",
  attack: "number",
  defense: "number",
  speed: "number",
  statusEffects: { map: "object" },
  position: "object",
  isAlive: "boolean",
  team: "string", // 'player' or 'enemy'
})(BattleParticipant)

class StatusEffect extends Schema {}

type({
  type: "string",
  duration: "number",
  power: "number",
  icon: "string",
})(StatusEffect)

class BattleRoom extends Room {
  onCreate(options) {
    this.setState(new BattleState())

    this.state.battleId = options.battleId || this.generateBattleId()
    this.state.phase = "waiting"
    this.state.currentTurn = 0
    this.state.turnQueue = []
    this.state.participants = new MapSchema()
    this.state.battleLog = []
    this.state.winner = ""

    this.maxClients = options.maxClients || 4
    this.battleConfig = options.battleConfig || this.getDefaultBattleConfig()

    console.log(`[BattleRoom] Created battle room: ${this.state.battleId}`)

    // Auto-start battle after delay
    this.clock.setTimeout(() => {
      if (this.state.phase === "waiting") {
        this.startBattle()
      }
    }, 3000)
  }

  onJoin(client, options) {
    console.log(`[BattleRoom] Player ${client.sessionId} joined battle`)

    const participant = new BattleParticipant()
    participant.playerId = client.sessionId
    participant.name = options.playerName || `Player ${client.sessionId.substr(0, 6)}`
    participant.level = options.level || 1
    participant.maxHp = options.maxHp || 100
    participant.hp = participant.maxHp
    participant.maxMp = options.maxMp || 50
    participant.mp = participant.maxMp
    participant.attack = options.attack || 20
    participant.defense = options.defense || 15
    participant.speed = options.speed || 10
    participant.statusEffects = new MapSchema()
    participant.position = { x: options.x || 0, y: options.y || 0 }
    participant.isAlive = true
    participant.team = options.team || "player"

    this.state.participants.set(client.sessionId, participant)

    // Add to turn queue based on speed
    this.updateTurnQueue()

    // Send battle config to client
    client.send("battle-config", this.battleConfig)
  }

  onMessage(client, type, message) {
    const participant = this.state.participants.get(client.sessionId)

    if (!participant || !participant.isAlive) {
      return
    }

    switch (type) {
      case "battle-action":
        this.handleBattleAction(client, message)
        break

      case "ready-for-battle":
        this.handlePlayerReady(client)
        break

      case "use-skill":
        this.handleSkillUse(client, message)
        break

      case "use-item":
        this.handleItemUse(client, message)
        break
    }
  }

  onLeave(client, consented) {
    console.log(`[BattleRoom] Player ${client.sessionId} left battle`)

    const participant = this.state.participants.get(client.sessionId)
    if (participant) {
      participant.isAlive = false
      this.state.participants.delete(client.sessionId)
      this.updateTurnQueue()
      this.checkBattleEnd()
    }
  }

  startBattle() {
    if (this.state.phase !== "waiting") return

    console.log(`[BattleRoom] Starting battle: ${this.state.battleId}`)

    this.state.phase = "battle"
    this.updateTurnQueue()

    // Add AI enemies if needed
    this.spawnAIEnemies()

    // Broadcast battle start
    this.broadcast("battle-started", {
      battleId: this.state.battleId,
      participants: Array.from(this.state.participants.values()),
    })

    // Start first turn
    this.processTurn()
  }

  updateTurnQueue() {
    const participants = Array.from(this.state.participants.values())
      .filter((p) => p.isAlive)
      .sort((a, b) => b.speed - a.speed)

    this.state.turnQueue = participants.map((p) => p.playerId)
  }

  processTurn() {
    if (this.state.phase !== "battle" || this.state.turnQueue.length === 0) {
      return
    }

    const currentPlayerId = this.state.turnQueue[this.state.currentTurn % this.state.turnQueue.length]
    const currentParticipant = this.state.participants.get(currentPlayerId)

    if (!currentParticipant || !currentParticipant.isAlive) {
      this.nextTurn()
      return
    }

    // Process status effects
    this.processStatusEffects(currentParticipant)

    // Broadcast turn start
    this.broadcast("turn-started", {
      playerId: currentPlayerId,
      participant: currentParticipant,
      turnNumber: this.state.currentTurn,
    })

    // Set turn timeout
    this.clock.setTimeout(() => {
      if (this.state.phase === "battle") {
        this.handleTurnTimeout(currentPlayerId)
      }
    }, 30000) // 30 seconds per turn
  }

  handleBattleAction(client, action) {
    const currentPlayerId = this.state.turnQueue[this.state.currentTurn % this.state.turnQueue.length]

    if (client.sessionId !== currentPlayerId) {
      client.send("error", { message: "Not your turn!" })
      return
    }

    const attacker = this.state.participants.get(client.sessionId)
    if (!attacker || !attacker.isAlive) return

    switch (action.type) {
      case "attack":
        this.executeAttack(attacker, action.targetId)
        break

      case "magic":
        this.executeMagic(attacker, action.skillId, action.targetId)
        break

      case "item":
        this.executeItem(attacker, action.itemId, action.targetId)
        break

      case "defend":
        this.executeDefend(attacker)
        break
    }

    this.nextTurn()
  }

  executeAttack(attacker, targetId) {
    const target = this.state.participants.get(targetId)
    if (!target || !target.isAlive) return

    // Calculate damage
    const baseDamage = attacker.attack
    const defense = target.defense
    const randomFactor = 0.8 + Math.random() * 0.4 // 80-120% damage

    let damage = Math.max(1, Math.floor((baseDamage - defense * 0.5) * randomFactor))

    // Check for critical hit
    const criticalChance = 0.1 // 10%
    const isCritical = Math.random() < criticalChance
    if (isCritical) {
      damage *= 2
    }

    // Check for miss
    const hitChance = 0.9 // 90%
    const isHit = Math.random() < hitChance

    if (!isHit) {
      damage = 0
    }

    // Apply damage
    target.hp = Math.max(0, target.hp - damage)

    if (target.hp === 0) {
      target.isAlive = false
      this.updateTurnQueue()
    }

    // Broadcast attack result
    this.broadcast("attack-result", {
      attackerId: attacker.playerId,
      targetId: target.playerId,
      damage: damage,
      isCritical: isCritical,
      isMiss: !isHit,
      targetHp: target.hp,
      targetMaxHp: target.maxHp,
    })

    // Add to battle log
    const logMessage = isHit
      ? `${attacker.name} attacks ${target.name} for ${damage} damage${isCritical ? " (CRITICAL!)" : ""}!`
      : `${attacker.name} attacks ${target.name} but misses!`

    this.state.battleLog.push(logMessage)

    this.checkBattleEnd()
  }

  executeMagic(attacker, skillId, targetId) {
    const skill = this.battleConfig.skills[skillId]
    if (!skill) return

    // Check MP cost
    if (attacker.mp < skill.mpCost) {
      this.broadcast("error", {
        playerId: attacker.playerId,
        message: "Not enough MP!",
      })
      return
    }

    attacker.mp -= skill.mpCost

    const target = this.state.participants.get(targetId)
    if (!target) return

    let value = 0

    switch (skill.type) {
      case "damage":
        value = Math.floor(skill.power * (1 + attacker.level * 0.1))
        target.hp = Math.max(0, target.hp - value)
        if (target.hp === 0) {
          target.isAlive = false
          this.updateTurnQueue()
        }
        break

      case "heal":
        value = Math.floor(skill.power * (1 + attacker.level * 0.1))
        target.hp = Math.min(target.maxHp, target.hp + value)
        break

      case "status":
        this.applyStatusEffect(target, skill.statusEffect)
        break
    }

    // Broadcast magic result
    this.broadcast("magic-result", {
      casterId: attacker.playerId,
      targetId: target.playerId,
      skillId: skillId,
      skill: skill,
      value: value,
      targetHp: target.hp,
      targetMp: target.mp,
      casterMp: attacker.mp,
    })

    // Add to battle log
    this.state.battleLog.push(`${attacker.name} casts ${skill.name}!`)

    this.checkBattleEnd()
  }

  executeDefend(attacker) {
    // Apply defense buff
    const defenseBoost = new StatusEffect()
    defenseBoost.type = "defense_boost"
    defenseBoost.duration = 1
    defenseBoost.power = 50 // 50% defense increase
    defenseBoost.icon = "shield"

    attacker.statusEffects.set("defense_boost", defenseBoost)

    // Broadcast defend result
    this.broadcast("defend-result", {
      playerId: attacker.playerId,
      statusEffect: defenseBoost,
    })

    this.state.battleLog.push(`${attacker.name} takes a defensive stance!`)
  }

  applyStatusEffect(target, effectData) {
    const effect = new StatusEffect()
    effect.type = effectData.type
    effect.duration = effectData.duration
    effect.power = effectData.power
    effect.icon = effectData.icon

    target.statusEffects.set(effectData.type, effect)
  }

  processStatusEffects(participant) {
    const effects = Array.from(participant.statusEffects.values())

    effects.forEach((effect) => {
      switch (effect.type) {
        case "poison":
          const poisonDamage = Math.floor(participant.maxHp * 0.1)
          participant.hp = Math.max(0, participant.hp - poisonDamage)
          this.broadcast("status-damage", {
            playerId: participant.playerId,
            type: "poison",
            damage: poisonDamage,
            hp: participant.hp,
          })
          break

        case "regeneration":
          const healAmount = Math.floor(participant.maxHp * 0.05)
          participant.hp = Math.min(participant.maxHp, participant.hp + healAmount)
          this.broadcast("status-heal", {
            playerId: participant.playerId,
            type: "regeneration",
            heal: healAmount,
            hp: participant.hp,
          })
          break
      }

      // Decrease duration
      effect.duration--
      if (effect.duration <= 0) {
        participant.statusEffects.delete(effect.type)
      }
    })

    if (participant.hp === 0) {
      participant.isAlive = false
      this.updateTurnQueue()
      this.checkBattleEnd()
    }
  }

  nextTurn() {
    this.state.currentTurn++

    // Clean up dead participants from turn queue
    this.updateTurnQueue()

    if (this.state.turnQueue.length === 0) {
      this.endBattle("draw")
      return
    }

    // Process next turn
    this.clock.setTimeout(() => {
      this.processTurn()
    }, 1000)
  }

  handleTurnTimeout(playerId) {
    console.log(`[BattleRoom] Turn timeout for player: ${playerId}`)

    // Auto-defend on timeout
    const participant = this.state.participants.get(playerId)
    if (participant && participant.isAlive) {
      this.executeDefend(participant)
    }

    this.nextTurn()
  }

  checkBattleEnd() {
    const alivePlayers = Array.from(this.state.participants.values()).filter((p) => p.isAlive)

    const alivePlayerTeam = alivePlayers.filter((p) => p.team === "player")
    const aliveEnemyTeam = alivePlayers.filter((p) => p.team === "enemy")

    if (alivePlayerTeam.length === 0) {
      this.endBattle("enemy")
    } else if (aliveEnemyTeam.length === 0) {
      this.endBattle("player")
    }
  }

  endBattle(winner) {
    console.log(`[BattleRoom] Battle ended. Winner: ${winner}`)

    this.state.phase = "ended"
    this.state.winner = winner

    // Calculate rewards
    const rewards = this.calculateRewards(winner)

    // Broadcast battle end
    this.broadcast("battle-ended", {
      winner: winner,
      rewards: rewards,
      battleLog: this.state.battleLog,
    })

    // Auto-disconnect after delay
    this.clock.setTimeout(() => {
      this.disconnect()
    }, 10000)
  }

  calculateRewards(winner) {
    const rewards = {
      experience: 0,
      gold: 0,
      items: [],
    }

    if (winner === "player") {
      rewards.experience = 100
      rewards.gold = 50

      // Random item drop
      if (Math.random() < 0.3) {
        rewards.items.push({
          id: "health_potion",
          name: "Health Potion",
          quantity: 1,
        })
      }
    }

    return rewards
  }

  spawnAIEnemies() {
    const enemyCount = Math.max(1, Math.floor(this.clients.length / 2))

    for (let i = 0; i < enemyCount; i++) {
      const enemyId = `ai_enemy_${i}`
      const enemy = new BattleParticipant()

      enemy.playerId = enemyId
      enemy.name = `Shadow Warrior ${i + 1}`
      enemy.level = Math.floor(Math.random() * 5) + 1
      enemy.maxHp = 80 + enemy.level * 20
      enemy.hp = enemy.maxHp
      enemy.maxMp = 30 + enemy.level * 10
      enemy.mp = enemy.maxMp
      enemy.attack = 15 + enemy.level * 5
      enemy.defense = 10 + enemy.level * 3
      enemy.speed = 8 + Math.floor(Math.random() * 10)
      enemy.statusEffects = new MapSchema()
      enemy.position = { x: 400 + i * 100, y: 200 }
      enemy.isAlive = true
      enemy.team = "enemy"

      this.state.participants.set(enemyId, enemy)

      // AI behavior
      this.setupAIBehavior(enemyId)
    }

    this.updateTurnQueue()
  }

  setupAIBehavior(enemyId) {
    // AI will act when it's their turn
    this.clock.setInterval(() => {
      if (this.state.phase !== "battle") return

      const currentPlayerId = this.state.turnQueue[this.state.currentTurn % this.state.turnQueue.length]

      if (currentPlayerId === enemyId) {
        const enemy = this.state.participants.get(enemyId)
        if (!enemy || !enemy.isAlive) return

        // Simple AI: attack random player
        const playerTargets = Array.from(this.state.participants.values()).filter(
          (p) => p.team === "player" && p.isAlive,
        )

        if (playerTargets.length > 0) {
          const randomTarget = playerTargets[Math.floor(Math.random() * playerTargets.length)]

          // 70% chance to attack, 30% chance to use magic
          if (Math.random() < 0.7 || enemy.mp < 10) {
            this.executeAttack(enemy, randomTarget.playerId)
          } else {
            // Use a random skill
            const availableSkills = Object.keys(this.battleConfig.skills).filter(
              (skillId) => this.battleConfig.skills[skillId].mpCost <= enemy.mp,
            )

            if (availableSkills.length > 0) {
              const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)]
              this.executeMagic(enemy, randomSkill, randomTarget.playerId)
            } else {
              this.executeAttack(enemy, randomTarget.playerId)
            }
          }

          this.nextTurn()
        }
      }
    }, 2000)
  }

  generateBattleId() {
    return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getDefaultBattleConfig() {
    return {
      skills: {
        fireball: {
          id: "fireball",
          name: "Fireball",
          type: "damage",
          power: 40,
          mpCost: 15,
          animation: "fire_cast",
          targetType: "single",
          description: "Launches a blazing fireball at the enemy",
        },
        heal: {
          id: "heal",
          name: "Heal",
          type: "heal",
          power: 50,
          mpCost: 12,
          animation: "heal_cast",
          targetType: "single",
          description: "Restores HP to target",
        },
        poison: {
          id: "poison",
          name: "Poison",
          type: "status",
          power: 0,
          mpCost: 8,
          animation: "poison_cast",
          targetType: "single",
          statusEffect: {
            type: "poison",
            duration: 3,
            power: 10,
            icon: "poison",
          },
          description: "Inflicts poison status on enemy",
        },
      },
      items: {
        health_potion: {
          id: "health_potion",
          name: "Health Potion",
          type: "heal",
          power: 30,
          description: "Restores 30 HP",
        },
        mana_potion: {
          id: "mana_potion",
          name: "Mana Potion",
          type: "mana",
          power: 20,
          description: "Restores 20 MP",
        },
      },
    }
  }
}

module.exports = BattleRoom
