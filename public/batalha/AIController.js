/**
 * AIController - Manages AI calls with fallback chain
 * Handles external AI APIs for enemy decision making
 */

const FallbackChain = require("./FallbackChain")

class AIController {
  constructor(config) {
    this.config = config
    this.fallbackChain = new FallbackChain(config.aiProviders || [])
    this.requestCache = new Map()
    this.rateLimiter = new Map()

    console.log("[AIController] Initialized with providers:", Object.keys(config.aiProviders || {}))
  }

  async getEnemyAction(enemy, battleState) {
    try {
      console.log(`[AIController] Getting action for enemy: ${enemy.name}`)

      // Check rate limiting
      if (this.isRateLimited(enemy.id)) {
        console.warn(`[AIController] Rate limited for enemy: ${enemy.id}`)
        return this.getFallbackAction(enemy, battleState)
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(enemy, battleState)
      if (this.requestCache.has(cacheKey)) {
        console.log(`[AIController] Using cached action for enemy: ${enemy.name}`)
        return this.requestCache.get(cacheKey)
      }

      // Prepare AI request
      const aiRequest = this.prepareAIRequest(enemy, battleState)

      // Try to get action from AI providers
      const action = await this.fallbackChain.execute(aiRequest)

      if (action) {
        // Cache successful result
        this.requestCache.set(cacheKey, action)

        // Update rate limiter
        this.updateRateLimit(enemy.id)

        console.log(`[AIController] AI action received for ${enemy.name}:`, action)
        return action
      } else {
        console.warn(`[AIController] No AI action received for ${enemy.name}, using fallback`)
        return this.getFallbackAction(enemy, battleState)
      }
    } catch (error) {
      console.error(`[AIController] Error getting enemy action:`, error)
      return this.getFallbackAction(enemy, battleState)
    }
  }

  prepareAIRequest(enemy, battleState) {
    // Prepare context for AI
    const context = {
      enemy: {
        id: enemy.id,
        name: enemy.name,
        level: enemy.level,
        stats: enemy.stats,
        statusEffects: Array.from(enemy.statusEffects.values()),
        skills: enemy.skills,
        aiType: enemy.aiType,
        aiPersonality: enemy.aiPersonality,
      },
      battleState: {
        phase: battleState.phase,
        turnNumber: Math.floor(battleState.currentTurn / battleState.turnQueue.length) + 1,
        participants: battleState.participants.map((p) => ({
          id: p.id,
          name: p.name,
          team: p.team,
          level: p.level,
          stats: p.stats,
          statusEffects: p.statusEffects,
          isAlive: p.isAlive,
          position: p.position,
        })),
      },
      availableActions: this.getAvailableActions(enemy, battleState),
      gameRules: {
        turnBased: true,
        maxTurnTime: 30,
        statusEffectRules: this.config.statusEffects,
        damageFormulas: this.config.damageFormulas,
      },
    }

    // Create AI prompt based on enemy personality
    const prompt = this.createAIPrompt(enemy, context)

    return {
      model: this.selectAIModel(enemy),
      prompt: prompt,
      context: context,
      maxTokens: 150,
      temperature: this.getTemperature(enemy),
      responseFormat: "json",
    }
  }

  createAIPrompt(enemy, context) {
    const personality = this.getPersonalityPrompt(enemy.aiPersonality)
    const tacticalInfo = this.getTacticalInfo(context)

    return `You are ${enemy.name}, a ${enemy.aiPersonality} enemy in a turn-based RPG battle.

${personality}

CURRENT BATTLE STATE:
${tacticalInfo}

YOUR STATUS:
- HP: ${enemy.stats.hp}/${enemy.stats.maxHp}
- MP: ${enemy.stats.mp}/${enemy.stats.maxMp}
- Level: ${enemy.level}
- Status Effects: ${enemy.statusEffects.length > 0 ? enemy.statusEffects.map((e) => e.type).join(", ") : "None"}

AVAILABLE ACTIONS:
${JSON.stringify(context.availableActions, null, 2)}

Choose your action wisely. Consider:
1. Your current HP/MP situation
2. Enemy positions and weaknesses
3. Status effects on yourself and enemies
4. Your personality and combat style
5. Tactical advantages

Respond with a JSON object in this exact format:
{
  "type": "attack|skill|item|defend",
  "targetId": "target_participant_id",
  "skillId": "skill_id_if_using_skill",
  "itemId": "item_id_if_using_item",
  "reasoning": "brief explanation of your choice"
}

Choose the most strategic action for this turn:`
  }

  getPersonalityPrompt(personality) {
    const personalities = {
      hostile: "You are aggressive and prefer direct attacks. You prioritize dealing damage over defense.",
      tactical: "You are strategic and analytical. You use status effects and positioning to your advantage.",
      defensive: "You are cautious and prefer to defend and heal when necessary before attacking.",
      berserker: "You are wild and unpredictable. You favor high-risk, high-reward actions.",
      cowardly: "You are fearful and prefer to flee or defend when your HP is low.",
      cunning: "You are clever and deceptive. You use tricks and status effects to confuse enemies.",
    }

    return personalities[personality] || personalities.hostile
  }

  getTacticalInfo(context) {
    const enemies = context.battleState.participants.filter((p) => p.team === "player" && p.isAlive)
    const allies = context.battleState.participants.filter((p) => p.team === "enemy" && p.isAlive)

    let info = `Turn ${context.battleState.turnNumber}\n`
    info += `Enemies (${enemies.length}):\n`

    enemies.forEach((enemy) => {
      info += `- ${enemy.name}: HP ${enemy.stats.hp}/${enemy.stats.maxHp}, MP ${enemy.stats.mp}/${enemy.stats.maxMp}`
      if (enemy.statusEffects.length > 0) {
        info += ` [${enemy.statusEffects.map((e) => e.type).join(", ")}]`
      }
      info += "\n"
    })

    info += `Allies (${allies.length}):\n`
    allies.forEach((ally) => {
      info += `- ${ally.name}: HP ${ally.stats.hp}/${ally.stats.maxHp}, MP ${ally.stats.mp}/${ally.stats.maxMp}`
      if (ally.statusEffects.length > 0) {
        info += ` [${ally.statusEffects.map((e) => e.type).join(", ")}]`
      }
      info += "\n"
    })

    return info
  }

  getAvailableActions(enemy, battleState) {
    const actions = []

    // Always can attack and defend
    actions.push({ type: "attack", description: "Basic physical attack" })
    actions.push({ type: "defend", description: "Defensive stance, reduces incoming damage" })

    // Available skills
    enemy.skills.forEach((skillId) => {
      const skill = this.config.skills[skillId]
      if (skill && enemy.stats.mp >= skill.mpCost) {
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

    // Available items (if any)
    enemy.items.forEach((item) => {
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

  selectAIModel(enemy) {
    // Select AI model based on enemy type and available providers
    const aiType = enemy.aiType || "aggressive"

    const modelPreferences = {
      aggressive: ["gpt-4", "claude-3", "gemini-pro"],
      tactical: ["claude-3", "gpt-4", "gemini-pro"],
      defensive: ["gemini-pro", "gpt-4", "claude-3"],
      berserker: ["gpt-4", "gemini-pro", "claude-3"],
      cowardly: ["claude-3", "gemini-pro", "gpt-4"],
      cunning: ["claude-3", "gpt-4", "gemini-pro"],
    }

    const preferences = modelPreferences[aiType] || modelPreferences.aggressive

    // Return first available model from preferences
    for (const model of preferences) {
      if (this.fallbackChain.hasProvider(model)) {
        return model
      }
    }

    return "local" // Fallback to local AI
  }

  getTemperature(enemy) {
    // Adjust creativity based on enemy personality
    const temperatureMap = {
      hostile: 0.3,
      tactical: 0.1,
      defensive: 0.2,
      berserker: 0.9,
      cowardly: 0.4,
      cunning: 0.7,
    }

    return temperatureMap[enemy.aiPersonality] || 0.5
  }

  getFallbackAction(enemy, battleState) {
    console.log(`[AIController] Using fallback action for enemy: ${enemy.name}`)

    // Simple rule-based AI as fallback
    const enemies = battleState.participants.filter((p) => p.team === "player" && p.isAlive)

    if (enemies.length === 0) {
      return { type: "defend", targetId: enemy.id }
    }

    // Select target (lowest HP enemy)
    const target = enemies.reduce((lowest, current) => (current.stats.hp < lowest.stats.hp ? current : lowest))

    // Decision logic based on AI type
    switch (enemy.aiType) {
      case "aggressive":
        // 80% attack, 20% skill
        if (Math.random() < 0.8 || enemy.stats.mp < 10) {
          return { type: "attack", targetId: target.id }
        } else {
          const availableSkills = enemy.skills.filter((skillId) => {
            const skill = this.config.skills[skillId]
            return skill && enemy.stats.mp >= skill.mpCost
          })

          if (availableSkills.length > 0) {
            const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)]
            return { type: "skill", skillId: randomSkill, targetId: target.id }
          } else {
            return { type: "attack", targetId: target.id }
          }
        }

      case "defensive":
        // Defend if low HP, otherwise attack
        if (enemy.stats.hp < enemy.stats.maxHp * 0.3) {
          return { type: "defend", targetId: enemy.id }
        } else {
          return { type: "attack", targetId: target.id }
        }

      case "tactical":
        // Use skills more often
        if (enemy.stats.mp >= 15) {
          const availableSkills = enemy.skills.filter((skillId) => {
            const skill = this.config.skills[skillId]
            return skill && enemy.stats.mp >= skill.mpCost
          })

          if (availableSkills.length > 0) {
            const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)]
            return { type: "skill", skillId: randomSkill, targetId: target.id }
          }
        }
        return { type: "attack", targetId: target.id }

      default:
        return { type: "attack", targetId: target.id }
    }
  }

  isRateLimited(enemyId) {
    const now = Date.now()
    const lastRequest = this.rateLimiter.get(enemyId)

    // Rate limit: max 1 request per 2 seconds per enemy
    return lastRequest && now - lastRequest < 2000
  }

  updateRateLimit(enemyId) {
    this.rateLimiter.set(enemyId, Date.now())
  }

  generateCacheKey(enemy, battleState) {
    // Create a simple cache key based on battle state
    const stateHash = JSON.stringify({
      enemyHp: enemy.stats.hp,
      enemyMp: enemy.stats.mp,
      enemyEffects: Array.from(enemy.statusEffects.keys()).sort(),
      enemiesAlive: battleState.participants
        .filter((p) => p.team === "player" && p.isAlive)
        .map((p) => ({ id: p.id, hp: p.stats.hp }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    })

    return `${enemy.id}_${Buffer.from(stateHash).toString("base64").substr(0, 16)}`
  }

  // Cleanup method
  clearCache() {
    this.requestCache.clear()
    this.rateLimiter.clear()
  }
}

module.exports = AIController
