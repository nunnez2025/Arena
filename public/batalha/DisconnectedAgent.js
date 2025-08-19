/**
 * DisconnectedAgent - AI agent for disconnected players
 * Provides intelligent behavior for temporarily disconnected players
 */

class DisconnectedAgent {
  constructor(player, config) {
    this.player = player
    this.config = config
    this.personality = this.determinePersonality(player)
    this.strategy = this.determineStrategy(player)

    console.log(`[DisconnectedAgent] Created agent for ${player.name} with ${this.personality} personality`)
  }

  determinePersonality(player) {
    // Determine AI personality based on player's stats and history
    const { stats } = player

    if (stats.attack > stats.defense) {
      return "aggressive"
    } else if (stats.defense > stats.attack) {
      return "defensive"
    } else if (stats.speed > (stats.attack + stats.defense) / 2) {
      return "tactical"
    } else {
      return "balanced"
    }
  }

  determineStrategy(player) {
    // Determine strategy based on current battle state
    const hpPercentage = player.stats.hp / player.stats.maxHp
    const mpPercentage = player.stats.mp / player.stats.maxMp

    if (hpPercentage < 0.3) {
      return "survival"
    } else if (mpPercentage > 0.7) {
      return "aggressive"
    } else if (hpPercentage > 0.8) {
      return "offensive"
    } else {
      return "balanced"
    }
  }

  async getAction(player, battleState) {
    try {
      console.log(`[DisconnectedAgent] Getting action for disconnected player: ${player.name}`)

      // Update strategy based on current state
      this.strategy = this.determineStrategy(player)

      // Get available actions
      const availableActions = this.getAvailableActions(player, battleState)

      // Choose action based on personality and strategy
      const action = this.chooseAction(player, battleState, availableActions)

      console.log(`[DisconnectedAgent] Chosen action for ${player.name}:`, action)
      return action
    } catch (error) {
      console.error(`[DisconnectedAgent] Error getting action for ${player.name}:`, error)

      // Fallback to defend
      return {
        type: "defend",
        targetId: player.id,
        reasoning: "Error fallback - defending",
      }
    }
  }

  getAvailableActions(player, battleState) {
    const actions = []

    // Basic actions
    actions.push({ type: "attack", description: "Basic attack" })
    actions.push({ type: "defend", description: "Defensive stance" })

    // Available skills
    player.skills.forEach((skillId) => {
      const skill = this.config.skills[skillId]
      if (skill && player.stats.mp >= skill.mpCost) {
        actions.push({
          type: "skill",
          skillId: skillId,
          name: skill.name,
          description: skill.description,
          mpCost: skill.mpCost,
          power: skill.power,
          targetType: skill.targetType,
        })
      }
    })

    // Available items
    player.items.forEach((item) => {
      if (item.quantity > 0 && item.usableInBattle) {
        actions.push({
          type: "item",
          itemId: item.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
        })
      }
    })

    return actions
  }

  chooseAction(player, battleState, availableActions) {
    const enemies = battleState.participants.filter((p) => p.team === "enemy" && p.isAlive)
    const allies = battleState.participants.filter((p) => p.team === "player" && p.isAlive && p.id !== player.id)

    if (enemies.length === 0) {
      return {
        type: "defend",
        targetId: player.id,
        reasoning: "No enemies available",
      }
    }

    // Choose action based on strategy and personality
    switch (this.strategy) {
      case "survival":
        return this.chooseSurvivalAction(player, battleState, availableActions, allies)

      case "aggressive":
        return this.chooseAggressiveAction(player, battleState, availableActions, enemies)

      case "offensive":
        return this.chooseOffensiveAction(player, battleState, availableActions, enemies)

      default:
        return this.chooseBalancedAction(player, battleState, availableActions, enemies, allies)
    }
  }

  chooseSurvivalAction(player, battleState, availableActions, allies) {
    // Priority: Heal > Defend > Support allies

    // Look for healing items
    const healingItems = availableActions.filter(
      (a) => a.type === "item" && a.name.toLowerCase().includes("potion") && a.name.toLowerCase().includes("health"),
    )

    if (healingItems.length > 0) {
      return {
        type: "item",
        itemId: healingItems[0].itemId,
        targetId: player.id,
        reasoning: "Using healing item for survival",
      }
    }

    // Look for healing skills
    const healingSkills = availableActions.filter(
      (a) =>
        a.type === "skill" && (a.name.toLowerCase().includes("heal") || a.description.toLowerCase().includes("heal")),
    )

    if (healingSkills.length > 0) {
      return {
        type: "skill",
        skillId: healingSkills[0].skillId,
        targetId: player.id,
        reasoning: "Using healing skill for survival",
      }
    }

    // Default to defend
    return {
      type: "defend",
      targetId: player.id,
      reasoning: "Defending for survival",
    }
  }

  chooseAggressiveAction(player, battleState, availableActions, enemies) {
    // Priority: Powerful skills > Attack > Defend

    // Look for damage skills
    const damageSkills = availableActions
      .filter((a) => a.type === "skill" && a.power > 30)
      .sort((a, b) => b.power - a.power)

    if (damageSkills.length > 0) {
      const target = this.selectBestTarget(enemies, "damage")
      return {
        type: "skill",
        skillId: damageSkills[0].skillId,
        targetId: target.id,
        reasoning: "Using powerful skill aggressively",
      }
    }

    // Attack weakest enemy
    const target = this.selectBestTarget(enemies, "attack")
    return {
      type: "attack",
      targetId: target.id,
      reasoning: "Aggressive attack on weakest enemy",
    }
  }

  chooseOffensiveAction(player, battleState, availableActions, enemies) {
    // Priority: Status effects > Skills > Attack

    // Look for debuff skills
    const debuffSkills = availableActions.filter(
      (a) =>
        a.type === "skill" &&
        (a.description.toLowerCase().includes("poison") ||
          a.description.toLowerCase().includes("stun") ||
          a.description.toLowerCase().includes("weaken")),
    )

    if (debuffSkills.length > 0) {
      const target = this.selectBestTarget(enemies, "debuff")
      return {
        type: "skill",
        skillId: debuffSkills[0].skillId,
        targetId: target.id,
        reasoning: "Applying debuff for tactical advantage",
      }
    }

    // Use any available skill
    const availableSkills = availableActions.filter((a) => a.type === "skill")
    if (availableSkills.length > 0) {
      const target = this.selectBestTarget(enemies, "skill")
      return {
        type: "skill",
        skillId: availableSkills[0].skillId,
        targetId: target.id,
        reasoning: "Using available skill offensively",
      }
    }

    // Attack
    const target = this.selectBestTarget(enemies, "attack")
    return {
      type: "attack",
      targetId: target.id,
      reasoning: "Offensive attack",
    }
  }

  chooseBalancedAction(player, battleState, availableActions, enemies, allies) {
    // Balanced approach based on situation

    const hpPercentage = player.stats.hp / player.stats.maxHp
    const mpPercentage = player.stats.mp / player.stats.maxMp

    // If low HP, prioritize healing
    if (hpPercentage < 0.4) {
      return this.chooseSurvivalAction(player, battleState, availableActions, allies)
    }

    // If high MP, use skills
    if (mpPercentage > 0.6) {
      const availableSkills = availableActions.filter((a) => a.type === "skill")
      if (availableSkills.length > 0) {
        const target = this.selectBestTarget(enemies, "skill")
        return {
          type: "skill",
          skillId: availableSkills[0].skillId,
          targetId: target.id,
          reasoning: "Using skill with high MP",
        }
      }
    }

    // Check if any ally needs help
    const injuredAllies = allies.filter((ally) => ally.stats.hp < ally.stats.maxHp * 0.3)
    if (injuredAllies.length > 0) {
      const healingSkills = availableActions.filter(
        (a) => a.type === "skill" && a.description.toLowerCase().includes("heal"),
      )

      if (healingSkills.length > 0) {
        return {
          type: "skill",
          skillId: healingSkills[0].skillId,
          targetId: injuredAllies[0].id,
          reasoning: "Healing injured ally",
        }
      }
    }

    // Default to attack
    const target = this.selectBestTarget(enemies, "attack")
    return {
      type: "attack",
      targetId: target.id,
      reasoning: "Balanced attack approach",
    }
  }

  selectBestTarget(enemies, actionType) {
    if (enemies.length === 0) {
      return null
    }

    switch (actionType) {
      case "damage":
      case "attack":
        // Target lowest HP enemy
        return enemies.reduce((lowest, current) => (current.stats.hp < lowest.stats.hp ? current : lowest))

      case "debuff":
        // Target highest HP enemy (likely to survive longer with debuff)
        return enemies.reduce((highest, current) => (current.stats.hp > highest.stats.hp ? current : highest))

      case "skill":
        // Target based on personality
        if (this.personality === "aggressive") {
          return enemies.reduce((lowest, current) => (current.stats.hp < lowest.stats.hp ? current : lowest))
        } else {
          return enemies.reduce((highest, current) => (current.stats.hp > highest.stats.hp ? current : highest))
        }

      default:
        return enemies[0]
    }
  }

  updateStrategy(player, battleState) {
    // Update strategy based on changing battle conditions
    this.strategy = this.determineStrategy(player)

    // Additional strategy adjustments
    const enemies = battleState.participants.filter((p) => p.team === "enemy" && p.isAlive)
    const allies = battleState.participants.filter((p) => p.team === "player" && p.isAlive)

    // If outnumbered, switch to survival
    if (enemies.length > allies.length * 1.5) {
      this.strategy = "survival"
    }

    // If winning, switch to aggressive
    if (allies.length > enemies.length * 1.5) {
      this.strategy = "aggressive"
    }
  }
}

module.exports = DisconnectedAgent
