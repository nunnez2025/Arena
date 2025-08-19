"use client"

// AI Service with multiple API integrations and fallback system
export class AIService {
  private static readonly API_KEYS = {
    openai:
      "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",
    gemini: "AIzaSyBRxsnUY-PTT95EiY6yVTCaDz7DeJLgc9E",
    deepseek: "sk-4001fb4f0ab44836817907e524a520ae",
    grok: "xai-lm9TeAFhMVeOSjlzrUeTkth25T3dmy692MbBIGOKoibjGbajmeMwvxBJnRO3KyxIVelRnjCj7nRkm6M2FlowiseV2Zu_LGe9GoO4JIbqejaAevJ62pew-7AD7uqvITCw40",
  }

  // Generate character with AI
  static async generateCharacter(prompt: string, aiProvider = "openai") {
    const providers = [aiProvider, "openai", "gemini", "deepseek", "grok"]

    for (const provider of providers) {
      try {
        switch (provider) {
          case "openai":
            return await this.generateWithOpenAI(prompt)
          case "gemini":
            return await this.generateWithGemini(prompt)
          case "deepseek":
            return await this.generateWithDeepSeek(prompt)
          case "grok":
            return await this.generateWithGrok(prompt)
        }
      } catch (error) {
        console.warn(`${provider} failed, trying next provider...`)
        continue
      }
    }

    // Fallback to local generation
    return this.generateCharacterFallback(prompt)
  }

  private static async generateWithOpenAI(prompt: string) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.API_KEYS.openai}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a master game designer creating unique NFT characters for a shadow-themed battle arena game. 
            Generate a detailed character based on the user's prompt. Return a JSON object with:
            - name: character name
            - description: detailed description
            - stats: {hp, attack, defense, speed} (values 50-150)
            - abilities: array of 3 unique abilities
            - rarity: "Common", "Rare", "Epic", or "Legendary"
            - element: shadow, cosmic, void, or fire
            - backstory: brief character history`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    })

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  }

  private static async generateWithGemini(prompt: string) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.API_KEYS.gemini}`,
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
                  text: `Create a unique NFT character for a shadow battle game based on: ${prompt}. 
                  Return JSON with name, description, stats (hp, attack, defense, speed), abilities array, rarity, element, backstory.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1000,
          },
        }),
      },
    )

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text
    return JSON.parse(content.replace(/```json\n?|\n?```/g, ""))
  }

  private static async generateWithDeepSeek(prompt: string) {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.API_KEYS.deepseek}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "Generate unique NFT game characters in JSON format with detailed stats and abilities.",
          },
          {
            role: "user",
            content: `Create character: ${prompt}`,
          },
        ],
        temperature: 0.8,
      }),
    })

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  }

  private static async generateWithGrok(prompt: string) {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.API_KEYS.grok}`,
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          {
            role: "system",
            content: "You're an expert game character designer. Create detailed NFT characters with unique abilities.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.9,
      }),
    })

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  }

  private static generateCharacterFallback(prompt: string) {
    // Local fallback generation
    const rarities = ["Common", "Rare", "Epic", "Legendary"]
    const elements = ["shadow", "cosmic", "void", "fire"]
    const abilities = [
      "Shadow Strike",
      "Void Blast",
      "Cosmic Shield",
      "Dark Heal",
      "Lightning Bolt",
      "Fire Storm",
      "Ice Shard",
      "Earth Quake",
    ]

    return {
      name: `Generated ${elements[Math.floor(Math.random() * elements.length)]} Warrior`,
      description: `A powerful warrior born from ${prompt}`,
      stats: {
        hp: Math.floor(Math.random() * 100) + 50,
        attack: Math.floor(Math.random() * 100) + 50,
        defense: Math.floor(Math.random() * 100) + 50,
        speed: Math.floor(Math.random() * 100) + 50,
      },
      abilities: abilities.sort(() => 0.5 - Math.random()).slice(0, 3),
      rarity: rarities[Math.floor(Math.random() * rarities.length)],
      element: elements[Math.floor(Math.random() * elements.length)],
      backstory: `A mysterious warrior with powers related to ${prompt}`,
    }
  }

  // Generate story chapter
  static async generateStoryChapter(chapter: number, playerChoices: string[]) {
    const prompt = `Generate chapter ${chapter} of an epic shadow game story. 
    Previous choices: ${playerChoices.join(", ")}. 
    Include location, narrative, characters, and 3 meaningful choices.`

    try {
      const story = await this.generateWithOpenAI(prompt)
      return {
        location: story.location || "Shadow Realm",
        description: story.description || "A mysterious realm shrouded in darkness",
        narrative: story.narrative || "Your journey continues through the shadows...",
        characters: story.characters || [],
        choices: story.choices || [
          { text: "Explore deeper", type: "exploration", consequence: "Discover hidden secrets" },
          { text: "Fight the shadows", type: "combat", consequence: "Gain battle experience" },
          { text: "Seek allies", type: "diplomatic", consequence: "Build relationships" },
        ],
      }
    } catch (error) {
      return this.generateStoryFallback(chapter)
    }
  }

  private static generateStoryFallback(chapter: number) {
    const locations = ["Shadow Citadel", "Void Temple", "Cosmic Observatory", "Dark Forest"]
    const narratives = [
      "The shadows whisper ancient secrets as you venture deeper into the unknown...",
      "A mysterious energy pulses through the air, calling you forward...",
      "The path ahead splits into multiple directions, each holding different destinies...",
    ]

    return {
      location: locations[Math.floor(Math.random() * locations.length)],
      description: "A place where shadows and light dance in eternal conflict",
      narrative: narratives[Math.floor(Math.random() * narratives.length)],
      characters: [
        { name: "Shadow Guide", role: "Mysterious ally" },
        { name: "Void Guardian", role: "Ancient protector" },
      ],
      choices: [
        { text: "Explore the shadows", type: "exploration", consequence: "Uncover hidden truths" },
        { text: "Challenge the guardian", type: "combat", consequence: "Test your strength" },
        { text: "Seek wisdom", type: "diplomatic", consequence: "Gain knowledge" },
      ],
    }
  }

  // Generate battle action prediction
  static async predictBattleAction(enemyNFT: any, playerNFT: any, battleState: any) {
    const prompt = `Predict the next action for ${enemyNFT.name} (${enemyNFT.neuralNetwork}) 
    fighting against ${playerNFT.name}. Current HP: ${enemyNFT.hp}/${enemyNFT.maxHp}. 
    Battle turn: ${battleState.turn}. Return optimal action and reasoning.`

    try {
      const prediction = await this.generateWithOpenAI(prompt)
      return {
        nextAction: prediction.action || "Attack",
        reasoning: prediction.reasoning || "Aggressive strategy",
        confidence: prediction.confidence || 0.8,
      }
    } catch (error) {
      return {
        nextAction: "Shadow Strike",
        reasoning: "Default aggressive approach",
        confidence: 0.6,
      }
    }
  }

  // Calculate battle action result
  static async calculateBattleAction(action: string, attacker: any, defender: any) {
    const baseDamage = attacker.attack
    const defense = defender.defense
    const critical = Math.random() < 0.2

    let damage = Math.max(1, baseDamage - defense + Math.floor(Math.random() * 20) - 10)
    if (critical) damage *= 2

    const messages = {
      shadow_strike: `${attacker.name} unleashes a devastating shadow strike!`,
      void_slash: `${attacker.name} cuts through reality with void energy!`,
      dark_barrier: `${attacker.name} creates a protective dark barrier!`,
      neural_boost: `${attacker.name}'s neural network overclocks for enhanced performance!`,
    }

    return {
      damage: action.includes("heal") ? 0 : damage,
      heal: action.includes("heal") ? damage : 0,
      critical,
      message: messages[action as keyof typeof messages] || `${attacker.name} uses ${action}!`,
      effects: critical ? ["critical_hit"] : [],
    }
  }

  // Update NFT learning
  static async updateNFTLearning(nftId: string, action: string, result: any) {
    // Simulate neural network learning
    const learningData = {
      nftId,
      action,
      result: result.damage || result.heal,
      critical: result.critical,
      timestamp: Date.now(),
    }

    // In a real implementation, this would update the NFT's neural network
    console.log("NFT Learning Update:", learningData)

    return {
      experienceGained: 10,
      newAdaptations: result.critical ? ["Critical Hit Mastery"] : [],
      intelligenceIncrease: 1,
    }
  }

  // Choose optimal AI action
  static async chooseOptimalAction(nft: any, opponent: any, battleState: any) {
    const actions = nft.abilities || ["Attack", "Defend", "Special"]
    const weights = {
      Attack: opponent.hp > opponent.maxHp * 0.5 ? 0.7 : 0.9,
      Defend: nft.hp < nft.maxHp * 0.3 ? 0.8 : 0.3,
      Special: nft.mp > nft.maxMp * 0.5 ? 0.6 : 0.2,
    }

    // AI chooses action based on current battle state
    const bestAction = actions.reduce((best, action) => {
      const weight = weights[action as keyof typeof weights] || 0.5
      return weight > (weights[best as keyof typeof weights] || 0) ? action : best
    })

    return {
      action: bestAction.toLowerCase().replace(" ", "_"),
      reasoning: `Optimal choice based on current battle state`,
      confidence: 0.85,
    }
  }

  // Generate image (placeholder for image generation APIs)
  static async generateImage(description: string) {
    // In a real implementation, this would use DALL-E, Midjourney, or Stable Diffusion
    return `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(description)}`
  }

  // Mint character as NFT
  static async mintCharacterAsNFT(character: any) {
    // Simulate NFT minting process
    const nft = {
      id: `nft_${Date.now()}`,
      tokenId: Math.floor(Math.random() * 10000),
      character,
      neuralNetwork: {
        layers: [128, 64, 32, 16],
        activations: "relu",
        optimizer: "adam",
        learningRate: 0.001,
      },
      metadata: {
        name: character.name,
        description: character.description,
        attributes: Object.entries(character.stats).map(([key, value]) => ({
          trait_type: key,
          value,
        })),
        rarity: character.rarity,
      },
      blockchain: {
        network: "Ethereum",
        contract: "0x...",
        minted: true,
        mintedAt: new Date().toISOString(),
      },
    }

    console.log("NFT Minted:", nft)
    return nft
  }

  // Generate story segment based on choice
  static async generateStorySegment(choice: string, currentStory: any) {
    const prompt = `Continue the story based on player choice: "${choice}". 
    Current location: ${currentStory.location}. 
    Generate consequences and next narrative segment.`

    try {
      const segment = await this.generateWithOpenAI(prompt)
      return {
        consequence: segment.consequence || "Your choice leads to unexpected results...",
        newNarrative: segment.narrative || "The story continues...",
        rewards: segment.rewards || [],
        newCharacters: segment.characters || [],
      }
    } catch (error) {
      return {
        consequence: "Your choice echoes through the shadows...",
        newNarrative: "The path ahead becomes clearer as you move forward.",
        rewards: ["Experience +50"],
        newCharacters: [],
      }
    }
  }
}
