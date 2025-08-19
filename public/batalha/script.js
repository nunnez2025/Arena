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

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      this.handleKeyboard(e)
    })
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

  resizeCanvases() {
    const canvases = [this.backgroundCanvas, this.heroCanvas, this.enemyCanvas]
    canvases.forEach((canvas) => {
      if (canvas) {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }
    })
  }

  async startGame() {
    // Hide loading screen
    document.getElementById("loadingScreen").classList.add("hidden")

    // Show battle intro
    await this.showBattleIntro()

    // Start battle
    await this.startBattle()
  }

  async showBattleIntro() {
    const intro = document.getElementById("battleIntro")
    intro.classList.remove("hidden")

    // Play intro music
    this.audioManager.playMusic("intro")

    // Wait for intro animation
    await this.sleep(4000)

    // Hide intro
    intro.classList.add("hidden")
  }

  async startBattle() {
    // Show battle scene
    document.getElementById("battleScene").classList.remove("hidden")

    // Play battle music
    this.audioManager.playMusic("battle")

    // Initialize battle
    this.gameState = "battle"
    this.setupTurnQueue()
    this.updateUI()

    // Start battle loop
    this.battleLoop()
  }

  setupTurnQueue() {
    // Calculate turn order based on speed
    const characters = [
      { ...this.hero, type: "hero" },
      { ...this.enemy, type: "enemy" },
    ]

    // Sort by speed (higher speed goes first)
    characters.sort((a, b) => b.speed - a.speed)

    this.turnQueue = characters
    this.currentTurn = 0

    this.updateTurnDisplay()
  }

  updateTurnDisplay() {
    const turnOrder = document.getElementById("turnOrder")
    turnOrder.innerHTML = ""

    this.turnQueue.forEach((char, index) => {
      const icon = document.createElement("div")
      icon.className = `turn-icon ${char.type}`
      if (index === this.currentTurn) {
        icon.classList.add("active")
      }

      // Set background image (placeholder)
      icon.style.backgroundImage = `url('assets/characters/${char.type}-portrait.png')`

      turnOrder.appendChild(icon)
    })
  }

  async battleLoop() {
    while (this.gameState === "battle") {
      const currentCharacter = this.turnQueue[this.currentTurn]

      if (currentCharacter.type === "hero") {
        await this.playerTurn()
      } else {
        await this.enemyTurn()
      }

      // Check for battle end
      if (this.hero.hp <= 0 || this.enemy.hp <= 0) {
        await this.endBattle()
        break
      }

      // Process status effects
      this.processStatusEffects()

      // Next turn
      this.nextTurn()
    }
  }

  async playerTurn() {
    this.addBattleMessage("Seu turno!", "system")
    this.showActionMenu()

    // Wait for player action
    return new Promise((resolve) => {
      this.playerActionResolve = resolve
    })
  }

  async enemyTurn() {
    this.addBattleMessage(`${this.enemy.name} está pensando...`, "system")
    this.hideActionMenu()

    // AI decision making
    await this.sleep(1000)

    const action = this.getEnemyAction()
    await this.executeEnemyAction(action)
  }

  getEnemyAction() {
    // Simple AI logic
    const hpPercentage = this.enemy.hp / this.enemy.maxHp

    if (hpPercentage < 0.3 && this.enemy.mp >= 8) {
      return { type: "magic", spell: "heal" }
    } else if (this.enemy.mp >= 10 && Math.random() > 0.6) {
      return { type: "magic", spell: "fireball" }
    } else {
      return { type: "attack" }
    }
  }

  async executeEnemyAction(action) {
    switch (action.type) {
      case "attack":
        await this.performAttack(this.enemy, this.hero)
        break
      case "magic":
        await this.performMagic(this.enemy, this.hero, action.spell)
        break
      case "defend":
        await this.performDefend(this.enemy)
        break
    }
  }

  handleAction(action) {
    switch (action) {
      case "attack":
        this.executePlayerAction({ type: "attack" })
        break
      case "magic":
        this.showMagicMenu()
        break
      case "item":
        this.addBattleMessage("Nenhum item disponível!", "system")
        break
      case "defend":
        this.executePlayerAction({ type: "defend" })
        break
    }
  }

  handleMagic(spell, cost) {
    if (this.hero.mp < cost) {
      this.addBattleMessage("MP insuficiente!", "system")
      return
    }

    this.executePlayerAction({ type: "magic", spell: spell })
  }

  async executePlayerAction(action) {
    this.hideActionMenu()

    switch (action.type) {
      case "attack":
        await this.performAttack(this.hero, this.enemy)
        break
      case "magic":
        await this.performMagic(this.hero, this.enemy, action.spell)
        break
      case "defend":
        await this.performDefend(this.hero)
        break
    }

    if (this.playerActionResolve) {
      this.playerActionResolve()
      this.playerActionResolve = null
    }
  }

  async performAttack(attacker, target) {
    const attackerName = attacker === this.hero ? "Você" : attacker.name
    const targetName = target === this.hero ? "você" : target.name

    this.addBattleMessage(`${attackerName} ataca ${targetName}!`, "system")

    // Play attack animation
    await this.animationManager.playAttackAnimation(attacker, target)

    // Calculate damage
    const baseDamage = attacker.attack
    const defense = target.defense
    const randomFactor = 0.8 + Math.random() * 0.4 // 80% to 120%

    let damage = Math.max(1, Math.floor((baseDamage - defense * 0.5) * randomFactor))

    // Check for critical hit
    const isCritical = Math.random() < 0.1 // 10% chance
    if (isCritical) {
      damage = Math.floor(damage * 1.5)
    }

    // Check for miss
    const isMiss = Math.random() < 0.05 // 5% chance
    if (isMiss) {
      damage = 0
    }

    // Apply damage
    target.hp = Math.max(0, target.hp - damage)

    // Visual effects
    if (isMiss) {
      this.showFloatingText(target, "MISS", "miss")
      this.addBattleMessage("O ataque errou!", "system")
    } else {
      this.showFloatingText(target, damage, isCritical ? "critical" : "damage")
      this.addBattleMessage(`${damage} de dano!`, "damage")

      if (isCritical) {
        this.addBattleMessage("Acerto crítico!", "critical")
      }

      // Screen effects
      this.effectsManager.screenFlash()
      this.effectsManager.cameraShake()
    }

    // Play sound effects
    this.audioManager.playSFX(isMiss ? "miss" : "hit")

    // Update UI
    this.updateUI()

    await this.sleep(1000)
  }

  async performMagic(caster, target, spellName) {
    const spell = this.spells[spellName]
    const casterName = caster === this.hero ? "Você" : caster.name

    // Check MP
    if (caster.mp < spell.cost) {
      this.addBattleMessage(`${casterName} não tem MP suficiente!`, "system")
      return
    }

    // Consume MP
    caster.mp -= spell.cost

    this.addBattleMessage(`${casterName} conjura ${spell.name}!`, "magic")

    // Show casting bar
    await this.showCastingBar(spell.name, 2000)

    // Play casting animation
    await this.animationManager.playCastAnimation(caster)

    // Apply spell effect
    if (spell.type === "damage") {
      const damage = spell.damage + Math.floor(Math.random() * 10) - 5
      target.hp = Math.max(0, target.hp - damage)

      this.showFloatingText(target, damage, "damage")
      this.addBattleMessage(`${damage} de dano mágico!`, "damage")

      // Magic effects
      this.effectsManager.magicEffect(spellName)
    } else if (spell.type === "heal") {
      const healAmount = spell.heal + Math.floor(Math.random() * 10) - 5
      const actualHeal = Math.min(healAmount, caster.maxHp - caster.hp)
      caster.hp += actualHeal

      this.showFloatingText(caster, actualHeal, "heal")
      this.addBattleMessage(`${actualHeal} HP restaurado!`, "heal")

      // Heal effects
      this.effectsManager.healEffect(caster)
    }

    // Play sound effects
    this.audioManager.playSFX("magic")

    // Update UI
    this.updateUI()

    await this.sleep(1000)
  }

  async performDefend(character) {
    const characterName = character === this.hero ? "Você" : character.name

    this.addBattleMessage(`${characterName} se defende!`, "system")

    // Add temporary defense boost
    this.addStatusEffect(character, "shield", 2)

    // Play defend animation
    await this.animationManager.playDefendAnimation(character)

    this.updateUI()
    await this.sleep(1000)
  }

  async showCastingBar(spellName, duration) {
    const castingBar = document.getElementById("castingBar")
    const castingSpell = document.getElementById("castingSpell")
    const castingTime = document.getElementById("castingTime")
    const castingFill = document.getElementById("castingFill")

    castingSpell.textContent = `Conjurando ${spellName}...`
    castingBar.classList.remove("hidden")

    const startTime = Date.now()
    const endTime = startTime + duration

    return new Promise((resolve) => {
      const updateCasting = () => {
        const now = Date.now()
        const progress = Math.min(1, (now - startTime) / duration)
        const timeLeft = Math.max(0, (endTime - now) / 1000)

        castingFill.style.width = progress * 100 + "%"
        castingTime.textContent = timeLeft.toFixed(1) + "s"

        if (progress >= 1) {
          castingBar.classList.add("hidden")
          resolve()
        } else {
          requestAnimationFrame(updateCasting)
        }
      }

      updateCasting()
    })
  }

  showFloatingText(target, text, type) {
    const damageNumbers = document.getElementById("damageNumbers")
    const element = document.createElement("div")

    element.className = `damage-number ${type}`
    element.textContent = text

    // Position near target
    const targetElement =
      target === this.hero ? document.getElementById("heroCharacter") : document.getElementById("enemyCharacter")

    const rect = targetElement.getBoundingClientRect()
    element.style.left = rect.left + rect.width / 2 + "px"
    element.style.top = rect.top + rect.height / 2 + "px"

    damageNumbers.appendChild(element)

    // Remove after animation
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    }, 2000)
  }

  addStatusEffect(character, effect, duration) {
    const existing = character.statusEffects.find((e) => e.type === effect)

    if (existing) {
      existing.duration = Math.max(existing.duration, duration)
    } else {
      character.statusEffects.push({
        type: effect,
        duration: duration,
        icon: this.getStatusIcon(effect),
      })
    }

    this.updateStatusEffects()
  }

  getStatusIcon(effect) {
    const icons = {
      poison: "☠️",
      shield: "🛡️",
      haste: "💨",
      regen: "💚",
    }
    return icons[effect] || "❓"
  }

  processStatusEffects() {
    ;[this.hero, this.enemy].forEach((character) => {
      character.statusEffects = character.statusEffects.filter((effect) => {
        // Apply effect
        switch (effect.type) {
          case "poison":
            const poisonDamage = Math.floor(character.maxHp * 0.05)
            character.hp = Math.max(0, character.hp - poisonDamage)
            this.showFloatingText(character, poisonDamage, "damage")
            this.addBattleMessage(`${character.name} sofre ${poisonDamage} de dano por veneno!`, "damage")
            break
          case "regen":
            const regenHeal = Math.floor(character.maxHp * 0.05)
            const actualRegen = Math.min(regenHeal, character.maxHp - character.hp)
            character.hp += actualRegen
            this.showFloatingText(character, actualRegen, "heal")
            this.addBattleMessage(`${character.name} regenera ${actualRegen} HP!`, "heal")
            break
        }

        // Decrease duration
        effect.duration--
        return effect.duration > 0
      })
    })

    this.updateStatusEffects()
    this.updateUI()
  }

  updateStatusEffects() {
    // Update hero status effects
    const heroEffects = document.getElementById("heroStatusEffects")
    heroEffects.innerHTML = ""

    this.hero.statusEffects.forEach((effect) => {
      const element = document.createElement("div")
      element.className = `status-effect ${effect.type}`
      element.textContent = effect.icon
      element.title = `${effect.type} (${effect.duration} turnos)`
      heroEffects.appendChild(element)
    })

    // Update enemy status effects
    const enemyEffects = document.getElementById("enemyStatusEffects")
    enemyEffects.innerHTML = ""

    this.enemy.statusEffects.forEach((effect) => {
      const element = document.createElement("div")
      element.className = `status-effect ${effect.type}`
      element.textContent = effect.icon
      element.title = `${effect.type} (${effect.duration} turnos)`
      enemyEffects.appendChild(element)
    })
  }

  nextTurn() {
    this.currentTurn = (this.currentTurn + 1) % this.turnQueue.length
    this.updateTurnDisplay()
  }

  async endBattle() {
    this.gameState = "ended"

    const isVictory = this.enemy.hp <= 0
    const resultScreen = document.getElementById("battleResult")
    const resultTitle = document.getElementById("resultTitle")
    const resultStats = document.getElementById("resultStats")

    if (isVictory) {
      resultTitle.textContent = "VITÓRIA!"
      resultTitle.className = "result-title victory"
      resultStats.innerHTML = `
                <p>Você derrotou ${this.enemy.name}!</p>
                <p>HP restante: ${this.hero.hp}/${this.hero.maxHp}</p>
                <p>MP restante: ${this.hero.mp}/${this.hero.maxMp}</p>
                <p>Experiência ganha: 150 XP</p>
                <p>Moedas ganhas: 75 Gold</p>
            `
      this.audioManager.playMusic("victory")
    } else {
      resultTitle.textContent = "DERROTA!"
      resultTitle.className = "result-title defeat"
      resultStats.innerHTML = `
                <p>${this.enemy.name} foi mais forte desta vez...</p>
                <p>Não desista! Tente novamente!</p>
            `
      this.audioManager.playMusic("defeat")
    }

    resultScreen.classList.remove("hidden")
  }

  showActionMenu() {
    document.getElementById("actionMenu").classList.remove("hidden")
    document.getElementById("magicMenu").classList.add("hidden")
  }

  hideActionMenu() {
    document.getElementById("actionMenu").classList.add("hidden")
    document.getElementById("magicMenu").classList.add("hidden")
  }

  showMagicMenu() {
    document.getElementById("actionMenu").classList.add("hidden")
    document.getElementById("magicMenu").classList.remove("hidden")

    // Update magic button states based on MP
    document.querySelectorAll(".magic-btn").forEach((btn) => {
      const cost = Number.parseInt(btn.dataset.cost)
      if (this.hero.mp < cost) {
        btn.classList.add("disabled")
        btn.disabled = true
      } else {
        btn.classList.remove("disabled")
        btn.disabled = false
      }
    })
  }

  updateUI() {
    // Update hero stats
    document.getElementById("heroHpBar").style.width = (this.hero.hp / this.hero.maxHp) * 100 + "%"
    document.getElementById("heroHpText").textContent = `${this.hero.hp}/${this.hero.maxHp}`
    document.getElementById("heroMpBar").style.width = (this.hero.mp / this.hero.maxMp) * 100 + "%"
    document.getElementById("heroMpText").textContent = `${this.hero.mp}/${this.hero.maxMp}`

    // Update enemy stats
    document.getElementById("enemyHpBar").style.width = (this.enemy.hp / this.enemy.maxHp) * 100 + "%"
    document.getElementById("enemyHpText").textContent = `${this.enemy.hp}/${this.enemy.maxHp}`
    document.getElementById("enemyMpBar").style.width = (this.enemy.mp / this.enemy.maxMp) * 100 + "%"
    document.getElementById("enemyMpText").textContent = `${this.enemy.mp}/${this.enemy.maxMp}`
  }

  addBattleMessage(message, type = "system") {
    const messages = document.getElementById("battleMessages")
    const messageElement = document.createElement("div")
    messageElement.className = `battle-message message-${type}`
    messageElement.textContent = message

    messages.appendChild(messageElement)
    messages.scrollTop = messages.scrollHeight

    // Keep only last 10 messages
    while (messages.children.length > 10) {
      messages.removeChild(messages.firstChild)
    }
  }

  handleKeyboard(e) {
    if (this.gameState !== "battle" || this.turnQueue[this.currentTurn].type !== "hero") {
      return
    }

    switch (e.key) {
      case "1":
        this.handleAction("attack")
        break
      case "2":
        this.handleAction("magic")
        break
      case "3":
        this.handleAction("item")
        break
      case "4":
        this.handleAction("defend")
        break
      case "Escape":
        if (!document.getElementById("magicMenu").classList.contains("hidden")) {
          this.showActionMenu()
        }
        break
    }
  }

  animateBackground() {
    if (!this.backgroundCtx) return

    const canvas = this.backgroundCanvas
    const ctx = this.backgroundCtx

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw animated particles
    this.drawParticles(ctx, canvas)

    // Continue animation
    requestAnimationFrame(() => this.animateBackground())
  }

  drawParticles(ctx, canvas) {
    // Simple particle system for background ambiance
    const time = Date.now() * 0.001

    for (let i = 0; i < 20; i++) {
      const x = (Math.sin(time + i) * 0.5 + 0.5) * canvas.width
      const y = (Math.cos(time * 0.7 + i * 0.5) * 0.5 + 0.5) * canvas.height
      const size = Math.sin(time + i * 2) * 2 + 3
      const alpha = Math.sin(time + i * 1.5) * 0.3 + 0.2

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = "#64ffda"
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  restartBattle() {
    // Reset character stats
    this.hero.hp = this.hero.maxHp
    this.hero.mp = this.hero.maxMp
    this.hero.statusEffects = []

    this.enemy.hp = this.enemy.maxHp
    this.enemy.mp = this.enemy.maxMp
    this.enemy.statusEffects = []

    // Hide result screen
    document.getElementById("battleResult").classList.add("hidden")

    // Restart battle
    this.startBattle()
  }

  returnToMainMenu() {
    // This would typically navigate back to the main game
    window.location.href = "../index.html"
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Audio Manager Class
class AudioManager {
  constructor() {
    this.bgMusic = document.getElementById("bgMusic")
    this.sfxElements = {
      attack: document.getElementById("sfxAttack"),
      magic: document.getElementById("sfxMagic"),
      hit: document.getElementById("sfxHit"),
      heal: document.getElementById("sfxHeal"),
    }
    this.musicVolume = 0.3
    this.sfxVolume = 0.7
  }

  async init() {
    // Set volumes
    this.bgMusic.volume = this.musicVolume
    Object.values(this.sfxElements).forEach((sfx) => {
      if (sfx) sfx.volume = this.sfxVolume
    })
  }

  playMusic(type) {
    // In a real implementation, you'd switch between different music tracks
    if (this.bgMusic && this.bgMusic.paused) {
      this.bgMusic.play().catch((e) => console.log("Audio play failed:", e))
    }
  }

  playSFX(type) {
    const sfx = this.sfxElements[type]
    if (sfx) {
      sfx.currentTime = 0
      sfx.play().catch((e) => console.log("SFX play failed:", e))
    }
  }

  stopMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause()
      this.bgMusic.currentTime = 0
    }
  }
}

// Effects Manager Class
class EffectsManager {
  constructor() {
    this.screenFlashElement = document.getElementById("screenFlash")
    this.cameraShakeElement = document.getElementById("cameraShake")
    this.lightningLayer = document.querySelector(".lightning-layer")
  }

  screenFlash(duration = 200) {
    if (!this.screenFlashElement) return

    this.screenFlashElement.style.animation = `screenFlash ${duration}ms ease-out`

    setTimeout(() => {
      this.screenFlashElement.style.animation = ""
    }, duration)
  }

  cameraShake(duration = 500) {
    if (!this.cameraShakeElement) return

    this.cameraShakeElement.style.animation = `cameraShake ${duration}ms ease-out`

    setTimeout(() => {
      this.cameraShakeElement.style.animation = ""
    }, duration)
  }

  magicEffect(spellType) {
    // Create spell-specific visual effects
    switch (spellType) {
      case "fireball":
        this.createFireEffect()
        break
      case "lightning":
        this.lightningEffect()
        break
      case "heal":
        this.healEffect()
        break
    }
  }

  createFireEffect() {
    // Create fire particles
    const particles = document.querySelector(".particle-layer")
    if (!particles) return

    for (let i = 0; i < 10; i++) {
      const particle = document.createElement("div")
      particle.style.position = "absolute"
      particle.style.width = "6px"
      particle.style.height = "6px"
      particle.style.background = "#ff6b6b"
      particle.style.borderRadius = "50%"
      particle.style.left = Math.random() * 100 + "%"
      particle.style.top = Math.random() * 100 + "%"
      particle.style.animation = "damageFloat 1s ease-out forwards"

      particles.appendChild(particle)

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle)
        }
      }, 1000)
    }
  }

  lightningEffect() {
    if (!this.lightningLayer) return

    this.lightningLayer.style.animation = "lightning 300ms ease-out"

    setTimeout(() => {
      this.lightningLayer.style.animation = ""
    }, 300)
  }

  healEffect(target) {
    // Create healing sparkles
    const particles = document.querySelector(".particle-layer")
    if (!particles) return

    for (let i = 0; i < 8; i++) {
      const particle = document.createElement("div")
      particle.style.position = "absolute"
      particle.style.width = "4px"
      particle.style.height = "4px"
      particle.style.background = "#2ed573"
      particle.style.borderRadius = "50%"
      particle.style.left = Math.random() * 100 + "%"
      particle.style.top = Math.random() * 100 + "%"
      particle.style.animation = "damageFloat 1.5s ease-out forwards"
      particle.style.boxShadow = "0 0 10px #2ed573"

      particles.appendChild(particle)

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle)
        }
      }, 1500)
    }
  }
}

// Animation Manager Class
class AnimationManager {
  constructor() {
    this.heroCanvas = document.getElementById("heroCanvas")
    this.enemyCanvas = document.getElementById("enemyCanvas")
    this.heroCtx = null
    this.enemyCtx = null

    if (this.heroCanvas) this.heroCtx = this.heroCanvas.getContext("2d")
    if (this.enemyCanvas) this.enemyCtx = this.enemyCanvas.getContext("2d")
  }

  async playAttackAnimation(attacker, target) {
    const isHero = attacker.name === "Guerreiro das Sombras"
    const canvas = isHero ? this.heroCanvas : this.enemyCanvas
    const ctx = isHero ? this.heroCtx : this.enemyCtx

    if (!canvas || !ctx) return

    // Simple attack animation - character moves forward and back
    const originalTransform = canvas.style.transform || ""

    // Move forward
    canvas.style.transition = "transform 0.2s ease-out"
    canvas.style.transform = originalTransform + (isHero ? " translateX(50px)" : " translateX(-50px)")

    await this.sleep(200)

    // Move back
    canvas.style.transform = originalTransform

    await this.sleep(300)

    // Reset
    canvas.style.transition = ""
  }

  async playCastAnimation(caster) {
    const isHero = caster.name === "Guerreiro das Sombras"
    const canvas = isHero ? this.heroCanvas : this.enemyCanvas

    if (!canvas) return

    // Casting animation - gentle glow effect
    const originalFilter = canvas.style.filter || ""

    canvas.style.transition = "filter 0.5s ease-in-out"
    canvas.style.filter = originalFilter + " drop-shadow(0 0 20px #9c27b0)"

    await this.sleep(1500)

    canvas.style.filter = originalFilter
    canvas.style.transition = ""
  }

  async playDefendAnimation(character) {
    const isHero = character.name === "Guerreiro das Sombras"
    const canvas = isHero ? this.heroCanvas : this.enemyCanvas

    if (!canvas) return

    // Defend animation - blue shield glow
    const originalFilter = canvas.style.filter || ""

    canvas.style.transition = "filter 0.3s ease-in-out"
    canvas.style.filter = originalFilter + " drop-shadow(0 0 15px #3f51b5)"

    await this.sleep(800)

    canvas.style.filter = originalFilter
    canvas.style.transition = ""
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Initialize the game when the page loads
document.addEventListener("DOMContentLoaded", () => {
  window.battleGame = new BattleGame()
})

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (window.battleGame && window.battleGame.audioManager) {
    if (document.hidden) {
      window.battleGame.audioManager.stopMusic()
    } else {
      window.battleGame.audioManager.playMusic("battle")
    }
  }
})
