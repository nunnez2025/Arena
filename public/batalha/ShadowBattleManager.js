/**
 * Shadow Battle Manager - Orchestrates the complete battle system
 * Integrates AI, NFT management, and battle mechanics
 */

const ShadowBattleScene = require("./ShadowBattleScene")
const ShadowAIController = require("./ShadowAIController")
const ShadowNFTManager = require("./ShadowNFTManager")
const AIProviderManager = require("./AIProviderManager")

class ShadowBattleManager {
  constructor() {
    this.activeBattles = new Map()
    this.battleQueue = []
    this.shadowNFTManager = null
    this.aiProviderManager = null
    this.battleResults = new Map()
    this.isInitialized = false
    this.aiProvider = new AIProviderManager()
    this.currentBattle = null
    this.battleHistory = []
    this.playerStats = {
      level: 1,
      experience: 0,
      wins: 0,
      losses: 0,
      shadowTokens: 1250,
      currentLocation: "floresta-sombria",
    }

    this.locations = {
      "floresta-sombria": {
        name: "Floresta Sombria",
        enemies: ["umbrafox", "garra de sombra", "presa noturna"],
        difficulty: 1,
        rewards: ["Essência Sombria", "Cristal da Floresta"],
      },
      "pantano-maldito": {
        name: "Pântano Maldito",
        enemies: ["vorgorger", "abismo", "tenebwraith"],
        difficulty: 2,
        rewards: ["Poção Venenosa", "Amuleto do Pântano"],
      },
      "void-temple": {
        name: "Void Temple",
        enemies: ["void guardian", "shadow priest", "light wraith"],
        difficulty: 3,
        rewards: ["Void Crystal", "Sacred Relic"],
      },
    }

    console.log("[ShadowBattleManager] Initializing Shadow Battle Manager")
    this.initializeEventListeners()
  }

  initializeEventListeners() {
    // Listen for battle events
    document.addEventListener("battleStart", (event) => {
      this.handleBattleStart(event.detail)
    })

    document.addEventListener("battleEnd", (event) => {
      this.handleBattleEnd(event.detail)
    })

    document.addEventListener("locationChange", (event) => {
      this.handleLocationChange(event.detail)
    })
  }

  async initialize() {
    try {
      // Load configuration
      const config = await this.loadBattleConfig()

      // Initialize NFT Manager
      this.shadowNFTManager = new ShadowNFTManager(config)

      // Initialize AI Provider Manager
      await this.aiProvider.initialize()

      // Setup event listeners
      this.setupEventListeners()

      this.isInitialized = true
      console.log("[ShadowBattleManager] Battle system initialized successfully")

      return true
    } catch (error) {
      console.error("[ShadowBattleManager] Failed to initialize:", error)
      return false
    }
  }

  async loadBattleConfig() {
    // Return the shadow NFT configuration
    return {
      shadowClasses: {
        Invoker: {
          description: "Mystical spellcasters with high magical power",
          baseStats: {
            powerMultiplier: 1.2,
            defenseMultiplier: 0.8,
            speedMultiplier: 1.0,
          },
          preferredElements: ["Dark", "Light", "Chaos"],
          aiPersonality: "strategic",
        },
        Warrior: {
          description: "Fierce combatants with balanced stats",
          baseStats: {
            powerMultiplier: 1.1,
            defenseMultiplier: 1.1,
            speedMultiplier: 0.9,
          },
          preferredElements: ["Fire", "Tech"],
          aiPersonality: "aggressive",
        },
        Assassin: {
          description: "Fast and deadly, low defense but high speed",
          baseStats: {
            powerMultiplier: 1.0,
            defenseMultiplier: 0.7,
            speedMultiplier: 1.4,
          },
          preferredElements: ["Dark", "Chaos"],
          aiPersonality: "cunning",
        },
        Guardian: {
          description: "Defensive specialists with high HP and defense",
          baseStats: {
            powerMultiplier: 0.9,
            defenseMultiplier: 1.4,
            speedMultiplier: 0.8,
          },
          preferredElements: ["Light", "Tech"],
          aiPersonality: "defensive",
        },
        Berserker: {
          description: "Wild fighters with extreme power but low defense",
          baseStats: {
            powerMultiplier: 1.5,
            defenseMultiplier: 0.6,
            speedMultiplier: 1.1,
          },
          preferredElements: ["Fire", "Chaos"],
          aiPersonality: "berserker",
        },
        Technomancer: {
          description: "Tech-savvy combatants with analytical abilities",
          baseStats: {
            powerMultiplier: 1.1,
            defenseMultiplier: 1.0,
            speedMultiplier: 1.2,
          },
          preferredElements: ["Tech", "Light"],
          aiPersonality: "tactical",
        },
      },
      elements: {
        Dark: {
          color: "#6600cc",
          strengths: ["Light"],
          weaknesses: ["Tech"],
          description: "Shadow and void energy",
        },
        Light: {
          color: "#ffff00",
          strengths: ["Dark", "Chaos"],
          weaknesses: ["Tech"],
          description: "Pure radiant energy",
        },
        Fire: {
          color: "#ff3300",
          strengths: ["Tech"],
          weaknesses: ["Water"],
          description: "Burning flames and heat",
        },
        Water: {
          color: "#0066ff",
          strengths: ["Fire"],
          weaknesses: ["Tech"],
          description: "Flowing water and ice",
        },
        Tech: {
          color: "#00ffff",
          strengths: ["Dark", "Light", "Water"],
          weaknesses: ["Fire"],
          description: "Cyber technology and electricity",
        },
        Chaos: {
          color: "#ff0066",
          strengths: ["All"],
          weaknesses: ["Light"],
          description: "Unpredictable chaotic energy",
        },
      },
      affinities: {
        Chaos: {
          description: "Masters of unpredictable power",
          bonuses: {
            chaosElementBonus: 0.2,
            criticalChanceBonus: 0.1,
            randomEffectChance: 0.15,
          },
          color: "#ff0066",
        },
        Light: {
          description: "Wielders of pure energy",
          bonuses: {
            lightElementBonus: 0.15,
            healingBonus: 0.25,
            defenseBonus: 0.1,
          },
          color: "#ffff00",
        },
        Tech: {
          description: "Masters of cyber technology",
          bonuses: {
            techElementBonus: 0.15,
            speedBonus: 0.2,
            accuracyBonus: 0.15,
          },
          color: "#00ffff",
        },
        Fire: {
          description: "Controllers of burning flames",
          bonuses: {
            fireElementBonus: 0.15,
            powerBonus: 0.15,
            burnChance: 0.2,
          },
          color: "#ff3300",
        },
      },
      rarities: {
        Common: {
          statMultiplier: 1.0,
          color: "#888888",
          dropRate: 0.6,
          baseValue: 100,
        },
        Rare: {
          statMultiplier: 1.2,
          color: "#0088ff",
          dropRate: 0.25,
          baseValue: 300,
        },
        Epic: {
          statMultiplier: 1.5,
          color: "#8800ff",
          dropRate: 0.12,
          baseValue: 800,
        },
        Legendary: {
          statMultiplier: 2.0,
          color: "#ff8800",
          dropRate: 0.03,
          baseValue: 2000,
        },
      },
      battleSettings: {
        maxShadowsPerTeam: 3,
        turnTimeLimit: 30000,
        affinityMatchBonus: 0.15,
        criticalHitChance: 0.15,
        criticalHitMultiplier: 1.5,
        elementalEffectivenessMultiplier: 1.5,
        speedTiebreaker: "random",
      },
    }
  }

  setupEventListeners() {
    // Setup any global event listeners for battle management
    console.log("[ShadowBattleManager] Event listeners configured")
  }

  async createBattle(battleData) {
    if (!this.isInitialized) {
      throw new Error("Battle manager not initialized")
    }

    const battleId = this.generateBattleId()

    // Prepare battle configuration
    const battle = {
      id: battleId,
      type: battleData.type || "pve",
      playerShadows: battleData.playerShadows || [],
      enemyShadows: battleData.enemyShadows || [],
      masterAffinity: battleData.masterAffinity || "Chaos",
      playerName: battleData.playerName || "Shadow Master",
      enemyName: battleData.enemyName || "Rival Summoner",
      environment: battleData.environment || "cyber_arena",
      status: "preparing",
      createdAt: Date.now(),
      participants: battleData.participants || [],
    }

    // Validate battle data
    if (!this.validateBattleData(battle)) {
      throw new Error("Invalid battle data")
    }

    // Apply affinity bonuses
    this.applyAffinityBonuses(battle)

    // Store battle
    this.activeBattles.set(battleId, battle)

    console.log(`[ShadowBattleManager] Created battle: ${battleId}`)

    return battle
  }

  validateBattleData(battle) {
    // Check if we have valid shadows
    if (!battle.playerShadows || battle.playerShadows.length === 0) {
      console.error("[ShadowBattleManager] No player shadows provided")
      return false
    }

    if (!battle.enemyShadows || battle.enemyShadows.length === 0) {
      console.error("[ShadowBattleManager] No enemy shadows provided")
      return false
    }

    // Validate shadow data
    const allShadows = [...battle.playerShadows, ...battle.enemyShadows]
    for (const shadow of allShadows) {
      if (!this.shadowNFTManager.validateShadowForBattle(shadow)) {
        console.error(`[ShadowBattleManager] Invalid shadow data: ${shadow.name}`)
        return false
      }
    }

    return true
  }

  applyAffinityBonuses(battle) {
    // Apply master affinity bonuses to player shadows
    battle.playerShadows.forEach((shadow) => {
      this.shadowNFTManager.applyAffinityBonus(shadow, battle.masterAffinity)
    })

    console.log(`[ShadowBattleManager] Applied ${battle.masterAffinity} affinity bonuses`)
  }

  async startBattle(enemyType, locationId) {
    const location = this.locations[locationId]
    if (!location) {
      throw new Error("Invalid location for battle")
    }

    // Generate AI-powered battle scenario
    const battlePrompt = `Create a battle scenario against ${enemyType} in ${location.name}`
    const battleContext = {
      enemy: enemyType,
      location: location.name,
      playerLevel: this.playerStats.level,
      difficulty: location.difficulty,
    }

    try {
      const battleScenario = await this.aiProvider.generateStoryContent(battlePrompt, battleContext)

      this.currentBattle = {
        id: Date.now(),
        enemy: enemyType,
        location: locationId,
        scenario: battleScenario,
        startTime: Date.now(),
        playerHP: 100,
        enemyHP: 100,
        turn: 1,
        actions: [],
      }

      // Dispatch battle start event
      document.dispatchEvent(
        new CustomEvent("battleStart", {
          detail: this.currentBattle,
        }),
      )

      return this.currentBattle
    } catch (error) {
      console.error("Failed to start battle:", error)
      throw error
    }
  }

  async processBattleAction(action) {
    if (!this.currentBattle) {
      throw new Error("No active battle")
    }

    // Generate AI response for battle action
    const actionPrompt = `Process battle action: ${action.type} - ${action.description}`
    const actionContext = {
      battleState: this.currentBattle,
      action: action,
      turn: this.currentBattle.turn,
    }

    try {
      const actionResult = await this.aiProvider.generateStoryContent(actionPrompt, actionContext)

      // Update battle state
      this.currentBattle.actions.push({
        turn: this.currentBattle.turn,
        action: action,
        result: actionResult,
        timestamp: Date.now(),
      })

      this.currentBattle.turn++

      // Check for battle end conditions
      if (actionResult.battleEnded) {
        this.endBattle(actionResult.winner)
      }

      return actionResult
    } catch (error) {
      console.error("Failed to process battle action:", error)
      throw error
    }
  }

  endBattle(winner) {
    if (!this.currentBattle) return

    const battleResult = {
      ...this.currentBattle,
      winner: winner,
      endTime: Date.now(),
      duration: Date.now() - this.currentBattle.startTime,
    }

    // Update player stats
    if (winner === "player") {
      this.playerStats.wins++
      this.playerStats.experience += 100
      this.playerStats.shadowTokens += 50

      // Level up check
      if (this.playerStats.experience >= this.playerStats.level * 1000) {
        this.playerStats.level++
        this.playerStats.experience = 0
      }
    } else {
      this.playerStats.losses++
    }

    // Add to battle history
    this.battleHistory.push(battleResult)

    // Dispatch battle end event
    document.dispatchEvent(
      new CustomEvent("battleEnd", {
        detail: battleResult,
      }),
    )

    this.currentBattle = null
    return battleResult
  }

  handleBattleStart(battleData) {
    console.log("🎮 Battle started:", battleData)

    // Update UI or trigger visual effects
    this.showBattleUI(battleData)
  }

  handleBattleEnd(battleResult) {
    console.log("🏆 Battle ended:", battleResult)

    // Show battle results
    this.showBattleResults(battleResult)

    // Save progress
    this.saveProgress()
  }

  handleLocationChange(locationData) {
    console.log("📍 Location changed:", locationData)

    this.playerStats.currentLocation = locationData.locationId

    // Generate new story content for the location
    this.generateStoryForLocation(locationData.locationId, locationData.context)
  }

  showBattleUI(battleData) {
    // Create battle UI elements
    const battleUI = document.createElement("div")
    battleUI.id = "battle-ui"
    battleUI.className = "fixed inset-0 bg-black/80 flex items-center justify-center z-50"

    battleUI.innerHTML = `
      <div class="bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-purple-500/30 rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 class="text-2xl font-bold text-white mb-4 text-center">
          ⚔️ Batalha: ${battleData.enemy}
        </h2>
        <div class="space-y-4">
          <div class="bg-black/30 p-4 rounded-lg">
            <p class="text-gray-300">${battleData.scenario?.narrative || "A batalha épica está prestes a começar!"}</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <h3 class="text-green-400 font-bold">Jogador</h3>
              <div class="bg-green-600 h-4 rounded-full">
                <div class="bg-green-400 h-full rounded-full" style="width: ${battleData.playerHP}%"></div>
              </div>
              <span class="text-sm text-gray-300">${battleData.playerHP}/100 HP</span>
            </div>
            <div class="text-center">
              <h3 class="text-red-400 font-bold">${battleData.enemy}</h3>
              <div class="bg-red-600 h-4 rounded-full">
                <div class="bg-red-400 h-full rounded-full" style="width: ${battleData.enemyHP}%"></div>
              </div>
              <span class="text-sm text-gray-300">${battleData.enemyHP}/100 HP</span>
            </div>
          </div>
          <div class="flex justify-center space-x-4">
            <button onclick="shadowBattleManager.processBattleAction({type: 'attack', description: 'Ataque básico'})" 
                    class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
              ⚔️ Atacar
            </button>
            <button onclick="shadowBattleManager.processBattleAction({type: 'defend', description: 'Posição defensiva'})" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              🛡️ Defender
            </button>
            <button onclick="shadowBattleManager.processBattleAction({type: 'magic', description: 'Magia sombria'})" 
                    class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
              ✨ Magia
            </button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(battleUI)
  }

  showBattleResults(battleResult) {
    const battleUI = document.getElementById("battle-ui")
    if (battleUI) {
      battleUI.remove()
    }

    const resultsUI = document.createElement("div")
    resultsUI.id = "battle-results"
    resultsUI.className = "fixed inset-0 bg-black/80 flex items-center justify-center z-50"

    const isVictory = battleResult.winner === "player"

    resultsUI.innerHTML = `
      <div class="bg-gradient-to-br ${isVictory ? "from-green-900/90 to-emerald-900/90 border-green-500/30" : "from-red-900/90 to-pink-900/90 border-red-500/30"} border rounded-lg p-6 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-white mb-4 text-center">
          ${isVictory ? "🏆 Vitória!" : "💀 Derrota!"}
        </h2>
        <div class="space-y-4 text-center">
          <p class="text-gray-300">
            ${
              isVictory
                ? `Você derrotou ${battleResult.enemy} com sucesso!`
                : `${battleResult.enemy} provou ser um adversário formidável.`
            }
          </p>
          ${
            isVictory
              ? `
            <div class="bg-black/30 p-4 rounded-lg">
              <h3 class="text-yellow-400 font-bold mb-2">Recompensas:</h3>
              <div class="space-y-1">
                <p class="text-green-400">+100 XP</p>
                <p class="text-yellow-400">+50 SHADOW Tokens</p>
                <p class="text-purple-400">Itens encontrados</p>
              </div>
            </div>
          `
              : ""
          }
          <button onclick="document.getElementById('battle-results').remove()" 
                  class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg">
            Continuar
          </button>
        </div>
      </div>
    `

    document.body.appendChild(resultsUI)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.getElementById("battle-results")) {
        document.getElementById("battle-results").remove()
      }
    }, 5000)
  }

  saveProgress() {
    const gameData = {
      playerStats: this.playerStats,
      battleHistory: this.battleHistory.slice(-10), // Keep last 10 battles
      timestamp: Date.now(),
    }

    localStorage.setItem("shadowGameProgress", JSON.stringify(gameData))
    console.log("💾 Progress saved")
  }

  loadProgress() {
    try {
      const savedData = localStorage.getItem("shadowGameProgress")
      if (savedData) {
        const gameData = JSON.parse(savedData)
        this.playerStats = { ...this.playerStats, ...gameData.playerStats }
        this.battleHistory = gameData.battleHistory || []
        console.log("📂 Progress loaded")
        return true
      }
    } catch (error) {
      console.error("Failed to load progress:", error)
    }
    return false
  }

  getPlayerStats() {
    return { ...this.playerStats }
  }

  getBattleHistory() {
    return [...this.battleHistory]
  }

  getAIStats() {
    return this.aiProvider.getStats()
  }

  async generateStoryForLocation(locationId, context = {}) {
    const location = this.locations[locationId]
    if (!location) {
      console.error("Unknown location:", locationId)
      return null
    }

    const prompt = `Generate an immersive story segment for the location "${location.name}"`
    const storyContext = {
      location: location.name,
      chapter: context.chapter || 1,
      playerChoices: context.playerChoices || [],
      currentScene: context.currentScene || "arrival",
      enemies: location.enemies,
      difficulty: location.difficulty,
      playerLevel: this.playerStats.level,
    }

    try {
      const storyContent = await this.aiProvider.generateStoryContent(prompt, storyContext)

      // Enhance story with location-specific details
      storyContent.locationData = {
        enemies: location.enemies,
        difficulty: location.difficulty,
        rewards: location.rewards,
        canBattle: true,
      }

      return storyContent
    } catch (error) {
      console.error("Failed to generate story for location:", error)
      return this.getFallbackLocationStory(location)
    }
  }

  getFallbackLocationStory(location) {
    const fallbackStories = {
      "Floresta Sombria": {
        location: location.name,
        description: "Uma floresta onde as árvores sussurram segredos antigos e as sombras ganham vida.",
        narrative:
          "Você adentra a floresta sombria, onde cada passo ecoa com mistérios antigos. As árvores parecem observar seus movimentos, e você pode sentir presenças ocultas nas sombras. Este é um lugar de poder e perigo, onde apenas os corajosos prosperam.",
        characters: [
          { name: "Guardião da Floresta", role: "Protetor Ancestral" },
          { name: "Sombra Errante", role: "Entidade Misteriosa" },
        ],
        choices: [
          {
            text: "Explorar as profundezas da floresta",
            type: "exploration",
            consequence: "Descobrir segredos antigos e criaturas raras",
          },
          {
            text: "Procurar por criaturas sombrias para batalhar",
            type: "combat",
            consequence: "Enfrentar inimigos e ganhar experiência",
          },
          {
            text: "Meditar junto às árvores ancestrais",
            type: "rest",
            consequence: "Recuperar energia e ganhar sabedoria",
          },
        ],
        atmosphere: "Místico e levemente ameaçador",
        discoveries: ["Essência Sombria", "Cristal da Floresta"],
        locationData: {
          enemies: location.enemies,
          difficulty: location.difficulty,
          rewards: location.rewards,
          canBattle: true,
        },
      },
    }

    return fallbackStories[location.name] || fallbackStories["Floresta Sombria"]
  }

  // Quick battle creation methods
  async createPvEBattle(playerShadows, masterAffinity = "Chaos", difficulty = 1) {
    const enemyShadows = this.shadowNFTManager.generateEnemyTeam(difficulty, 3)

    return await this.createBattle({
      type: "pve",
      playerShadows: playerShadows,
      enemyShadows: enemyShadows,
      masterAffinity: masterAffinity,
      playerName: "Shadow Master",
      enemyName: "Shadow Legion",
    })
  }

  async createPvPBattle(player1Shadows, player2Shadows, player1Affinity, player2Affinity) {
    return await this.createBattle({
      type: "pvp",
      playerShadows: player1Shadows,
      enemyShadows: player2Shadows,
      masterAffinity: player1Affinity,
      playerName: "Player 1",
      enemyName: "Player 2",
      participants: ["player1", "player2"],
    })
  }

  // Demo methods for testing
  async createDemoBattle() {
    console.log("🎮 Creating demo battle...")

    try {
      const battle = await this.startBattle("umbrafox", "floresta-sombria")
      console.log("✅ Demo battle created:", battle)
      return battle
    } catch (error) {
      console.error("❌ Failed to create demo battle:", error)
      throw error
    }
  }

  async simulateFullBattle() {
    console.log("🤖 Simulating full battle...")

    try {
      // Start battle
      const battle = await this.createDemoBattle()

      // Simulate battle actions
      const actions = [
        { type: "attack", description: "Ataque com espada sombria" },
        { type: "magic", description: "Rajada de energia sombria" },
        { type: "attack", description: "Golpe final devastador" },
      ]

      for (const action of actions) {
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
        const result = await this.processBattleAction(action)
        console.log("⚔️ Action result:", result)

        if (result.battleEnded) {
          break
        }
      }

      console.log("🏁 Battle simulation complete")
      return this.currentBattle
    } catch (error) {
      console.error("❌ Battle simulation failed:", error)
      throw error
    }
  }
}

module.exports = ShadowBattleManager
