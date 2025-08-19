class AIProviderManager {
  constructor() {
    this.providers = {
      openai: {
        name: "OpenAI GPT-4",
        apiKey:
          "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",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4",
        isActive: true,
        priority: 1,
        lastUsed: null,
        errorCount: 0,
        maxErrors: 3,
      },
      gemini: {
        name: "Google Gemini",
        apiKey: "AIzaSyBRxsnUY-PTT95EiY6yVTCaDz7DeJLgc9E",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        model: "gemini-pro",
        isActive: true,
        priority: 2,
        lastUsed: null,
        errorCount: 0,
        maxErrors: 3,
      },
      deepseek: {
        name: "DeepSeek AI",
        apiKey: "sk-4001fb4f0ab44836817907e524a520ae",
        endpoint: "https://api.deepseek.com/v1/chat/completions",
        model: "deepseek-chat",
        isActive: true,
        priority: 3,
        lastUsed: null,
        errorCount: 0,
        maxErrors: 3,
      },
      grok: {
        name: "xAI Grok",
        apiKey:
          "xai-lm9TeAFhMVeOSjlzrUeTkth25T3dmy692MbBIGOKoibjGbajmeMwvxBJnRO3KyxIVelRnjCj7nRkm6M2FlowiseV2Zu_LGe9GoO4JIbqejaAevJ62pew-7AD7uqvITCw40",
        endpoint: "https://api.x.ai/v1/chat/completions",
        model: "grok-beta",
        isActive: true,
        priority: 4,
        lastUsed: null,
        errorCount: 0,
        maxErrors: 3,
      },
    }

    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    this.requestQueue = []
    this.isProcessing = false
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      providerUsage: {},
    }

    this.initializeStats()
  }

  initializeStats() {
    Object.keys(this.providers).forEach((provider) => {
      this.stats.providerUsage[provider] = {
        requests: 0,
        successes: 0,
        failures: 0,
        averageTime: 0,
      }
    })
  }

  async generateStoryContent(prompt, context = {}) {
    const cacheKey = this.generateCacheKey(prompt, context)

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log("📦 Returning cached story content")
        return cached.data
      }
    }

    const providers = this.getAvailableProviders()

    for (const provider of providers) {
      try {
        console.log(`🤖 Trying ${provider.name} for story generation...`)
        const startTime = Date.now()

        const result = await this.callProvider(provider, prompt, context)

        const responseTime = Date.now() - startTime
        this.updateStats(provider.name, true, responseTime)

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        })

        console.log(`✅ Story generated successfully with ${provider.name} in ${responseTime}ms`)
        return result
      } catch (error) {
        console.error(`❌ ${provider.name} failed:`, error.message)
        this.handleProviderError(provider.name)
        this.updateStats(provider.name, false, 0)
        continue
      }
    }

    // If all providers fail, return fallback content
    console.warn("⚠️ All AI providers failed, using fallback content")
    return this.getFallbackStoryContent(context)
  }

  async callProvider(provider, prompt, context) {
    const requestData = this.formatRequest(provider, prompt, context)

    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers: this.getHeaders(provider),
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return this.parseResponse(provider, data)
  }

  formatRequest(provider, prompt, context) {
    const storyPrompt = this.buildStoryPrompt(prompt, context)

    switch (provider.name) {
      case "OpenAI GPT-4":
      case "DeepSeek AI":
      case "xAI Grok":
        return {
          model: provider.model,
          messages: [
            {
              role: "system",
              content:
                "You are a master storyteller creating an immersive fantasy RPG story. Generate engaging narrative content with choices, characters, and atmospheric descriptions. Always respond in valid JSON format.",
            },
            {
              role: "user",
              content: storyPrompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.8,
        }

      case "Google Gemini":
        return {
          contents: [
            {
              parts: [
                {
                  text: `System: You are a master storyteller creating an immersive fantasy RPG story. Generate engaging narrative content with choices, characters, and atmospheric descriptions. Always respond in valid JSON format.\n\nUser: ${storyPrompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.8,
          },
        }

      default:
        throw new Error(`Unknown provider: ${provider.name}`)
    }
  }

  buildStoryPrompt(prompt, context) {
    const { location, chapter, playerChoices, currentScene } = context

    return `
Generate story content for a fantasy RPG game with the following context:

Location: ${location || "Unknown"}
Chapter: ${chapter || 1}
Current Scene: ${currentScene || "Beginning"}
Previous Choices: ${playerChoices ? playerChoices.join(", ") : "None"}

Request: ${prompt}

Please generate a JSON response with the following structure:
{
  "location": "Current location name",
  "description": "Atmospheric description of the location",
  "narrative": "Main story narrative (2-3 paragraphs)",
  "characters": [
    {"name": "Character Name", "role": "Character Role"}
  ],
  "choices": [
    {
      "text": "Choice description",
      "type": "combat|diplomatic|exploration|investigation",
      "consequence": "Brief description of potential outcome"
    }
  ],
  "atmosphere": "Overall mood and atmosphere",
  "discoveries": ["Any items, secrets, or lore discovered"]
}

Make the story engaging, immersive, and appropriate for a fantasy shadow-themed RPG.
    `.trim()
  }

  getHeaders(provider) {
    switch (provider.name) {
      case "OpenAI GPT-4":
        return {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        }

      case "Google Gemini":
        return {
          "Content-Type": "application/json",
        }

      case "DeepSeek AI":
        return {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        }

      case "xAI Grok":
        return {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        }

      default:
        return {
          "Content-Type": "application/json",
        }
    }
  }

  parseResponse(provider, data) {
    let content = ""

    switch (provider.name) {
      case "OpenAI GPT-4":
      case "DeepSeek AI":
      case "xAI Grok":
        content = data.choices?.[0]?.message?.content || ""
        break

      case "Google Gemini":
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
        break

      default:
        throw new Error(`Unknown provider response format: ${provider.name}`)
    }

    // Try to parse as JSON
    try {
      return JSON.parse(content)
    } catch (error) {
      // If JSON parsing fails, create a structured response
      return {
        location: "Mysterious Location",
        description: "A place shrouded in mystery and shadow...",
        narrative: content || "The story continues in unexpected ways...",
        characters: [{ name: "Shadow Guide", role: "Mysterious Ally" }],
        choices: [
          {
            text: "Continue forward",
            type: "exploration",
            consequence: "Discover what lies ahead",
          },
          {
            text: "Investigate surroundings",
            type: "investigation",
            consequence: "Uncover hidden secrets",
          },
        ],
        atmosphere: "Mysterious and foreboding",
        discoveries: ["Ancient knowledge", "Hidden path"],
      }
    }
  }

  getAvailableProviders() {
    return Object.values(this.providers)
      .filter((provider) => provider.isActive && provider.errorCount < provider.maxErrors)
      .sort((a, b) => a.priority - b.priority)
  }

  handleProviderError(providerName) {
    if (this.providers[providerName]) {
      this.providers[providerName].errorCount++

      if (this.providers[providerName].errorCount >= this.providers[providerName].maxErrors) {
        console.warn(`⚠️ Provider ${providerName} disabled due to too many errors`)
        this.providers[providerName].isActive = false
      }
    }
  }

  updateStats(providerName, success, responseTime) {
    this.stats.totalRequests++

    if (success) {
      this.stats.successfulRequests++
    } else {
      this.stats.failedRequests++
    }

    if (this.stats.providerUsage[providerName]) {
      const usage = this.stats.providerUsage[providerName]
      usage.requests++

      if (success) {
        usage.successes++
        usage.averageTime = (usage.averageTime * (usage.successes - 1) + responseTime) / usage.successes
      } else {
        usage.failures++
      }
    }

    // Update overall average response time
    if (success) {
      this.stats.averageResponseTime =
        (this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + responseTime) /
        this.stats.successfulRequests
    }
  }

  getFallbackStoryContent(context) {
    const fallbackStories = [
      {
        location: "Shadow Forest",
        description:
          "Ancient trees whisper secrets in the darkness, their branches reaching like gnarled fingers toward a moonless sky.",
        narrative:
          "You find yourself in a forest where shadows seem to have a life of their own. The air is thick with mystery, and every step forward reveals new wonders and dangers. Ancient magic pulses through the very ground beneath your feet, and you sense that this place holds secrets that could change everything.",
        characters: [
          { name: "Forest Guardian", role: "Ancient Protector" },
          { name: "Shadow Wisp", role: "Mysterious Guide" },
        ],
        choices: [
          {
            text: "Follow the shadow wisp deeper into the forest",
            type: "exploration",
            consequence: "Discover ancient ruins and powerful artifacts",
          },
          {
            text: "Approach the Forest Guardian for guidance",
            type: "diplomatic",
            consequence: "Learn about the forest's history and gain an ally",
          },
          {
            text: "Set up camp and wait for dawn",
            type: "rest",
            consequence: "Restore energy but risk missing important opportunities",
          },
        ],
        atmosphere: "Mystical and slightly ominous",
        discoveries: ["Ancient Rune Stone", "Shadow Essence"],
      },
      {
        location: "Void Temple",
        description:
          "A place where shadows and light dance in eternal conflict, creating an otherworldly atmosphere of power and mystery.",
        narrative:
          "The temple rises before you like a monument to forgotten gods. Its walls seem to shift between solid stone and swirling shadow, and the air hums with ancient power. You can feel the weight of countless ages pressing down upon this sacred place, and you know that whatever lies within could hold the key to your destiny.",
        characters: [
          { name: "Temple Keeper", role: "Eternal Guardian" },
          { name: "Void Oracle", role: "Seer of Shadows" },
        ],
        choices: [
          {
            text: "Enter the temple through the main entrance",
            type: "exploration",
            consequence: "Face the temple's trials head-on",
          },
          {
            text: "Seek audience with the Void Oracle",
            type: "diplomatic",
            consequence: "Gain prophetic knowledge about your future",
          },
          {
            text: "Challenge the Temple Keeper to prove your worth",
            type: "combat",
            consequence: "Earn respect and access to forbidden knowledge",
          },
        ],
        atmosphere: "Sacred and powerful",
        discoveries: ["Void Crystal", "Ancient Prophecy"],
      },
    ]

    // Return a random fallback story or one based on context
    const contextLocation = context.location?.toLowerCase() || ""

    if (contextLocation.includes("temple") || contextLocation.includes("void")) {
      return fallbackStories[1]
    }

    return fallbackStories[0]
  }

  generateCacheKey(prompt, context) {
    const contextString = JSON.stringify(context)
    return `${prompt}_${contextString}`.replace(/\s+/g, "_").toLowerCase()
  }

  getStats() {
    return {
      ...this.stats,
      activeProviders: Object.values(this.providers).filter((p) => p.isActive).length,
      totalProviders: Object.keys(this.providers).length,
      cacheSize: this.cache.size,
    }
  }

  resetProvider(providerName) {
    if (this.providers[providerName]) {
      this.providers[providerName].errorCount = 0
      this.providers[providerName].isActive = true
      console.log(`🔄 Provider ${providerName} has been reset`)
    }
  }

  resetAllProviders() {
    Object.keys(this.providers).forEach((providerName) => {
      this.resetProvider(providerName)
    })
    console.log("🔄 All providers have been reset")
  }

  clearCache() {
    this.cache.clear()
    console.log("🗑️ Cache cleared")
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AIProviderManager
} else if (typeof window !== "undefined") {
  window.AIProviderManager = AIProviderManager
}
