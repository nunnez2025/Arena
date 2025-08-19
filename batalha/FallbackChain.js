/**
 * FallbackChain - Modular AI provider fallback system
 * Tries multiple AI providers in sequence until one succeeds
 */

class FallbackChain {
  constructor(providers = {}) {
    this.providers = providers
    this.providerOrder = Object.keys(providers)
    this.failureCount = new Map()
    this.lastSuccess = new Map()

    console.log("[FallbackChain] Initialized with providers:", this.providerOrder)
  }

  async execute(request) {
    const startTime = Date.now()
    let lastError = null

    // Try each provider in order
    for (const providerName of this.providerOrder) {
      try {
        console.log(`[FallbackChain] Trying provider: ${providerName}`)

        // Skip if provider has too many recent failures
        if (this.shouldSkipProvider(providerName)) {
          console.log(`[FallbackChain] Skipping ${providerName} due to recent failures`)
          continue
        }

        const provider = this.providers[providerName]
        const result = await this.callProvider(provider, request)

        if (result) {
          // Success! Reset failure count and update last success
          this.failureCount.set(providerName, 0)
          this.lastSuccess.set(providerName, Date.now())

          console.log(`[FallbackChain] Success with ${providerName} in ${Date.now() - startTime}ms`)
          return result
        }
      } catch (error) {
        console.error(`[FallbackChain] Provider ${providerName} failed:`, error.message)
        lastError = error

        // Increment failure count
        const failures = this.failureCount.get(providerName) || 0
        this.failureCount.set(providerName, failures + 1)
      }
    }

    console.error(`[FallbackChain] All providers failed. Last error:`, lastError?.message)
    return null
  }

  async callProvider(provider, request) {
    const timeout = provider.timeout || 10000 // 10 second default timeout

    return Promise.race([
      this.makeProviderCall(provider, request),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Provider timeout")), timeout)),
    ])
  }

  async makeProviderCall(provider, request) {
    switch (provider.type) {
      case "openai":
        return await this.callOpenAI(provider, request)

      case "claude":
        return await this.callClaude(provider, request)

      case "gemini":
        return await this.callGemini(provider, request)

      case "local":
        return await this.callLocalAI(provider, request)

      default:
        throw new Error(`Unknown provider type: ${provider.type}`)
    }
  }

  async callOpenAI(provider, request) {
    const fetch = require("node-fetch")

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model || "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an AI controlling an enemy in a turn-based RPG battle. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: request.prompt,
          },
        ],
        max_tokens: request.maxTokens || 150,
        temperature: request.temperature || 0.5,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error("No content in OpenAI response")
    }

    try {
      const action = JSON.parse(content)
      return this.validateAction(action)
    } catch (error) {
      throw new Error(`Invalid JSON from OpenAI: ${error.message}`)
    }
  }

  async callClaude(provider, request) {
    const fetch = require("node-fetch")

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": provider.apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: provider.model || "claude-3-sonnet-20240229",
        max_tokens: request.maxTokens || 150,
        temperature: request.temperature || 0.5,
        messages: [
          {
            role: "user",
            content: `${request.prompt}\n\nIMPORTANT: Respond only with valid JSON, no other text.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text

    if (!content) {
      throw new Error("No content in Claude response")
    }

    try {
      // Extract JSON from response (Claude sometimes adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in Claude response")
      }

      const action = JSON.parse(jsonMatch[0])
      return this.validateAction(action)
    } catch (error) {
      throw new Error(`Invalid JSON from Claude: ${error.message}`)
    }
  }

  async callGemini(provider, request) {
    const fetch = require("node-fetch")

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${provider.model || "gemini-pro"}:generateContent?key=${provider.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${request.prompt}\n\nIMPORTANT: Respond only with valid JSON in the specified format.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: request.temperature || 0.5,
            maxOutputTokens: request.maxTokens || 150,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.candidates[0]?.content?.parts[0]?.text

    if (!content) {
      throw new Error("No content in Gemini response")
    }

    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in Gemini response")
      }

      const action = JSON.parse(jsonMatch[0])
      return this.validateAction(action)
    } catch (error) {
      throw new Error(`Invalid JSON from Gemini: ${error.message}`)
    }
  }

  async callLocalAI(provider, request) {
    // Simple rule-based local AI as ultimate fallback
    console.log("[FallbackChain] Using local AI fallback")

    const context = request.context
    const enemy = context.enemy
    const battleState = context.battleState

    // Find valid targets
    const enemies = battleState.participants.filter((p) => p.team === "player" && p.isAlive)

    if (enemies.length === 0) {
      return {
        type: "defend",
        targetId: enemy.id,
        reasoning: "No valid targets available",
      }
    }

    // Select target (lowest HP)
    const target = enemies.reduce((lowest, current) => (current.stats.hp < lowest.stats.hp ? current : lowest))

    // Simple decision logic
    if (enemy.stats.hp < enemy.stats.maxHp * 0.25) {
      // Low HP - defend or heal
      return {
        type: "defend",
        targetId: enemy.id,
        reasoning: "Low HP, taking defensive action",
      }
    } else if (enemy.stats.mp >= 15 && Math.random() < 0.4) {
      // Use skill if available
      const availableSkills = enemy.skills.filter((skillId) => {
        const skill = context.availableActions.find((a) => a.skillId === skillId)
        return skill && enemy.stats.mp >= skill.mpCost
      })

      if (availableSkills.length > 0) {
        const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)]
        return {
          type: "skill",
          skillId: randomSkill,
          targetId: target.id,
          reasoning: "Using available skill",
        }
      }
    }

    // Default to attack
    return {
      type: "attack",
      targetId: target.id,
      reasoning: "Basic attack on weakest enemy",
    }
  }

  validateAction(action) {
    // Validate action structure
    if (!action || typeof action !== "object") {
      throw new Error("Action must be an object")
    }

    if (!action.type || !["attack", "skill", "item", "defend"].includes(action.type)) {
      throw new Error("Invalid action type")
    }

    if (!action.targetId) {
      throw new Error("Action must have a targetId")
    }

    if (action.type === "skill" && !action.skillId) {
      throw new Error("Skill action must have a skillId")
    }

    if (action.type === "item" && !action.itemId) {
      throw new Error("Item action must have an itemId")
    }

    return action
  }

  shouldSkipProvider(providerName) {
    const failures = this.failureCount.get(providerName) || 0
    const lastSuccess = this.lastSuccess.get(providerName) || 0
    const now = Date.now()

    // Skip if more than 3 failures in the last 5 minutes
    if (failures >= 3 && now - lastSuccess < 300000) {
      return true
    }

    return false
  }

  hasProvider(providerName) {
    return this.providers.hasOwnProperty(providerName)
  }

  getProviderStatus() {
    const status = {}

    for (const providerName of this.providerOrder) {
      status[providerName] = {
        failures: this.failureCount.get(providerName) || 0,
        lastSuccess: this.lastSuccess.get(providerName) || 0,
        available: !this.shouldSkipProvider(providerName),
      }
    }

    return status
  }

  // Reset failure counts (useful for testing or manual recovery)
  resetFailures() {
    this.failureCount.clear()
    console.log("[FallbackChain] Failure counts reset")
  }
}

module.exports = FallbackChain
