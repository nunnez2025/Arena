/**
 * Shadow AI Controller - Automatic battle AI for NFT Shadows
 * Uses external AI APIs with fallback chain for combat decisions
 */

const AIProviderManager = require("./AIProviderManager")

class ShadowAIController {
  constructor(battleScene) {
    this.battleScene = battleScene
    this.aiProviderManager = new AIProviderManager()
    this.requestCache = new Map()
    this.isInitialized = false

    // Initialize AI providers
    this.initializeAI()
  }

  async initializeAI() {
    try {
      const success = await this.aiProviderManager.initialize()
      this.isInitialized = success

      if (success) {
        console.log("[ShadowAIController] AI providers initialized successfully")
      } else {
        console.warn("[ShadowAIController] AI providers failed to initialize, using local fallback")
      }
    } catch (error) {
      console.error("[ShadowAIController] Error initializing AI:", error)
      this.isInitialized = false
    }
  }

  initializeAIProviders() {
    return {
      openai: {
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
      claude: {
        endpoint: "https://api.anthropic.com/v1/messages",
        model: "claude-3-sonnet-20240229",
        headers: {
          "x-api-key": process.env.CLAUDE_API_KEY,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
      },
      gemini: {
        endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        model: "gemini-pro",
        headers: {
          "Content-Type": "application/json",
        },
      },
      local: {
        type: "local",
      },
    }
  }

  async getAction(shadow, battleState) {
    try {
      console.log(`[ShadowAIController] Getting action for shadow: ${shadow.name}`)

      if (!this.isInitialized) {
        console.warn("[ShadowAIController] AI not initialized, using local fallback")
        return this.getLocalAIAction(shadow, battleState)
      }

      // Use the AI Provider Manager
      const action = await this.aiProviderManager.getBattleAction(shadow, battleState)

      if (action && this.validateAction(action, battleState)) {
        console.log(`[ShadowAIController] Valid action received:`, action)
        return action
      } else {
        console.warn(`[ShadowAIController] Invalid action received, using fallback`)
        return this.getLocalAIAction(shadow, battleState)
      }
    } catch (error) {
      console.error(`[ShadowAIController] Error getting action:`, error)
      return this.getLocalAIAction(shadow, battleState)
    }
  }

  prepareAIRequest(shadow, battleState) {
    const enemies = shadow.team === "player" ? battleState.enemyShadows : battleState.playerShadows
    const allies = shadow.team === "player" ? battleState.playerShadows : battleState.enemyShadows

    const context = {
      shadow: {
        id: shadow.id,
        name: shadow.name,
        element: shadow.element,
        affinity: shadow.affinity,
        class: shadow.class,
        power: shadow.power,
        defense: shadow.defense,
        speed: shadow.speed,
        rarity: shadow.rarity,
        currentHp: shadow.currentHp,
        maxHp: shadow.maxHp,
        buffs: shadow.buffs,
      },
      enemies: enemies
        .filter((s) => s.isAlive)
        .map((s) => ({
          id: s.id,
          name: s.name,
          element: s.element,
          affinity: s.affinity,
          currentHp: s.currentHp,
          maxHp: s.maxHp,
          power: s.power,
          defense: s.defense,
        })),
      allies: allies
        .filter((s) => s.isAlive)
        .map((s) => ({
          id: s.id,
          name: s.name,
          element: s.element,
          currentHp: s.currentHp,
          maxHp: s.maxHp,
        })),
      masterAffinity: battleState.masterAffinity,
      turn: battleState.turn,
    }

    const prompt = this.createBattlePrompt(shadow, context)

    return {
      context: context,
      prompt: prompt,
      maxTokens: 100,
      temperature: this.getTemperatureForShadow(shadow),
    }
  }

  createBattlePrompt(shadow, context) {
    const personalityPrompt = this.getPersonalityPrompt(shadow)
    const tacticalInfo = this.getTacticalInfo(context)

    return `You are ${shadow.name}, a ${shadow.rarity} ${shadow.class} Shadow with ${shadow.element} element and ${shadow.affinity} affinity.

${personalityPrompt}

CURRENT BATTLE SITUATION:
${tacticalInfo}

YOUR STATUS:
- HP: ${shadow.currentHp}/${shadow.maxHp} (${Math.round((shadow.currentHp / shadow.maxHp) * 100)}%)
- Power: ${shadow.power}
- Defense: ${shadow.defense}
- Element: ${shadow.element}
- Affinity: ${shadow.affinity}
- Buffs: ${shadow.buffs.length > 0 ? shadow.buffs.map((b) => b.type).join(", ") : "None"}

AVAILABLE TARGETS:
${context.enemies.map((e) => `- ${e.name} (${e.element}, HP: ${e.currentHp}/${e.maxHp})`).join("\n")}

COMBAT STRATEGY:
Consider these factors:
1. Element effectiveness: ${shadow.element} vs enemy elements
2. Target priority: Focus on weakest or most dangerous enemies
3. Your current HP situation
4. Affinity synergies with Master Affinity: ${context.masterAffinity}

Choose your target wisely. Respond with ONLY a JSON object:
{
  "targetId": "enemy_shadow_id",
  "type": "attack",
  "reasoning": "brief tactical explanation"
}

Choose the most strategic target:`
  }

  getPersonalityPrompt(shadow) {
    const personalities = {
      Invoker:
        "You are a mystical spellcaster who prefers strategic, calculated attacks. You analyze weaknesses before striking.",
      Warrior: "You are a fierce combatant who favors direct, powerful attacks against the strongest opponents.",
      Assassin: "You are a cunning fighter who targets the weakest enemies first to eliminate threats quickly.",
      Guardian:
        "You are a protective defender who prioritizes threats to your allies and focuses on dangerous enemies.",
      Berserker: "You are a wild fighter who attacks with reckless abandon, preferring high-damage chaos.",
      Technomancer: "You are a tech-savvy combatant who uses logical analysis to find optimal targets.",
    }

    return personalities[shadow.class] || personalities.Warrior
  }

  getTacticalInfo(context) {
    let info = `Turn ${context.turn + 1}\n`
    info += `Master Affinity: ${context.masterAffinity}\n\n`

    info += `ENEMIES (${context.enemies.length}):\n`
    context.enemies.forEach((enemy) => {
      const hpPercent = Math.round((enemy.currentHp / enemy.maxHp) * 100)
      info += `- ${enemy.name}: ${enemy.element} element, ${hpPercent}% HP, Power: ${enemy.power}\n`
    })

    info += `\nALLIES (${context.allies.length}):\n`
    context.allies.forEach((ally) => {
      const hpPercent = Math.round((ally.currentHp / ally.maxHp) * 100)
      info += `- ${ally.name}: ${ally.element} element, ${hpPercent}% HP\n`
    })

    return info
  }

  async callExternalAI(provider, request) {
    const config = this.aiProviders[provider]
    if (!config) throw new Error(`Provider ${provider} not configured`)

    let requestBody = {}
    let responseParser = null

    switch (provider) {
      case "openai":
        requestBody = {
          model: config.model,
          messages: [
            {
              role: "system",
              content: "You are a tactical AI for a cyber-occult battle game. Respond only with valid JSON.",
            },
            {
              role: "user",
              content: request.prompt,
            },
          ],
          max_tokens: request.maxTokens,
          temperature: request.temperature,
        }
        responseParser = (data) => {
          const content = data.choices[0]?.message?.content
          return this.parseAIResponse(content)
        }
        break

      case "claude":
        requestBody = {
          model: config.model,
          max_tokens: request.maxTokens,
          messages: [
            {
              role: "user",
              content: request.prompt,
            },
          ],
        }
        responseParser = (data) => {
          const content = data.content[0]?.text
          return this.parseAIResponse(content)
        }
        break

      case "gemini":
        requestBody = {
          contents: [
            {
              parts: [
                {
                  text: request.prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: request.maxTokens,
            temperature: request.temperature,
          },
        }
        responseParser = (data) => {
          const content = data.candidates[0]?.content?.parts[0]?.text
          return this.parseAIResponse(content)
        }
        break
    }

    // Make API call (simulated for browser environment)
    try {
      // In a real implementation, this would be a server-side API call
      // For demo purposes, we'll simulate the response
      console.log(`[ShadowAIController] Simulating ${provider} API call`)

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

      // Simulate AI response based on request context
      return this.simulateAIResponse(request.context)
    } catch (error) {
      throw new Error(`${provider} API call failed: ${error.message}`)
    }
  }

  simulateAIResponse(context) {
    // Simulate intelligent AI decision making
    const enemies = context.enemies

    if (enemies.length === 0) return null

    // Simple AI logic: target weakest enemy
    const weakestEnemy = enemies.reduce((weakest, current) => {
      const weakestHpPercent = weakest.currentHp / weakest.maxHp
      const currentHpPercent = current.currentHp / current.maxHp
      return currentHpPercent < weakestHpPercent ? current : weakest
    })

    return {
      targetId: weakestEnemy.id,
      type: "attack",
      reasoning: `Targeting ${weakestEnemy.name} as they have the lowest HP percentage`,
    }
  }

  parseAIResponse(content) {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("No JSON found in response")

      const parsed = JSON.parse(jsonMatch[0])

      // Validate response structure
      if (!parsed.targetId || !parsed.type) {
        throw new Error("Invalid response structure")
      }

      return parsed
    } catch (error) {
      console.warn(`[ShadowAIController] Failed to parse AI response:`, error)
      return null
    }
  }

  getLocalAIAction(shadow, battleState) {
    console.log(`[ShadowAIController] Using local AI for ${shadow.name}`)

    const enemies = shadow.team === "player" ? battleState.enemyShadows : battleState.playerShadows
    const aliveEnemies = enemies.filter((s) => s.isAlive)

    if (aliveEnemies.length === 0) return null

    // Local AI strategy based on shadow class
    let target = null

    switch (shadow.class) {
      case "Assassin":
        // Target weakest enemy
        target = aliveEnemies.reduce((weakest, current) => (current.currentHp < weakest.currentHp ? current : weakest))
        break

      case "Warrior":
      case "Berserker":
        // Target strongest enemy
        target = aliveEnemies.reduce((strongest, current) => (current.power > strongest.power ? current : strongest))
        break

      case "Invoker":
      case "Technomancer":
        // Target based on element effectiveness
        target = this.findBestElementalTarget(shadow, aliveEnemies)
        break

      case "Guardian":
        // Target most dangerous enemy (highest power)
        target = aliveEnemies.reduce((dangerous, current) => (current.power > dangerous.power ? current : dangerous))
        break

      default:
        // Random target
        target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
    }

    return {
      targetId: target.id,
      type: "attack",
      reasoning: `Local AI decision based on ${shadow.class} class strategy`,
    }
  }

  findBestElementalTarget(shadow, enemies) {
    // Find target with best elemental matchup
    let bestTarget = enemies[0]
    let bestEffectiveness = this.battleScene.getElementEffectiveness(shadow.element, bestTarget.element)

    for (const enemy of enemies) {
      const effectiveness = this.battleScene.getElementEffectiveness(shadow.element, enemy.element)
      if (effectiveness > bestEffectiveness) {
        bestEffectiveness = effectiveness
        bestTarget = enemy
      }
    }

    return bestTarget
  }

  getDefaultAction(shadow, battleState) {
    console.log(`[ShadowAIController] Using default action for ${shadow.name}`)

    const enemies = shadow.team === "player" ? battleState.enemyShadows : battleState.playerShadows
    const aliveEnemies = enemies.filter((s) => s.isAlive)

    if (aliveEnemies.length === 0) return null

    // Default: attack random enemy
    const randomTarget = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]

    return {
      targetId: randomTarget.id,
      type: "attack",
      reasoning: "Default fallback action",
    }
  }

  getTemperatureForShadow(shadow) {
    // Adjust AI creativity based on shadow class
    const temperatureMap = {
      Invoker: 0.3, // Calculated and precise
      Warrior: 0.5, // Balanced
      Assassin: 0.4, // Focused
      Guardian: 0.2, // Conservative
      Berserker: 0.8, // Chaotic
      Technomancer: 0.1, // Logical
    }

    return temperatureMap[shadow.class] || 0.5
  }

  createCacheKey(shadow, battleState) {
    // Create a cache key based on current battle state
    const stateHash = {
      shadowHp: shadow.currentHp,
      enemyStates: battleState.enemyShadows
        .filter((s) => s.isAlive)
        .map((s) => ({ id: s.id, hp: s.currentHp }))
        .sort((a, b) => a.id.localeCompare(b.id)),
      turn: battleState.turn,
    }

    return `${shadow.id}_${JSON.stringify(stateHash).slice(0, 50)}`
  }

  clearCache() {
    this.requestCache.clear()
  }

  validateAction(action, battleState) {
    if (!action || !action.targetId || !action.type) {
      return false
    }

    // Check if target exists and is alive
    const allShadows = [...battleState.playerShadows, ...battleState.enemyShadows]
    const target = allShadows.find((s) => s.id === action.targetId)

    return target && target.isAlive
  }

  getAIStats() {
    if (!this.isInitialized) {
      return { error: "AI not initialized" }
    }

    return this.aiProviderManager.getProviderStats()
  }
}

module.exports = ShadowAIController
