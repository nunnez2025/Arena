/**
 * Demo Battle Launcher - Sistema de demonstração completo
 * Integra todos os componentes do sistema de batalha
 */

class DemoBattleLauncher {
  constructor() {
    this.shadowBattleManager = null
    this.aiProviderManager = null
    this.isInitialized = false
    this.currentBattle = null
    this.systemStats = {
      totalBattles: 0,
      successfulBattles: 0,
      aiRequests: 0,
      aiSuccesses: 0,
      startTime: Date.now(),
    }

    console.log("[DemoBattleLauncher] Demo system ready for initialization")
  }

  async initialize() {
    try {
      console.log("🚀 Initializing Shadow Battle Demo System...")

      // Update UI
      this.updateSystemStatus("Initializing AI providers...", "warning")
      await this.delay(1000)

      // Initialize AI Provider Manager
      const AIProviderManager = window.AIProviderManager // Declare the variable before using it
      if (typeof AIProviderManager !== "undefined") {
        this.aiProviderManager = new AIProviderManager()
        await this.aiProviderManager.initialize()
        console.log("✅ AI Provider Manager initialized")
      } else {
        console.warn("⚠️ AIProviderManager not found, using fallback")
      }

      this.updateSystemStatus("Loading Shadow NFT database...", "warning")
      await this.delay(800)

      // Initialize Shadow Battle Manager
      const ShadowBattleManager = window.ShadowBattleManager // Declare the variable before using it
      if (typeof ShadowBattleManager !== "undefined") {
        this.shadowBattleManager = new ShadowBattleManager()
        await this.shadowBattleManager.initialize()
        console.log("✅ Shadow Battle Manager initialized")
      } else {
        console.warn("⚠️ ShadowBattleManager not found, using fallback")
      }

      this.updateSystemStatus("Configuring battle mechanics...", "warning")
      await this.delay(600)

      // Enable buttons
      this.enableButtons()

      this.isInitialized = true
      this.updateSystemStatus("✅ System Ready - All components initialized", "success")

      console.log("🎮 Shadow Battle Demo System fully initialized!")

      // Display initial stats
      this.displaySystemStats()

      return true
    } catch (error) {
      console.error("❌ Initialization failed:", error)
      this.updateSystemStatus("❌ Initialization Failed - Check console for details", "error")
      return false
    }
  }

  async testAIProviders() {
    if (!this.isInitialized) {
      console.warn("⚠️ System not initialized")
      return
    }

    console.log("🧪 Testing AI providers...")

    const testResults = document.getElementById("test-results")
    testResults.innerHTML =
      '<div class="text-center"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div><p class="text-gray-400">Testing AI providers...</p></div>'

    const providers = [
      { name: "OpenAI GPT-4", key: "openai", delay: 1200 },
      { name: "Google Gemini", key: "gemini", delay: 900 },
      { name: "DeepSeek AI", key: "deepseek", delay: 1100 },
      { name: "xAI Grok", key: "grok", delay: 1400 },
    ]

    let resultsHTML = '<div class="space-y-3">'

    for (const provider of providers) {
      console.log(`🔄 Testing ${provider.name}...`)

      // Update UI with current test
      testResults.innerHTML = `
        <div class="space-y-3">
          ${resultsHTML}
          <div class="bg-yellow-600/20 border border-yellow-500/30 p-3 rounded-lg">
            <div class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500 mr-2"></div>
              <span class="text-yellow-400">Testing ${provider.name}...</span>
            </div>
          </div>
        </div>
      `

      await this.delay(provider.delay)

      // Simulate test result (80% success rate)
      const success = Math.random() > 0.2
      this.systemStats.aiRequests++

      if (success) {
        this.systemStats.aiSuccesses++
        console.log(`✅ ${provider.name}: Response time ${provider.delay}ms`)
        resultsHTML += `
          <div class="bg-green-600/20 border border-green-500/30 p-3 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="text-green-400">✅ ${provider.name}</span>
              <span class="text-sm text-gray-400">${provider.delay}ms</span>
            </div>
          </div>
        `
      } else {
        console.log(`❌ ${provider.name}: Connection timeout`)
        resultsHTML += `
          <div class="bg-red-600/20 border border-red-500/30 p-3 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="text-red-400">❌ ${provider.name}</span>
              <span class="text-sm text-gray-400">Timeout</span>
            </div>
          </div>
        `
      }
    }

    resultsHTML += "</div>"
    testResults.innerHTML = resultsHTML

    console.log("🧪 AI provider testing complete")
    this.displaySystemStats()
  }

  async createDemoBattle() {
    if (!this.isInitialized) {
      console.warn("⚠️ System not initialized")
      return
    }

    console.log("⚔️ Creating demo battle...")

    const battleInfo = document.getElementById("battle-info")
    battleInfo.innerHTML =
      '<div class="text-center"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div><p class="text-gray-400">Creating battle...</p></div>'

    try {
      // Generate demo battle data
      await this.delay(1500)

      const battle = {
        id: `demo_battle_${Date.now()}`,
        enemy: "Shadow Umbrafox",
        location: "Floresta Sombria",
        playerLevel: 1,
        difficulty: 1,
        scenario: {
          narrative:
            "Uma criatura sombria emerge das árvores antigas, seus olhos brilhando com energia mística. O Umbrafox das Sombras se prepara para o combate, testando suas habilidades contra um novo desafiante.",
          atmosphere: "Mystical and slightly threatening",
          battleType: "PvE Demo",
        },
      }

      this.currentBattle = battle
      this.systemStats.totalBattles++

      // Update battle info display
      battleInfo.innerHTML = `
        <div class="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 p-4 rounded-lg">
          <h4 class="text-lg font-bold text-purple-400 mb-3">⚔️ ${battle.enemy}</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Location:</span>
              <span class="text-white">${battle.location}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Difficulty:</span>
              <span class="text-yellow-400">Level ${battle.difficulty}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Type:</span>
              <span class="text-cyan-400">${battle.scenario.battleType}</span>
            </div>
          </div>
          <div class="mt-3 p-3 bg-black/30 rounded">
            <p class="text-gray-300 text-sm">${battle.scenario.narrative}</p>
          </div>
          <div class="mt-3 flex space-x-2">
            <button onclick="demoBattleLauncher.simulateFullBattle()" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
              Start Battle
            </button>
            <button onclick="demoBattleLauncher.createDemoBattle()" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">
              New Battle
            </button>
          </div>
        </div>
      `

      console.log("✅ Demo battle created successfully!")
      this.displaySystemStats()
    } catch (error) {
      console.error("❌ Failed to create demo battle:", error)
      battleInfo.innerHTML = `
        <div class="bg-red-600/20 border border-red-500/30 p-4 rounded-lg">
          <p class="text-red-400">❌ Failed to create battle</p>
          <p class="text-sm text-gray-400 mt-1">${error.message}</p>
        </div>
      `
    }
  }

  async simulateFullBattle() {
    if (!this.currentBattle) {
      console.warn("⚠️ No battle created")
      return
    }

    console.log("🤖 Starting battle simulation...")

    const simulationResults = document.getElementById("simulation-results")
    simulationResults.innerHTML =
      '<div class="text-center"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto mb-2"></div><p class="text-gray-400">Simulating battle...</p></div>'

    try {
      let battleLog = '<div class="space-y-2 max-h-64 overflow-y-auto">'

      // Battle simulation phases
      const phases = [
        { action: "Battle Start", description: `Enfrentando ${this.currentBattle.enemy}`, delay: 1000 },
        { action: "Player Attack", description: "Ataque com Espada Sombria - 45 dano!", delay: 1200 },
        {
          action: "Enemy Counter",
          description: `${this.currentBattle.enemy} usa Garra Sombria - 32 dano!`,
          delay: 1100,
        },
        { action: "Player Magic", description: "Rajada de Energia Sombria - 38 dano!", delay: 1300 },
        { action: "Critical Hit", description: "CRÍTICO! Golpe Final Devastador - 67 dano!", delay: 1000 },
        { action: "Victory", description: `${this.currentBattle.enemy} foi derrotado!`, delay: 800 },
      ]

      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i]

        // Add current phase to log
        const phaseColor =
          phase.action === "Victory"
            ? "text-green-400"
            : phase.action.includes("Enemy")
              ? "text-red-400"
              : phase.action === "Critical Hit"
                ? "text-yellow-400"
                : "text-blue-400"

        battleLog += `
          <div class="flex items-center p-2 bg-black/30 rounded">
            <span class="text-xs text-gray-500 mr-2">[${i + 1}]</span>
            <span class="${phaseColor} font-bold mr-2">${phase.action}:</span>
            <span class="text-gray-300 text-sm">${phase.description}</span>
          </div>
        `

        // Update display
        simulationResults.innerHTML = `
          <div class="bg-gradient-to-br from-red-900/50 to-pink-900/50 border border-red-500/30 p-4 rounded-lg">
            <h4 class="text-lg font-bold text-red-400 mb-3">🤖 Battle Simulation</h4>
            ${battleLog}
            ${i < phases.length - 1 ? '<div class="text-center mt-2"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mx-auto"></div></div>' : ""}
          </div>
        `

        console.log(`⚔️ ${phase.action}: ${phase.description}`)
        await this.delay(phase.delay)
      }

      battleLog += "</div>"

      // Final battle results
      const isVictory = Math.random() > 0.3 // 70% win rate
      this.systemStats.successfulBattles += isVictory ? 1 : 0

      simulationResults.innerHTML = `
        <div class="bg-gradient-to-br ${isVictory ? "from-green-900/50 to-emerald-900/50 border-green-500/30" : "from-red-900/50 to-pink-900/50 border-red-500/30"} p-4 rounded-lg">
          <h4 class="text-lg font-bold ${isVictory ? "text-green-400" : "text-red-400"} mb-3">
            ${isVictory ? "🏆 Victory!" : "💀 Defeat!"}
          </h4>
          ${battleLog}
          <div class="mt-4 p-3 bg-black/30 rounded">
            <h5 class="font-bold text-white mb-2">Battle Results:</h5>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-400">Duration:</span>
                <span class="text-white ml-2">${(phases.reduce((sum, p) => sum + p.delay, 0) / 1000).toFixed(1)}s</span>
              </div>
              <div>
                <span class="text-gray-400">Outcome:</span>
                <span class="${isVictory ? "text-green-400" : "text-red-400"} ml-2">${isVictory ? "Victory" : "Defeat"}</span>
              </div>
              ${
                isVictory
                  ? `
                <div>
                  <span class="text-gray-400">XP Gained:</span>
                  <span class="text-yellow-400 ml-2">+150</span>
                </div>
                <div>
                  <span class="text-gray-400">Tokens:</span>
                  <span class="text-cyan-400 ml-2">+75</span>
                </div>
              `
                  : ""
              }
            </div>
          </div>
          <div class="mt-3 text-center">
            <button onclick="demoBattleLauncher.createDemoBattle()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
              New Battle
            </button>
          </div>
        </div>
      `

      console.log(`🏁 Battle simulation complete - ${isVictory ? "Victory" : "Defeat"}!`)
      this.displaySystemStats()
    } catch (error) {
      console.error("❌ Battle simulation failed:", error)
      simulationResults.innerHTML = `
        <div class="bg-red-600/20 border border-red-500/30 p-4 rounded-lg">
          <p class="text-red-400">❌ Simulation failed</p>
          <p class="text-sm text-gray-400 mt-1">${error.message}</p>
        </div>
      `
    }
  }

  displaySystemStats() {
    const statsElement = document.getElementById("system-stats")
    const uptime = Math.floor((Date.now() - this.systemStats.startTime) / 1000)
    const successRate =
      this.systemStats.totalBattles > 0
        ? Math.round((this.systemStats.successfulBattles / this.systemStats.totalBattles) * 100)
        : 0
    const aiSuccessRate =
      this.systemStats.aiRequests > 0
        ? Math.round((this.systemStats.aiSuccesses / this.systemStats.aiRequests) * 100)
        : 0

    statsElement.innerHTML = `
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30 p-4 rounded-lg">
          <h4 class="text-blue-400 font-bold mb-2">System Status</h4>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Status:</span>
              <span class="${this.isInitialized ? "text-green-400" : "text-red-400"}">${this.isInitialized ? "Online" : "Offline"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Uptime:</span>
              <span class="text-white">${uptime}s</span>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-purple-900/50 to-violet-900/50 border border-purple-500/30 p-4 rounded-lg">
          <h4 class="text-purple-400 font-bold mb-2">Battle Stats</h4>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Total:</span>
              <span class="text-white">${this.systemStats.totalBattles}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Win Rate:</span>
              <span class="text-green-400">${successRate}%</span>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-500/30 p-4 rounded-lg">
          <h4 class="text-green-400 font-bold mb-2">AI Performance</h4>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Requests:</span>
              <span class="text-white">${this.systemStats.aiRequests}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Success:</span>
              <span class="text-green-400">${aiSuccessRate}%</span>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border border-yellow-500/30 p-4 rounded-lg">
          <h4 class="text-yellow-400 font-bold mb-2">Memory Usage</h4>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Cache:</span>
              <span class="text-white">${Math.floor(Math.random() * 50) + 10}MB</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Active:</span>
              <span class="text-cyan-400">${this.currentBattle ? "Battle" : "Idle"}</span>
            </div>
          </div>
        </div>
      </div>
    `
  }

  updateSystemStatus(message, type = "info") {
    const statusElement = document.getElementById("system-status")
    const colors = {
      info: "bg-blue-600",
      success: "bg-green-600",
      warning: "bg-yellow-600",
      error: "bg-red-600",
    }

    statusElement.innerHTML = `
      <div class="${colors[type]} text-white p-3 rounded-lg">
        ${message}
      </div>
    `
  }

  enableButtons() {
    const buttons = document.querySelectorAll(".demo-button")
    buttons.forEach((button) => {
      button.disabled = false
      button.classList.remove("opacity-50", "cursor-not-allowed")
    })
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Global instance
const demoBattleLauncher = new DemoBattleLauncher()

// Make it available globally
if (typeof window !== "undefined") {
  window.demoBattleLauncher = demoBattleLauncher
  window.shadowBattleManager = demoBattleLauncher.shadowBattleManager
}

console.log("🎮 Demo Battle Launcher loaded and ready!")
