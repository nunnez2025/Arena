const Phaser = require("phaser")
const Colyseus = require("colyseus.js")

class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: "BattleScene" })

    this.room = null
    this.participants = new Map()
    this.currentTurn = null
    this.battleUI = null
    this.effectsManager = null
    this.audioManager = null
    this.animationManager = null
    this.isMyTurn = false
    this.battleConfig = null
  }

  init(data) {
    this.battleData = data
    console.log("[BattleScene] Initialized with data:", data)
  }

  preload() {
    // Load battle assets
    this.load.image("battle-bg", "/assets/battle/backgrounds/forest_battle.jpg")
    this.load.image("battle-ground", "/assets/battle/backgrounds/battle_ground.png")

    // Load character sprites
    this.load.spritesheet("hero-idle", "/assets/battle/characters/hero_idle.png", {
      frameWidth: 64,
      frameHeight: 64,
    })
    this.load.spritesheet("hero-attack", "/assets/battle/characters/hero_attack.png", {
      frameWidth: 64,
      frameHeight: 64,
    })
    this.load.spritesheet("enemy-idle", "/assets/battle/characters/enemy_idle.png", {
      frameWidth: 64,
      frameHeight: 64,
    })

    // Load UI elements
    this.load.image("battle-panel", "/assets/battle/ui/battle_panel.png")
    this.load.image("hp-bar", "/assets/battle/ui/hp_bar.png")
    this.load.image("mp-bar", "/assets/battle/ui/mp_bar.png")
    this.load.image("turn-indicator", "/assets/battle/ui/turn_indicator.png")

    // Load effect sprites
    this.load.spritesheet("fire-effect", "/assets/battle/effects/fire_explosion.png", {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet("heal-effect", "/assets/battle/effects/heal_sparkle.png", {
      frameWidth: 64,
      frameHeight: 64,
    })

    // Load audio
    this.load.audio("battle-music", "/assets/battle/audio/battle_theme.mp3")
    this.load.audio("attack-sound", "/assets/battle/audio/sword_slash.wav")
    this.load.audio("magic-sound", "/assets/battle/audio/magic_cast.wav")
    this.load.audio("heal-sound", "/assets/battle/audio/heal.wav")
    this.load.audio("damage-sound", "/assets/battle/audio/damage.wav")
    this.load.audio("defend-sound", "/assets/battle/audio/defend.wav")
    this.load.audio("miss-sound", "/assets/battle/audio/miss.wav")

    // Load fonts
    this.load.bitmapFont("battle-font", "/assets/fonts/battle_font.png", "/assets/fonts/battle_font.xml")
  }

  create() {
    console.log("[BattleScene] Creating battle scene")

    // Initialize managers
    this.effectsManager = new BattleEffectsManager(this)
    this.audioManager = new BattleAudioManager(this)
    this.animationManager = new BattleAnimationManager(this)

    // Create background
    this.createBackground()

    // Create UI
    this.battleUI = new BattleUI(this)

    // Setup camera
    this.cameras.main.setZoom(1)
    this.cameras.main.fadeIn(1000)

    // Connect to battle room
    this.connectToBattleRoom()

    // Create animations
    this.createAnimations()

    // Start battle music
    this.audioManager.playBattleMusic()

    // Show VS screen
    this.showVSScreen()
  }

  createBackground() {
    // Background image
    const bg = this.add.image(400, 300, "battle-bg")
    bg.setDisplaySize(800, 600)

    // Ground
    const ground = this.add.image(400, 500, "battle-ground")
    ground.setDisplaySize(800, 200)

    // Particle effects for atmosphere
    this.effectsManager.createAtmosphereEffects()
  }

  createAnimations() {
    // Hero animations
    this.anims.create({
      key: "hero-idle-anim",
      frames: this.anims.generateFrameNumbers("hero-idle", { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    })

    this.anims.create({
      key: "hero-attack-anim",
      frames: this.anims.generateFrameNumbers("hero-attack", { start: 0, end: 5 }),
      frameRate: 12,
      repeat: 0,
    })

    // Enemy animations
    this.anims.create({
      key: "enemy-idle-anim",
      frames: this.anims.generateFrameNumbers("enemy-idle", { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    })

    this.anims.create({
      key: "enemy-attack-anim",
      frames: this.anims.generateFrameNumbers("enemy-idle", { start: 0, end: 3 }),
      frameRate: 12,
      repeat: 0,
    })

    // Effect animations
    this.anims.create({
      key: "fire-explosion",
      frames: this.anims.generateFrameNumbers("fire-effect", { start: 0, end: 7 }),
      frameRate: 15,
      repeat: 0,
    })

    this.anims.create({
      key: "heal-sparkle",
      frames: this.anims.generateFrameNumbers("heal-effect", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 0,
    })
  }

  connectToBattleRoom() {
    // Connect to Colyseus battle room
    const client = new Colyseus.Client("ws://localhost:2567")

    client
      .joinOrCreate("battle", this.battleData)
      .then((room) => {
        console.log("[BattleScene] Connected to battle room:", room.sessionId)

        this.room = room

        // Listen for state changes
        room.onStateChange((state) => {
          this.updateBattleState(state)
        })

        // Listen for messages
        room.onMessage("battle-config", (config) => {
          this.battleConfig = config
          console.log("[BattleScene] Received battle config:", config)
        })

        room.onMessage("battle-started", (data) => {
          this.onBattleStarted(data)
        })

        room.onMessage("turn-started", (data) => {
          this.onTurnStarted(data)
        })

        room.onMessage("attack-result", (data) => {
          this.onAttackResult(data)
        })

        room.onMessage("magic-result", (data) => {
          this.onMagicResult(data)
        })

        room.onMessage("defend-result", (data) => {
          this.onDefendResult(data)
        })

        room.onMessage("battle-ended", (data) => {
          this.onBattleEnded(data)
        })

        room.onMessage("error", (data) => {
          this.battleUI.showError(data.message)
        })
      })
      .catch((error) => {
        console.error("[BattleScene] Failed to connect to battle room:", error)
        this.scene.start("MainScene")
      })
  }

  updateBattleState(state) {
    // Update participants
    state.participants.forEach((participant, playerId) => {
      this.updateParticipant(playerId, participant)
    })

    // Update turn queue
    this.battleUI.updateTurnQueue(state.turnQueue)

    // Update battle log
    this.battleUI.updateBattleLog(state.battleLog)
  }

  updateParticipant(playerId, participantData) {
    let participant = this.participants.get(playerId)

    if (!participant) {
      // Create new participant sprite
      participant = this.createParticipantSprite(playerId, participantData)
      this.participants.set(playerId, participant)
    }

    // Update participant data
    participant.data = participantData

    // Update sprite position and animations
    this.animationManager.updateParticipantSprite(participant)

    // Update UI elements
    this.battleUI.updateParticipantUI(participant)
  }

  createParticipantSprite(playerId, data) {
    const isPlayer = data.team === "player"
    const x = isPlayer ? 150 + this.getPlayerIndex(playerId) * 100 : 650 - this.getEnemyIndex(playerId) * 100
    const y = 400

    const spriteKey = isPlayer ? "hero-idle" : "enemy-idle"
    const sprite = this.add.sprite(x, y, spriteKey)

    sprite.setScale(2)
    sprite.play(isPlayer ? "hero-idle-anim" : "enemy-idle-anim")

    // Flip enemy sprites
    if (!isPlayer) {
      sprite.setFlipX(true)
    }

    const participant = {
      playerId: playerId,
      sprite: sprite,
      data: data,
      originalX: x,
      originalY: y,
      isPlayer: isPlayer,
    }

    // Add click handler for targeting
    sprite.setInteractive()
    sprite.on("pointerdown", () => {
      if (this.isMyTurn && !isPlayer) {
        this.battleUI.selectTarget(playerId)
      }
    })

    return participant
  }

  getPlayerIndex(playerId) {
    const playerIds = Array.from(this.participants.keys()).filter(
      (id) => this.participants.get(id)?.data?.team === "player",
    )
    return playerIds.indexOf(playerId)
  }

  getEnemyIndex(playerId) {
    const enemyIds = Array.from(this.participants.keys()).filter(
      (id) => this.participants.get(id)?.data?.team === "enemy",
    )
    return enemyIds.indexOf(playerId)
  }

  showVSScreen() {
    const vsText = this.add.text(400, 300, "BATTLE START!", {
      fontSize: "48px",
      fill: "#ff0000",
      stroke: "#000000",
      strokeThickness: 4,
    })
    vsText.setOrigin(0.5)

    // Animate VS screen
    this.tweens.add({
      targets: vsText,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 500,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: vsText,
          alpha: 0,
          duration: 1000,
          onComplete: () => {
            vsText.destroy()
          },
        })
      },
    })

    // Camera shake
    this.cameras.main.shake(500, 0.02)
  }

  onBattleStarted(data) {
    console.log("[BattleScene] Battle started:", data)
    this.battleUI.showMessage("Battle Started!")
  }

  onTurnStarted(data) {
    console.log("[BattleScene] Turn started:", data)

    this.currentTurn = data.playerId
    this.isMyTurn = data.playerId === this.room.sessionId

    // Update turn indicator
    this.battleUI.updateTurnIndicator(data.playerId, this.isMyTurn)

    if (this.isMyTurn) {
      this.battleUI.showActionMenu()
      this.battleUI.showMessage("Your turn!")
    } else {
      this.battleUI.hideActionMenu()
      const participant = this.participants.get(data.playerId)
      if (participant) {
        this.battleUI.showMessage(`${participant.data.name}'s turn`)
      }
    }
  }

  onAttackResult(data) {
    console.log("[BattleScene] Attack result:", data)

    const attacker = this.participants.get(data.attackerId)
    const target = this.participants.get(data.targetId)

    if (attacker && target) {
      // Play attack animation
      this.animationManager.playAttackAnimation(attacker, target, () => {
        // Show damage/miss effect
        if (data.isMiss) {
          this.effectsManager.showMissEffect(target)
          this.audioManager.playSound("miss")
        } else {
          this.effectsManager.showDamageEffect(target, data.damage, data.isCritical)
          this.audioManager.playSound("damage")

          // Camera shake on hit
          this.cameras.main.shake(200, 0.01)
        }

        // Update HP bar
        this.battleUI.updateHealthBar(target, data.targetHp, data.targetMaxHp)

        // Check if target died
        if (data.targetHp <= 0) {
          this.animationManager.playDeathAnimation(target)
        }
      })
    }
  }

  onMagicResult(data) {
    console.log("[BattleScene] Magic result:", data)

    const caster = this.participants.get(data.casterId)
    const target = this.participants.get(data.targetId)

    if (caster && target) {
      // Play casting animation
      this.animationManager.playCastingAnimation(caster, data.skill, () => {
        // Show magic effect
        this.effectsManager.showMagicEffect(target, data.skill)
        this.audioManager.playSound("magic")

        // Show value (damage or heal)
        if (data.skill.type === "damage") {
          this.effectsManager.showDamageEffect(target, data.value, false)
          this.battleUI.updateHealthBar(target, data.targetHp, data.targetMaxHp)
        } else if (data.skill.type === "heal") {
          this.effectsManager.showHealEffect(target, data.value)
          this.battleUI.updateHealthBar(target, data.targetHp, data.targetMaxHp)
        }

        // Update MP bars
        this.battleUI.updateManaBar(caster, data.casterMp, caster.data.maxMp)
      })
    }
  }

  onDefendResult(data) {
    console.log("[BattleScene] Defend result:", data)

    const defender = this.participants.get(data.playerId)
    if (defender) {
      this.effectsManager.showDefendEffect(defender)
      this.audioManager.playSound("defend")
      this.battleUI.showMessage(`${defender.data.name} takes a defensive stance!`)
    }
  }

  onBattleEnded(data) {
    console.log("[BattleScene] Battle ended:", data)

    // Stop battle music
    this.audioManager.stopBattleMusic()

    // Show results screen
    this.battleUI.showResultsScreen(data)

    // Auto-return to main scene after delay
    this.time.delayedCall(10000, () => {
      this.scene.start("MainScene")
    })
  }

  // Player action methods
  performAttack(targetId) {
    if (!this.isMyTurn) return

    this.room.send("battle-action", {
      type: "attack",
      targetId: targetId,
    })

    this.battleUI.hideActionMenu()
  }

  performMagic(skillId, targetId) {
    if (!this.isMyTurn) return

    this.room.send("battle-action", {
      type: "magic",
      skillId: skillId,
      targetId: targetId,
    })

    this.battleUI.hideActionMenu()
  }

  performDefend() {
    if (!this.isMyTurn) return

    this.room.send("battle-action", {
      type: "defend",
    })

    this.battleUI.hideActionMenu()
  }

  useItem(itemId, targetId) {
    if (!this.isMyTurn) return

    this.room.send("battle-action", {
      type: "item",
      itemId: itemId,
      targetId: targetId,
    })

    this.battleUI.hideActionMenu()
  }

  update() {
    // Update particle effects
    this.effectsManager.update()

    // Update animations
    this.animationManager.update()
  }

  shutdown() {
    // Cleanup
    if (this.room) {
      this.room.leave()
    }

    this.audioManager.cleanup()
    this.effectsManager.cleanup()
  }
}

// Battle UI Manager
class BattleUI {
  constructor(scene) {
    this.scene = scene
    this.actionMenu = null
    this.turnQueue = null
    this.battleLog = null
    this.participantUIs = new Map()
    this.selectedTarget = null
    this.selectedSkill = null

    this.createUI()
  }

  createUI() {
    // Create main battle panel
    this.battlePanel = this.scene.add.image(400, 550, "battle-panel")
    this.battlePanel.setDisplaySize(800, 100)

    // Create action menu
    this.createActionMenu()

    // Create turn queue display
    this.createTurnQueue()

    // Create battle log
    this.createBattleLog()

    // Create message display
    this.messageText = this.scene.add.text(400, 50, "", {
      fontSize: "24px",
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    })
    this.messageText.setOrigin(0.5)
  }

  createActionMenu() {
    this.actionMenu = this.scene.add.container(400, 520)

    const buttons = [
      { text: "Attack", action: "attack", x: -150 },
      { text: "Magic", action: "magic", x: -50 },
      { text: "Item", action: "item", x: 50 },
      { text: "Defend", action: "defend", x: 150 },
    ]

    buttons.forEach((buttonData) => {
      const button = this.scene.add.text(buttonData.x, 0, buttonData.text, {
        fontSize: "18px",
        fill: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 10, y: 5 },
      })

      button.setOrigin(0.5)
      button.setInteractive()

      button.on("pointerover", () => {
        button.setStyle({ backgroundColor: "#555555" })
      })

      button.on("pointerout", () => {
        button.setStyle({ backgroundColor: "#333333" })
      })

      button.on("pointerdown", () => {
        this.handleActionButton(buttonData.action)
      })

      this.actionMenu.add(button)
    })

    this.actionMenu.setVisible(false)
  }

  createTurnQueue() {
    this.turnQueue = this.scene.add.container(50, 50)

    const title = this.scene.add.text(0, 0, "Turn Order:", {
      fontSize: "16px",
      fill: "#ffffff",
    })

    this.turnQueue.add(title)
  }

  createBattleLog() {
    this.battleLog = this.scene.add.container(600, 100)

    const background = this.scene.add.rectangle(0, 0, 180, 200, 0x000000, 0.7)
    this.battleLog.add(background)

    const title = this.scene.add.text(0, -90, "Battle Log", {
      fontSize: "14px",
      fill: "#ffffff",
    })
    title.setOrigin(0.5)
    this.battleLog.add(title)

    this.logEntries = []
  }

  handleActionButton(action) {
    switch (action) {
      case "attack":
        this.showTargetSelection("attack")
        break

      case "magic":
        this.showMagicMenu()
        break

      case "item":
        this.showItemMenu()
        break

      case "defend":
        this.scene.performDefend()
        break
    }
  }

  showTargetSelection(actionType) {
    this.showMessage("Select a target")

    // Highlight enemy targets
    this.scene.participants.forEach((participant, playerId) => {
      if (participant.data.team === "enemy" && participant.data.isAlive) {
        participant.sprite.setTint(0xff0000)

        participant.sprite.on("pointerdown", () => {
          this.selectTarget(playerId)

          if (actionType === "attack") {
            this.scene.performAttack(playerId)
          } else if (actionType === "magic") {
            this.scene.performMagic(this.selectedSkill, playerId)
            this.selectedSkill = null
          }

          this.clearTargetHighlights()
        })
      }
    })
  }

  showMagicMenu() {
    if (!this.scene.battleConfig || !this.scene.battleConfig.skills) {
      this.showError("No magic available")
      return
    }

    // Create magic selection menu
    const magicMenu = this.scene.add.container(400, 400)

    const skills = Object.values(this.scene.battleConfig.skills)

    skills.forEach((skill, index) => {
      const skillButton = this.scene.add.text(0, index * 30, `${skill.name} (${skill.mpCost} MP)`, {
        fontSize: "16px",
        fill: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 10, y: 5 },
      })

      skillButton.setOrigin(0.5)
      skillButton.setInteractive()

      skillButton.on("pointerdown", () => {
        magicMenu.destroy()
        this.showTargetSelection("magic")

        // Store selected skill
        this.selectedSkill = skill.id
      })

      magicMenu.add(skillButton)
    })

    // Add cancel button
    const cancelButton = this.scene.add.text(0, skills.length * 30 + 20, "Cancel", {
      fontSize: "16px",
      fill: "#ff0000",
      backgroundColor: "#333333",
      padding: { x: 10, y: 5 },
    })

    cancelButton.setOrigin(0.5)
    cancelButton.setInteractive()

    cancelButton.on("pointerdown", () => {
      magicMenu.destroy()
      this.showActionMenu()
    })

    magicMenu.add(cancelButton)
  }

  showItemMenu() {
    // Similar to magic menu but for items
    this.showMessage("Items not implemented yet")
  }

  selectTarget(playerId) {
    this.selectedTarget = playerId
  }

  clearTargetHighlights() {
    this.scene.participants.forEach((participant) => {
      participant.sprite.clearTint()
    })
  }

  showActionMenu() {
    this.actionMenu.setVisible(true)
  }

  hideActionMenu() {
    this.actionMenu.setVisible(false)
  }

  updateTurnQueue(turnQueue) {
    // Clear existing turn indicators
    this.turnQueue.removeAll(true)

    const title = this.scene.add.text(0, 0, "Turn Order:", {
      fontSize: "16px",
      fill: "#ffffff",
    })
    this.turnQueue.add(title)

    // Add turn indicators
    turnQueue.forEach((playerId, index) => {
      const participant = this.scene.participants.get(playerId)
      if (participant) {
        const indicator = this.scene.add.text(0, 25 + index * 20, participant.data.name, {
          fontSize: "14px",
          fill: index === 0 ? "#ffff00" : "#ffffff",
        })

        this.turnQueue.add(indicator)
      }
    })
  }

  updateTurnIndicator(currentPlayerId, isMyTurn) {
    if (isMyTurn) {
      this.showMessage("Your Turn!")
    }
  }

  updateParticipantUI(participant) {
    // Update health and mana bars for participant
    this.updateHealthBar(participant, participant.data.hp, participant.data.maxHp)
    this.updateManaBar(participant, participant.data.mp, participant.data.maxMp)
  }

  updateHealthBar(participant, currentHp, maxHp) {
    const percentage = currentHp / maxHp

    // Create or update health bar
    if (!participant.healthBar) {
      participant.healthBar = this.scene.add.container(participant.originalX, participant.originalY - 40)

      const background = this.scene.add.rectangle(0, 0, 60, 8, 0x000000)
      const bar = this.scene.add.rectangle(-28, 0, 56 * percentage, 6, 0x00ff00)

      participant.healthBar.add([background, bar])
      participant.healthBarFill = bar
    } else {
      // Update existing bar
      const newWidth = 56 * percentage
      participant.healthBarFill.setSize(newWidth, 6)
      participant.healthBarFill.x = -28 + newWidth / 2

      // Change color based on health
      if (percentage > 0.6) {
        participant.healthBarFill.setFillStyle(0x00ff00)
      } else if (percentage > 0.3) {
        participant.healthBarFill.setFillStyle(0xffff00)
      } else {
        participant.healthBarFill.setFillStyle(0xff0000)
      }
    }
  }

  updateManaBar(participant, currentMp, maxMp) {
    const percentage = currentMp / maxMp

    // Create or update mana bar
    if (!participant.manaBar) {
      participant.manaBar = this.scene.add.container(participant.originalX, participant.originalY - 30)

      const background = this.scene.add.rectangle(0, 0, 60, 6, 0x000000)
      const bar = this.scene.add.rectangle(-28, 0, 56 * percentage, 4, 0x0000ff)

      participant.manaBar.add([background, bar])
      participant.manaBarFill = bar
    } else {
      // Update existing bar
      const newWidth = 56 * percentage
      participant.manaBarFill.setSize(newWidth, 4)
      participant.manaBarFill.x = -28 + newWidth / 2
    }
  }

  updateBattleLog(logEntries) {
    // Clear existing log entries
    this.logEntries.forEach((entry) => entry.destroy())
    this.logEntries = []

    // Show last 8 entries
    const recentEntries = logEntries.slice(-8)

    recentEntries.forEach((entry, index) => {
      const logText = this.scene.add.text(0, -70 + index * 15, entry, {
        fontSize: "10px",
        fill: "#ffffff",
        wordWrap: { width: 170 },
      })

      logText.setOrigin(0.5, 0)
      this.battleLog.add(logText)
      this.logEntries.push(logText)
    })
  }

  showMessage(message) {
    this.messageText.setText(message)

    // Fade out after 3 seconds
    this.scene.tweens.add({
      targets: this.messageText,
      alpha: 0,
      duration: 3000,
      onComplete: () => {
        this.messageText.alpha = 1
        this.messageText.setText("")
      },
    })
  }

  showError(message) {
    const errorText = this.scene.add.text(400, 200, message, {
      fontSize: "20px",
      fill: "#ff0000",
      backgroundColor: "#000000",
      padding: { x: 20, y: 10 },
    })

    errorText.setOrigin(0.5)

    this.scene.tweens.add({
      targets: errorText,
      alpha: 0,
      duration: 3000,
      onComplete: () => {
        errorText.destroy()
      },
    })
  }

  showResultsScreen(data) {
    const resultsContainer = this.scene.add.container(400, 300)

    const background = this.scene.add.rectangle(0, 0, 400, 300, 0x000000, 0.8)
    resultsContainer.add(background)

    const title = this.scene.add.text(0, -120, data.winner === "player" ? "VICTORY!" : "DEFEAT!", {
      fontSize: "32px",
      fill: data.winner === "player" ? "#00ff00" : "#ff0000",
    })
    title.setOrigin(0.5)
    resultsContainer.add(title)

    // Show rewards
    if (data.rewards) {
      const rewardsText = this.scene.add.text(
        0,
        -60,
        `Experience: ${data.rewards.experience}\nGold: ${data.rewards.gold}`,
        {
          fontSize: "18px",
          fill: "#ffffff",
          align: "center",
        },
      )
      rewardsText.setOrigin(0.5)
      resultsContainer.add(rewardsText)
    }

    // Continue button
    const continueButton = this.scene.add.text(0, 80, "Continue", {
      fontSize: "20px",
      fill: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 20, y: 10 },
    })

    continueButton.setOrigin(0.5)
    continueButton.setInteractive()

    continueButton.on("pointerdown", () => {
      this.scene.scene.start("MainScene")
    })

    resultsContainer.add(continueButton)
  }
}

// Battle Effects Manager
class BattleEffectsManager {
  constructor(scene) {
    this.scene = scene
    this.particles = []
  }

  createAtmosphereEffects() {
    // Create floating particles for atmosphere
    const particles = this.scene.add.particles(0, 0, "particle", {
      x: { min: 0, max: 800 },
      y: { min: 0, max: 600 },
      scale: { start: 0.1, end: 0.3 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 3000,
      frequency: 100,
    })

    this.particles.push(particles)
  }

  showDamageEffect(target, damage, isCritical) {
    const color = isCritical ? "#ff0000" : "#ffffff"
    const text = isCritical ? `${damage}!` : damage.toString()

    const damageText = this.scene.add.text(target.sprite.x, target.sprite.y - 30, text, {
      fontSize: isCritical ? "24px" : "18px",
      fill: color,
      stroke: "#000000",
      strokeThickness: 2,
    })

    damageText.setOrigin(0.5)

    // Animate damage number
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        damageText.destroy()
      },
    })

    // Screen flash for critical hits
    if (isCritical) {
      this.screenFlash(0xff0000, 200)
    }
  }

  showHealEffect(target, healAmount) {
    const healText = this.scene.add.text(target.sprite.x, target.sprite.y - 30, `+${healAmount}`, {
      fontSize: "18px",
      fill: "#00ff00",
      stroke: "#000000",
      strokeThickness: 2,
    })

    healText.setOrigin(0.5)

    // Animate heal number
    this.scene.tweens.add({
      targets: healText,
      y: healText.y - 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        healText.destroy()
      },
    })

    // Heal sparkle effect
    const sparkle = this.scene.add.sprite(target.sprite.x, target.sprite.y, "heal-effect")
    sparkle.play("heal-sparkle")

    sparkle.on("animationcomplete", () => {
      sparkle.destroy()
    })
  }

  showMissEffect(target) {
    const missText = this.scene.add.text(target.sprite.x, target.sprite.y - 30, "MISS", {
      fontSize: "18px",
      fill: "#888888",
      stroke: "#000000",
      strokeThickness: 2,
    })

    missText.setOrigin(0.5)

    // Animate miss text
    this.scene.tweens.add({
      targets: missText,
      y: missText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        missText.destroy()
      },
    })
  }

  showMagicEffect(target, skill) {
    switch (skill.animation) {
      case "fire_cast":
        this.showFireEffect(target)
        break
      case "heal_cast":
        this.showHealSparkleEffect(target)
        break
      case "poison_cast":
        this.showPoisonEffect(target)
        break
    }
  }

  showFireEffect(target) {
    const fireEffect = this.scene.add.sprite(target.sprite.x, target.sprite.y, "fire-effect")
    fireEffect.setScale(1.5)
    fireEffect.play("fire-explosion")

    fireEffect.on("animationcomplete", () => {
      fireEffect.destroy()
    })

    // Screen flash
    this.screenFlash(0xff4400, 300)
  }

  showHealSparkleEffect(target) {
    const sparkle = this.scene.add.sprite(target.sprite.x, target.sprite.y, "heal-effect")
    sparkle.play("heal-sparkle")

    sparkle.on("animationcomplete", () => {
      sparkle.destroy()
    })
  }

  showPoisonEffect(target) {
    // Create poison cloud effect
    const poisonCloud = this.scene.add.circle(target.sprite.x, target.sprite.y, 30, 0x00ff00, 0.5)

    this.scene.tweens.add({
      targets: poisonCloud,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        poisonCloud.destroy()
      },
    })
  }

  showDefendEffect(target) {
    // Create shield effect
    const shield = this.scene.add.circle(target.sprite.x, target.sprite.y, 40, 0x0088ff, 0.3)

    this.scene.tweens.add({
      targets: shield,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        shield.destroy()
      },
    })
  }

  screenFlash(color, duration) {
    const flash = this.scene.add.rectangle(400, 300, 800, 600, color, 0.3)

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      onComplete: () => {
        flash.destroy()
      },
    })
  }

  update() {
    // Update particle systems
  }

  cleanup() {
    this.particles.forEach((particle) => {
      if (particle && particle.destroy) {
        particle.destroy()
      }
    })
    this.particles = []
  }
}

// Battle Audio Manager
class BattleAudioManager {
  constructor(scene) {
    this.scene = scene
    this.battleMusic = null
    this.sounds = {}
  }

  playBattleMusic() {
    if (this.battleMusic) {
      this.battleMusic.stop()
    }

    this.battleMusic = this.scene.sound.add("battle-music", {
      loop: true,
      volume: 0.5,
    })

    this.battleMusic.play()
  }

  stopBattleMusic() {
    if (this.battleMusic) {
      this.battleMusic.stop()
      this.battleMusic = null
    }
  }

  playSound(soundKey) {
    const soundMap = {
      attack: "attack-sound",
      magic: "magic-sound",
      heal: "heal-sound",
      damage: "damage-sound",
      defend: "defend-sound",
      miss: "miss-sound",
    }

    const audioKey = soundMap[soundKey]
    if (audioKey && this.scene.sound.get(audioKey)) {
      this.scene.sound.play(audioKey, { volume: 0.7 })
    }
  }

  cleanup() {
    this.stopBattleMusic()

    Object.values(this.sounds).forEach((sound) => {
      if (sound && sound.stop) {
        sound.stop()
      }
    })

    this.sounds = {}
  }
}

// Battle Animation Manager
class BattleAnimationManager {
  constructor(scene) {
    this.scene = scene
  }

  updateParticipantSprite(participant) {
    if (!participant.data.isAlive && participant.sprite.alpha > 0) {
      // Fade out dead participants
      this.scene.tweens.add({
        targets: participant.sprite,
        alpha: 0.3,
        duration: 1000,
      })
    }
  }

  playAttackAnimation(attacker, target, onComplete) {
    const originalX = attacker.sprite.x
    const targetX = target.sprite.x + (attacker.isPlayer ? 50 : -50)

    // Move to target
    this.scene.tweens.add({
      targets: attacker.sprite,
      x: targetX,
      duration: 300,
      onComplete: () => {
        // Play attack animation
        attacker.sprite.play(attacker.isPlayer ? "hero-attack-anim" : "enemy-attack-anim")

        // Return to original position
        this.scene.tweens.add({
          targets: attacker.sprite,
          x: originalX,
          duration: 300,
          onComplete: () => {
            attacker.sprite.play(attacker.isPlayer ? "hero-idle-anim" : "enemy-idle-anim")
            if (onComplete) onComplete()
          },
        })
      },
    })
  }

  playCastingAnimation(caster, skill, onComplete) {
    // Casting glow effect
    const glow = this.scene.add.circle(caster.sprite.x, caster.sprite.y, 50, 0x00ffff, 0.3)

    // Pulsing glow animation
    this.scene.tweens.add({
      targets: glow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.8,
      duration: 500,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        glow.destroy()
        if (onComplete) onComplete()
      },
    })

    // Casting pose
    caster.sprite.setTint(0x88ffff)

    this.scene.time.delayedCall(1000, () => {
      caster.sprite.clearTint()
    })
  }

  playDeathAnimation(participant) {
    // Death animation
    this.scene.tweens.add({
      targets: participant.sprite,
      alpha: 0,
      scaleY: 0.1,
      duration: 1000,
      onComplete: () => {
        participant.sprite.setVisible(false)
      },
    })
  }

  update() {
    // Update ongoing animations
  }
}

module.exports = BattleScene
