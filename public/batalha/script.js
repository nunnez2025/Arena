// Game State Management
class BattleGame {
  constructor() {
    this.gameState = "loading"
    this.currentTurn = 0
    this.turnQueue = []
    this.battleLog = []
    this.audioManager = new AudioManager()
    this.effectsManager = new EffectsManager()
    this.animationManager = new AnimationManager()

    // Character Data
    this.hero = {
      name: "Guerreiro das Sombras",
      maxHp: 100,
      hp: 100,
      maxMp: 50,
      mp: 50,
      attack: 25,
      defense: 15,
      speed: 20,
      statusEffects: [],
      position: { x: 200, y: 300 },
      sprite: null,
      state: "idle",
    }

    this.enemy = {
      name: "Dragão Sombrio",
      maxHp: 150,
      hp: 150,
      maxMp: 30,
      mp: 30,
      attack: 30,
      defense: 20,
      speed: 15,
      statusEffects: [],
      position: { x: 600, y: 300 },
      sprite: null,
      state: "idle",
    }

    this.spells = {
      fireball: { name: "Bola de Fogo", cost: 10, damage: 35, type: "damage" },
      heal: { name: "Cura", cost: 8, heal: 40, type: "heal" },
      lightning: { name: "Raio", cost: 15, damage: 45, type: "damage" },
    }

    this.init()
  }

  async init() {
    await this.loadAssets()
    this.setupEventListeners()
    this.initializeCanvases()
    this.startGame()
  }

  async loadAssets() {
    // Simulate asset loading
    const loadingProgress = document.querySelector(".loading-progress")

    for (let i = 0; i <= 100; i += 10) {
      loadingProgress.style.width = i + "%"
      await this.sleep(100)
    }

    // Initialize audio
    await this.audioManager.init()

    // Load character sprites (placeholder for now)
    this.hero.sprite = this.createCharacterSprite("hero")
    this.enemy.sprite = this.createCharacterSprite("enemy")
  }

  createCharacterSprite(type) {
    // Placeholder sprite creation - in real implementation, load actual sprites
    return {
      idle: { frames: 4, duration: 2000 },
      attack: { frames: 6, duration: 800 },
      hurt: { frames: 3, duration: 500 },
      cast: { frames: 8, duration: 1500 },
      death: { frames: 5, duration: 1000 },
    }
  }

  setupEventListeners() {
    // Action buttons
    document.querySelectorAll(".action-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const action = e.currentTarget.dataset.action
        this.handleAction(action)
      })
    })

    // Magic buttons
    document.querySelectorAll(".magic-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const spell = e.currentTarget.dataset.spell
        const cost = Number.parseInt(e.currentTarget.dataset.cost)
        this.handleMagic(spell, cost)
      })
    })

    // Back button
    document.querySelector(".back-btn").addEventListener("click", () => {
      this.showActionMenu()
    })

    // Result buttons
    document.getElementById("continueBtn").addEventListener("click", () => {
      this.returnToMainMenu()
    })

    document.getElementById("retryBtn").addEventListener("click", () => {
      this.restartBattle()
    })

    // Keyboard controls with prevention + buffer + visual feedback
    this.inputBuffer = []
    this.keysDown = new Set()
    const debugEl = document.getElementById("debug")

    const updateDebug = () => {
      if (!debugEl) return
      const turn = this.turnQueue[this.currentTurn]?.type ?? '-'
      debugEl.textContent = `state:${this.gameState} turn:${turn} keys:[${[...this.keysDown].join(',')}] buffer:${this.inputBuffer.join(',')}`
    }

    document.addEventListener("keydown", (e) => {
      // Prevent scrolling on arrows/space
      const preventKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar"]
      if (preventKeys.includes(e.key)) e.preventDefault()

      this.keysDown.add(e.key)
      updateDebug()

      // Map common controls to actions during player's turn
      if (this.gameState === "battle" && this.turnQueue[this.currentTurn]?.type === "hero") {
        switch (e.key) {
          case "Enter":
            this.inputBuffer.push("confirm")
            break
          case "Escape":
            this.inputBuffer.push("cancel")
            break
          case " ": // Space
            this.inputBuffer.push("special")
            break
          case "ArrowUp":
          case "w":
          case "W":
            this.inputBuffer.push("up")
            break
          case "ArrowDown":
          case "s":
          case "S":
            this.inputBuffer.push("down")
            break
          case "ArrowLeft":
          case "a":
          case "A":
            this.inputBuffer.push("left")
            break
          case "ArrowRight":
          case "d":
          case "D":
            this.inputBuffer.push("right")
            break
        }
      }

      // Maintain existing numeric shortcuts
      this.handleKeyboard(e)
    })

    document.addEventListener("keyup", (e) => {
      this.keysDown.delete(e.key)
      updateDebug()
    })

    // Simple input buffer consumer for menu navigation
    this.inputInterval = setInterval(() => {
      if (this.inputBuffer.length === 0) return
      const cmd = this.inputBuffer.shift()
      if (this.gameState !== "battle" || this.turnQueue[this.currentTurn]?.type !== "hero") return

      const actionMenu = document.getElementById("actionMenu")
      const magicMenu = document.getElementById("magicMenu")

      // Focusable buttons
      const visibleButtons = (menu) => Array.from(menu.querySelectorAll("button:not(.disabled)"))
      const setFocus = (btn, list) => {
        list.forEach((b) => b.classList.remove("focused"))
        if (btn) btn.classList.add("focused")
      }

      if (!actionMenu.classList.contains("hidden")) {
        const buttons = visibleButtons(actionMenu)
        let index = buttons.findIndex((b) => b.classList.contains("focused"))
        if (index < 0) index = 0

        if (cmd === "right" || cmd === "down") index = Math.min(buttons.length - 1, index + 1)
        if (cmd === "left" || cmd === "up") index = Math.max(0, index - 1)
        setFocus(buttons[index], buttons)
        if (cmd === "confirm") buttons[index]?.click()
      } else if (!magicMenu.classList.contains("hidden")) {
        const buttons = visibleButtons(magicMenu)
        let index = buttons.findIndex((b) => b.classList.contains("focused"))
        if (index < 0) index = 0

        if (cmd === "down") index = Math.min(buttons.length - 1, index + 1)
        if (cmd === "up") index = Math.max(0, index - 1)
        if (cmd === "cancel") this.showActionMenu()
        setFocus(buttons[index], buttons)
        if (cmd === "confirm") buttons[index]?.click()
      }
    }, 100)
  }

  initializeCanvases() {
    // Initialize background canvas for particles and effects
    this.backgroundCanvas = document.getElementById("backgroundCanvas")
    this.backgroundCtx = this.backgroundCanvas.getContext("2d")

    // Initialize character canvases
    this.heroCanvas = document.getElementById("heroCanvas")
    this.heroCtx = this.heroCanvas.getContext("2d")

    this.enemyCanvas = document.getElementById("enemyCanvas")
    this.enemyCtx = this.enemyCanvas.getContext("2d")

    // Set canvas sizes
    this.resizeCanvases()
    window.addEventListener("resize", () => this.resizeCanvases())

    // Start background animation loop
    this.animateBackground()
  }

  // Placeholder for other methods like handleAction, handleMagic, showActionMenu, etc.
  // These would typically be defined here or in a separate file.
  // For the purpose of this edit, we'll assume they exist.
  // Example:
  // handleAction(action) {
  //   if (action === "attack") {
  //     this.battleLog.push(`${this.hero.name} atacou ${this.enemy.name}!`)
  //     this.enemy.hp -= this.hero.attack
  //     this.checkBattleEnd()
  //   }
  // }

  // Placeholder for sleep function
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Placeholder for resizeCanvases
  resizeCanvases() {
    this.backgroundCanvas.width = window.innerWidth
    this.backgroundCanvas.height = window.innerHeight
    this.heroCanvas.width = window.innerWidth
    this.heroCanvas.height = window.innerHeight
    this.enemyCanvas.width = window.innerWidth
    this.enemyCanvas.height = window.innerHeight
  }

  // Placeholder for animateBackground
  animateBackground() {
    // This would typically update particle positions and draw them
    // this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height)
    // this.effectsManager.update()
    // this.effectsManager.draw(this.backgroundCtx)
    // requestAnimationFrame(this.animateBackground.bind(this))
  }

  // Placeholder for handleKeyboard
  handleKeyboard(e) {
    // This would typically handle numeric shortcuts for actions/spells
    // if (this.gameState === "battle" && this.turnQueue[this.currentTurn]?.type === "hero") {
    //   if (e.key === "1") this.handleAction("attack")
    //   if (e.key === "2") this.handleMagic("heal", 8)
    //   if (e.key === "3") this.handleMagic("lightning", 15)
    // }
  }

  // Placeholder for startGame
  startGame() {
    this.gameState = "battle"
    this.turnQueue = [
      { type: "hero", action: "attack" },
      { type: "enemy", action: "attack" },
    ]
    this.currentTurn = 0
    this.battleLog = []
    this.showBattleScreen()
  }

  // Placeholder for showBattleScreen
  showBattleScreen() {
    document.getElementById("mainMenu").classList.add("hidden")
    document.getElementById("battleScreen").classList.remove("hidden")
    this.renderBattleScreen()
  }

  // Placeholder for renderBattleScreen
  renderBattleScreen() {
    // This would typically draw the battle scene, including characters, spells, and effects
    // this.heroCtx.clearRect(0, 0, this.heroCanvas.width, this.heroCanvas.height)
    // this.enemyCtx.clearRect(0, 0, this.enemyCanvas.width, this.enemyCanvas.height)
    // this.hero.sprite.draw(this.heroCtx, this.hero.position, this.hero.state)
    // this.enemy.sprite.draw(this.enemyCtx, this.enemy.position, this.enemy.state)
    // this.effectsManager.draw(this.backgroundCtx) // Draw effects on background
    // this.animationManager.update()
    // this.animationManager.draw(this.heroCtx, this.hero.position, this.hero.state)
    // this.animationManager.draw(this.enemyCtx, this.enemy.position, this.enemy.state)
  }

  // Placeholder for showActionMenu
  showActionMenu() {
    document.getElementById("actionMenu").classList.remove("hidden")
    document.getElementById("magicMenu").classList.add("hidden")
    document.getElementById("battleScreen").classList.add("hidden")
    document.getElementById("mainMenu").classList.add("hidden")
  }

  // Placeholder for returnToMainMenu
  returnToMainMenu() {
    this.gameState = "mainMenu"
    document.getElementById("mainMenu").classList.remove("hidden")
    document.getElementById("battleScreen").classList.add("hidden")
    document.getElementById("actionMenu").classList.add("hidden")
    document.getElementById("magicMenu").classList.add("hidden")
  }

  // Placeholder for restartBattle
  restartBattle() {
    this.init() // Re-initialize the game
  }

  // Placeholder for checkBattleEnd
  checkBattleEnd() {
    if (this.hero.hp <= 0) {
      this.battleLog.push(`${this.hero.name} foi derrotado!`)
      this.gameOver()
    } else if (this.enemy.hp <= 0) {
      this.battleLog.push(`${this.enemy.name} foi derrotado!`)
      this.gameOver()
    }
  }

  // Placeholder for gameOver
  gameOver() {
    document.getElementById("battleScreen").classList.add("hidden")
    document.getElementById("gameOverScreen").classList.remove("hidden")
    this.renderGameOverScreen()
  }

  // Placeholder for renderGameOverScreen
  renderGameOverScreen() {
    // This would typically display the game over message and buttons
    // this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height)
    // this.effectsManager.draw(this.backgroundCtx)
    // this.animationManager.draw(this.backgroundCtx, { x: window.innerWidth / 2, y: window.innerHeight / 2 }, "gameOver")
  }
}

// Placeholder for AudioManager, EffectsManager, AnimationManager classes
// These would typically be defined here or in a separate file.
// For the purpose of this edit, we'll assume they exist.
// Example:
// class AudioManager {
//   async init() {
//     // Load audio assets
//     this.battleMusic = new Audio("assets/battle_music.mp3")
//     this.battleMusic.loop = true
//     await this.battleMusic.play()
//   }
// }

// class EffectsManager {
//   constructor() {
//     this.particles = []
//   }

//   update() {
//     this.particles = this.particles.filter(p => p.update())
//   }

//   draw(ctx) {
//     this.particles.forEach(p => p.draw(ctx))
//   }
// }

// class AnimationManager {
//   constructor() {
//     this.animations = {}
//   }

//   update() {
//     // Update animation states and frame counters
//   }

//   draw(ctx, position, state) {
//     // Draw character sprite based on state and frame
//   }
// }