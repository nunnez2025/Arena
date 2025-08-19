/**
 * BattleScene - Phaser 3 scene for battle visualization
 * Handles all visual rendering, animations, and UI for battles
 */

const Phaser = require("phaser")

class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: "BattleScene" })

    this.battleManager = null
    this.participants = new Map()
    this.ui = null
    this.camera = null
    this.soundManager = null
    this.effectsManager = null
    this.animationQueue = []
    this.isAnimating = false
  }

  init(data) {
    this.battleData = data
    this.battleManager = data.battleManager
    this.config = data.config || {}

    console.log("[BattleScene] Initialized with battle data:", data)
  }

  preload() {
    // Load battle assets
    this.loadBattleAssets()
  }

  loadBattleAssets() {
    // Background images
    this.load.image("battle_bg_forest", "/batalha/assets/backgrounds/forest_battle.jpg")
    this.load.image("battle_bg_dungeon", "/batalha/assets/backgrounds/dungeon_battle.jpg")
    this.load.image("battle_bg_arena", "/batalha/assets/backgrounds/arena_battle.jpg")

    // Character sprites
    this.load.spritesheet("warrior", "/batalha/assets/characters/warrior.png", {
      frameWidth: 64,
      frameHeight: 64,
    })
    this.load.spritesheet("mage", "/batalha/assets/characters/mage.png", {
      frameWidth: 64,
      frameHeight: 64,
    })
    this.load.spritesheet("rogue", "/batalha/assets/characters/rogue.png", {
      frameWidth: 64,
      frameHeight: 64,
    })
    this.load.spritesheet("shadow_warrior", "/batalha/assets/enemies/shadow_warrior.png", {
      frameWidth: 64,
      frameHeight: 64,
    })

    // Effect sprites
    this.load.spritesheet("fire_effect", "/batalha/assets/effects/fire_cast.png", {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.spritesheet("heal_effect", "/batalha/assets/effects/heal_cast.png", {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.spritesheet("hit_effect", "/batalha/assets/effects/hit_impact.png", {
      frameWidth: 32,
      frameHeight: 32,
    })

    // UI elements
    this.load.image("hp_bar_bg", "/batalha/assets/ui/hp_bar_bg.png")
    this.load.image("hp_bar_fill", "/batalha/assets/ui/hp_bar_fill.png")
    this.load.image("mp_bar_bg", "/batalha/assets/ui/mp_bar_bg.png")
    this.load.image("mp_bar_fill", "/batalha/assets/ui/mp_bar_fill.png")
    this.load.image("action_button", "/batalha/assets/ui/action_button.png")

    // Status effect icons
    this.load.image("poison_icon", "/batalha/assets/ui/status/poison.png")
    this.load.image("shield_icon", "/batalha/assets/ui/status/shield.png")
    this.load.image("stun_icon", "/batalha/assets/ui/status/stun.png")

    // Audio
    this.load.audio("battle_music", "/batalha/assets/audio/battle_theme.mp3")
    this.load.audio("attack_sound", "/batalha/assets/audio/attack.wav")
    this.load.audio("magic_sound", "/batalha/assets/audio/magic_cast.wav")
    this.load.audio("heal_sound", "/batalha/assets/audio/heal.wav")
    this.load.audio("hit_sound", "/batalha/assets/audio/hit.wav")
    this.load.audio("critical_sound", "/batalha/assets/audio/critical.wav")
    this.load.audio("miss_sound", "/batalha/assets/audio/miss.wav")
  }

  create() {
    console.log("[BattleScene] Creating battle scene")

    // Setup camera
    this.camera = this.cameras.main
    this.camera.setBackgroundColor("#000000")

    // Create background
    this.createBackground()

    // Create battle UI
    this.createBattleUI()

    // Setup animations
    this.createAnimations()

    // Setup sound manager
    this.setupSoundManager()

    // Setup effects manager
    this.setupEffectsManager()

    // Setup event listeners
    this.setupEventListeners()

    // Start battle music
    this.soundManager.playBattleMusic()

    // Show VS screen transition
    this.showVSTransition()
  }

  createBackground() {
    const environment = this.config.environment || "forest"
    const bgKey = `battle_bg_${environment}`

    this.background = this.add.image(400, 300, bgKey)
    this.background.setScale(1.2)
    this.background.setAlpha(0.8)

    // Add parallax effect
    this.backgroundParallax = this.add.tileSprite(0, 0, 800, 600, bgKey)
    this.backgroundParallax.setAlpha(0.3)
    this.backgroundParallax.setScrollFactor(0.5)
  }

  createBattleUI() {
    const BattleUI = require("./BattleUI")
    this.ui = new BattleUI(this, this.battleManager)
    this.ui.create()
  }

  createAnimations() {
    // Character animations
    this.createCharacterAnimations("warrior")
    this.createCharacterAnimations("mage")
    this.createCharacterAnimations("rogue")
    this.createCharacterAnimations("shadow_warrior")

    // Effect animations
    this.anims.create({
      key: "fire_cast",
      frames: this.anims.generateFrameNumbers("fire_effect", { start: 0, end: 7 }),
      frameRate: 12,
      repeat: 0,
    })

    this.anims.create({
      key: "heal_cast",
      frames: this.anims.generateFrameNumbers("heal_effect", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 0,
    })

    this.anims.create({
      key: "hit_impact",
      frames: this.anims.generateFrameNumbers("hit_effect", { start: 0, end: 3 }),
      frameRate: 15,
      repeat: 0,
    })
  }

  createCharacterAnimations(spriteKey) {
    // Idle animation
    this.anims.create({
      key: `${spriteKey}_idle`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    })

    // Attack animation
    this.anims.create({
      key: `${spriteKey}_attack`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 4, end: 7 }),
      frameRate: 8,
      repeat: 0,
    })

    // Cast animation
    this.anims.create({
      key: `${spriteKey}_cast`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 8, end: 11 }),
      frameRate: 6,
      repeat: 0,
    })

    // Damage animation
    this.anims.create({
      key: `${spriteKey}_damage`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 12, end: 13 }),
      frameRate: 10,
      repeat: 0,
    })

    // Death animation
    this.anims.create({
      key: `${spriteKey}_death`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 14, end: 17 }),
      frameRate: 4,
      repeat: 0,
    })
  }

  setupSoundManager() {
    this.soundManager = {
      battleMusic: this.sound.add("battle_music", { loop: true, volume: 0.3 }),
      attackSound: this.sound.add("attack_sound", { volume: 0.5 }),
      magicSound: this.sound.add("magic_sound", { volume: 0.4 }),
      healSound: this.sound.add("heal_sound", { volume: 0.4 }),
      hitSound: this.sound.add("hit_sound", { volume: 0.6 }),
      criticalSound: this.sound.add("critical_sound", { volume: 0.7 }),
      missSound: this.sound.add("miss_sound", { volume: 0.3 }),

      playBattleMusic() {
        this.battleMusic.play()
      },

      stopBattleMusic() {
        this.battleMusic.stop()
      },

      playSound(soundName) {
        if (this[soundName]) {
          this[soundName].play()
        }
      },
    }
  }

  setupEffectsManager() {
    this.effectsManager = {
      scene: this,

      createDamageNumber(x, y, damage, type = "normal") {
        const color = this.getDamageColor(type)
        const fontSize = type === "critical" ? "32px" : "24px"

        const text = this.scene.add.text(x, y, damage.toString(), {
          fontSize: fontSize,
          fontFamily: "Arial Black",
          color: color,
          stroke: "#000000",
          strokeThickness: 3,
        })

        text.setOrigin(0.5)

        // Animate damage number
        this.scene.tweens.add({
          targets: text,
          y: y - 50,
          alpha: 0,
          scale: type === "critical" ? 1.5 : 1.2,
          duration: 1500,
          ease: "Power2",
          onComplete: () => {
            text.destroy()
          },
        })

        return text
      },

      getDamageColor(type) {
        const colors = {
          normal: "#ffffff",
          critical: "#ff0000",
          heal: "#00ff00",
          miss: "#888888",
          magic: "#0088ff",
        }
        return colors[type] || colors.normal
      },

      createStatusText(x, y, text, color = "#ffff00") {
        const statusText = this.scene.add.text(x, y - 30, text, {
          fontSize: "18px",
          fontFamily: "Arial",
          color: color,
          stroke: "#000000",
          strokeThickness: 2,
        })

        statusText.setOrigin(0.5)

        this.scene.tweens.add({
          targets: statusText,
          y: y - 60,
          alpha: 0,
          duration: 2000,
          ease: "Power1",
          onComplete: () => {
            statusText.destroy()
          },
        })

        return statusText
      },

      createSpellEffect(x, y, effectType) {
        const effect = this.scene.add.sprite(x, y, `${effectType}_effect`)
        effect.setScale(1.5)
        effect.play(effectType)

        effect.on("animationcomplete", () => {
          effect.destroy()
        })

        return effect
      },

      shakeCamera(intensity = 10, duration = 200) {
        this.scene.camera.shake(duration, intensity)
      },

      flashScreen(color = 0xffffff, duration = 100) {
        const flash = this.scene.add.rectangle(400, 300, 800, 600, color)
        flash.setAlpha(0.5)

        this.scene.tweens.add({
          targets: flash,
          alpha: 0,
          duration: duration,
          onComplete: () => {
            flash.destroy()
          },
        })
      },
    }
  }

  setupEventListeners() {
    // Listen for battle events from BattleManager
    this.battleManager.battleRoom.onMessage("battle-started", (data) => {
      this.onBattleStarted(data)
    })

    this.battleManager.battleRoom.onMessage("turn-started", (data) => {
      this.onTurnStarted(data)
    })

    this.battleManager.battleRoom.onMessage("action-executed", (data) => {
      this.onActionExecuted(data)
    })

    this.battleManager.battleRoom.onMessage("battle-ended", (data) => {
      this.onBattleEnded(data)
    })

    this.battleManager.battleRoom.onMessage("turn-queue-updated", (data) => {
      this.ui.updateTurnQueue(data.turnQueue, data.participants)
    })
  }

  showVSTransition() {
    // Create VS screen
    const vsScreen = this.add.container(400, 300)

    // Background
    const vsBg = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.8)
    vsScreen.add(vsBg)

    // VS Text
    const vsText = this.add.text(0, 0, "VS", {
      fontSize: "72px",
      fontFamily: "Arial Black",
      color: "#ff0000",
      stroke: "#ffffff",
      strokeThickness: 4,
    })
    vsText.setOrigin(0.5)
    vsScreen.add(vsText)

    // Animate VS screen
    vsText.setScale(0)

    this.tweens.add({
      targets: vsText,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
      onComplete: () => {
        // Hold for a moment
        this.time.delayedCall(1000, () => {
          // Fade out VS screen
          this.tweens.add({
            targets: vsScreen,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              vsScreen.destroy()
              this.startBattleIntro()
            },
          })
        })
      },
    })
  }

  startBattleIntro() {
    // Animate participants entering the battle
    const participants = Array.from(this.battleManager.state.participants.values())

    participants.forEach((participant, index) => {
      this.createParticipantSprite(participant, index)
    })

    // Start battle after intro
    this.time.delayedCall(2000, () => {
      this.battleManager.startBattle()
    })
  }

  createParticipantSprite(participant, index) {
    const isPlayer = participant.team === "player"
    const baseX = isPlayer ? 150 : 650
    const baseY = 200 + index * 80

    // Create sprite
    const sprite = this.add.sprite(baseX, baseY, participant.sprite)
    sprite.setScale(2)
    sprite.play(`${participant.sprite}_idle`)

    // Store reference
    this.participants.set(participant.id, {
      sprite: sprite,
      participant: participant,
      healthBar: null,
      manaBar: null,
      statusIcons: [],
    })

    // Create health and mana bars
    this.createParticipantBars(participant.id)

    // Animate entrance
    sprite.setAlpha(0)
    sprite.x = isPlayer ? -100 : 900

    this.tweens.add({
      targets: sprite,
      x: baseX,
      alpha: 1,
      duration: 1000,
      delay: index * 200,
      ease: "Power2",
    })
  }

  createParticipantBars(participantId) {
    const participantData = this.participants.get(participantId)
    if (!participantData) return

    const sprite = participantData.sprite
    const participant = participantData.participant

    // Health bar background
    const hpBg = this.add.image(sprite.x, sprite.y - 40, "hp_bar_bg")
    hpBg.setScale(0.5)

    // Health bar fill
    const hpFill = this.add.image(sprite.x, sprite.y - 40, "hp_bar_fill")
    hpFill.setScale(0.5)
    hpFill.setOrigin(0, 0.5)

    // Mana bar background
    const mpBg = this.add.image(sprite.x, sprite.y - 30, "mp_bar_bg")
    mpBg.setScale(0.4)

    // Mana bar fill
    const mpFill = this.add.image(sprite.x, sprite.y - 30, "mp_bar_fill")
    mpFill.setScale(0.4)
    mpFill.setOrigin(0, 0.5)

    // Store bar references
    participantData.healthBar = { bg: hpBg, fill: hpFill }
    participantData.manaBar = { bg: mpBg, fill: mpFill }

    // Update bar values
    this.updateParticipantBars(participantId)
  }

  updateParticipantBars(participantId) {
    const participantData = this.participants.get(participantId)
    if (!participantData) return

    const participant = participantData.participant
    const hpPercentage = participant.stats.hp / participant.stats.maxHp
    const mpPercentage = participant.stats.mp / participant.stats.maxMp

    // Update health bar
    if (participantData.healthBar) {
      const hpWidth = 60 * hpPercentage
      participantData.healthBar.fill.setDisplaySize(hpWidth, 8)

      // Change color based on health
      let hpColor = 0x00ff00 // Green
      if (hpPercentage < 0.5) hpColor = 0xffff00 // Yellow
      if (hpPercentage < 0.25) hpColor = 0xff0000 // Red

      participantData.healthBar.fill.setTint(hpColor)
    }

    // Update mana bar
    if (participantData.manaBar) {
      const mpWidth = 60 * mpPercentage
      participantData.manaBar.fill.setDisplaySize(mpWidth, 6)
    }
  }

  onBattleStarted(data) {
    console.log("[BattleScene] Battle started:", data)

    // Update UI
    this.ui.onBattleStarted(data)

    // Update participant data
    data.participants.forEach((participant) => {
      if (this.participants.has(participant.id)) {
        this.participants.get(participant.id).participant = participant
        this.updateParticipantBars(participant.id)
      }
    })
  }

  onTurnStarted(data) {
    console.log("[BattleScene] Turn started:", data)

    // Highlight current participant
    this.highlightCurrentParticipant(data.participantId)

    // Update UI
    this.ui.onTurnStarted(data)
  }

  onActionExecuted(data) {
    console.log("[BattleScene] Action executed:", data)

    // Add animation to queue
    this.animationQueue.push(data)

    // Process animation queue
    this.processAnimationQueue()

    // Update participant data
    if (this.participants.has(data.participantId)) {
      this.participants.get(data.participantId).participant = data.participant
      this.updateParticipantBars(data.participantId)
    }
  }

  onBattleEnded(data) {
    console.log("[BattleScene] Battle ended:", data)

    // Stop battle music
    this.soundManager.stopBattleMusic()

    // Show battle results
    this.showBattleResults(data)
  }

  highlightCurrentParticipant(participantId) {
    // Remove previous highlights
    this.participants.forEach((data, id) => {
      data.sprite.clearTint()
      data.sprite.setScale(2)
    })

    // Highlight current participant
    const currentData = this.participants.get(participantId)
    if (currentData) {
      currentData.sprite.setTint(0xffff00)
      currentData.sprite.setScale(2.2)

      // Pulse effect
      this.tweens.add({
        targets: currentData.sprite,
        scale: 2.4,
        duration: 500,
        yoyo: true,
        repeat: -1,
      })
    }
  }

  processAnimationQueue() {
    if (this.isAnimating || this.animationQueue.length === 0) {
      return
    }

    this.isAnimating = true
    const actionData = this.animationQueue.shift()

    this.playActionAnimation(actionData, () => {
      this.isAnimating = false
      this.processAnimationQueue()
    })
  }

  playActionAnimation(actionData, callback) {
    const { action, result, participantId } = actionData
    const participantData = this.participants.get(participantId)

    if (!participantData) {
      callback()
      return
    }

    const sprite = participantData.sprite

    switch (action.type) {
      case "attack":
        this.playAttackAnimation(sprite, action, result, callback)
        break

      case "skill":
        this.playSkillAnimation(sprite, action, result, callback)
        break

      case "item":
        this.playItemAnimation(sprite, action, result, callback)
        break

      case "defend":
        this.playDefendAnimation(sprite, action, result, callback)
        break

      default:
        callback()
    }
  }

  playAttackAnimation(sprite, action, result, callback) {
    const targetData = this.participants.get(action.targetId)
    if (!targetData) {
      callback()
      return
    }

    const targetSprite = targetData.sprite
    const originalX = sprite.x

    // Play attack animation
    sprite.play(`${sprite.texture.key}_attack`)
    this.soundManager.playSound("attackSound")

    // Move towards target
    this.tweens.add({
      targets: sprite,
      x: targetSprite.x - 50,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        // Hit effect
        if (result.type === "miss") {
          this.effectsManager.createStatusText(targetSprite.x, targetSprite.y, "MISS", "#888888")
          this.soundManager.playSound("missSound")
        } else {
          // Damage effect
          const damageType = result.isCritical ? "critical" : "normal"
          this.effectsManager.createDamageNumber(targetSprite.x, targetSprite.y, result.damage, damageType)

          // Hit impact
          this.effectsManager.createSpellEffect(targetSprite.x, targetSprite.y, "hit_impact")

          // Camera shake
          this.effectsManager.shakeCamera(result.isCritical ? 15 : 8)

          // Screen flash for critical
          if (result.isCritical) {
            this.effectsManager.flashScreen(0xff0000, 150)
            this.soundManager.playSound("criticalSound")
          } else {
            this.soundManager.playSound("hitSound")
          }

          // Target damage animation
          targetSprite.play(`${targetSprite.texture.key}_damage`)
          targetSprite.setTint(0xff0000)

          this.time.delayedCall(200, () => {
            targetSprite.clearTint()
          })
        }

        // Return to original position
        this.tweens.add({
          targets: sprite,
          x: originalX,
          duration: 300,
          ease: "Power2",
          onComplete: () => {
            sprite.play(`${sprite.texture.key}_idle`)
            callback()
          },
        })
      },
    })
  }

  playSkillAnimation(sprite, action, result, callback) {
    const skill = result.skill
    const targetData = this.participants.get(action.targetId)

    if (!targetData) {
      callback()
      return
    }

    const targetSprite = targetData.sprite

    // Play cast animation
    sprite.play(`${sprite.texture.key}_cast`)
    this.soundManager.playSound("magicSound")

    // Create spell effect
    this.time.delayedCall(500, () => {
      this.effectsManager.createSpellEffect(targetSprite.x, targetSprite.y, skill.animation || "fire_cast")

      // Apply effect based on skill type
      switch (skill.type) {
        case "damage":
          this.effectsManager.createDamageNumber(targetSprite.x, targetSprite.y, result.damage, "magic")
          this.effectsManager.shakeCamera(10)
          targetSprite.play(`${targetSprite.texture.key}_damage`)
          targetSprite.setTint(0x0088ff)

          this.time.delayedCall(200, () => {
            targetSprite.clearTint()
          })
          break

        case "heal":
          this.effectsManager.createDamageNumber(targetSprite.x, targetSprite.y, result.heal, "heal")
          this.soundManager.playSound("healSound")
          targetSprite.setTint(0x00ff00)

          this.time.delayedCall(500, () => {
            targetSprite.clearTint()
          })
          break

        case "status":
          this.effectsManager.createStatusText(targetSprite.x, targetSprite.y, skill.name.toUpperCase())
          break
      }

      this.time.delayedCall(1000, () => {
        sprite.play(`${sprite.texture.key}_idle`)
        callback()
      })
    })
  }

  playItemAnimation(sprite, action, result, callback) {
    // Simple item use animation
    sprite.play(`${sprite.texture.key}_cast`)

    const targetData = this.participants.get(action.targetId)
    if (targetData) {
      const targetSprite = targetData.sprite

      this.time.delayedCall(500, () => {
        if (result.heal) {
          this.effectsManager.createDamageNumber(targetSprite.x, targetSprite.y, result.heal, "heal")
          this.soundManager.playSound("healSound")
          targetSprite.setTint(0x00ff00)

          this.time.delayedCall(500, () => {
            targetSprite.clearTint()
          })
        }

        if (result.mpRestore) {
          this.effectsManager.createStatusText(targetSprite.x, targetSprite.y, `+${result.mpRestore} MP`, "#0088ff")
        }
      })
    }

    this.time.delayedCall(1000, () => {
      sprite.play(`${sprite.texture.key}_idle`)
      callback()
    })
  }

  playDefendAnimation(sprite, action, result, callback) {
    // Defend animation
    sprite.setTint(0x0088ff)
    this.effectsManager.createStatusText(sprite.x, sprite.y, "DEFENDING", "#0088ff")

    this.time.delayedCall(1000, () => {
      sprite.clearTint()
      callback()
    })
  }

  showBattleResults(data) {
    // Create results screen
    const resultsScreen = this.add.container(400, 300)

    // Background
    const resultsBg = this.add.rectangle(0, 0, 600, 400, 0x000000, 0.9)
    resultsBg.setStrokeStyle(4, 0xffffff)
    resultsScreen.add(resultsBg)

    // Title
    const title = this.add.text(0, -150, "BATTLE RESULTS", {
      fontSize: "32px",
      fontFamily: "Arial Black",
      color: "#ffffff",
    })
    title.setOrigin(0.5)
    resultsScreen.add(title)

    // Winner
    const winnerText = data.winner === "player" ? "VICTORY!" : "DEFEAT!"
    const winnerColor = data.winner === "player" ? "#00ff00" : "#ff0000"

    const winner = this.add.text(0, -100, winnerText, {
      fontSize: "48px",
      fontFamily: "Arial Black",
      color: winnerColor,
      stroke: "#000000",
      strokeThickness: 3,
    })
    winner.setOrigin(0.5)
    resultsScreen.add(winner)

    // Rewards
    if (data.rewards && data.winner === "player") {
      let rewardY = -20

      if (data.rewards.experience > 0) {
        const expText = this.add.text(0, rewardY, `Experience: +${data.rewards.experience}`, {
          fontSize: "20px",
          fontFamily: "Arial",
          color: "#ffff00",
        })
        expText.setOrigin(0.5)
        resultsScreen.add(expText)
        rewardY += 30
      }

      if (data.rewards.gold > 0) {
        const goldText = this.add.text(0, rewardY, `Gold: +${data.rewards.gold}`, {
          fontSize: "20px",
          fontFamily: "Arial",
          color: "#ffd700",
        })
        goldText.setOrigin(0.5)
        resultsScreen.add(goldText)
        rewardY += 30
      }

      if (data.rewards.items && data.rewards.items.length > 0) {
        data.rewards.items.forEach((item) => {
          const itemText = this.add.text(0, rewardY, `${item.name} x${item.quantity}`, {
            fontSize: "18px",
            fontFamily: "Arial",
            color: "#00ffff",
          })
          itemText.setOrigin(0.5)
          resultsScreen.add(itemText)
          rewardY += 25
        })
      }
    }

    // Continue button
    const continueButton = this.add.text(0, 150, "CONTINUE", {
      fontSize: "24px",
      fontFamily: "Arial Black",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 20, y: 10 },
    })
    continueButton.setOrigin(0.5)
    continueButton.setInteractive()
    continueButton.on("pointerdown", () => {
      this.exitBattle()
    })
    resultsScreen.add(continueButton)

    // Animate results screen
    resultsScreen.setAlpha(0)
    resultsScreen.setScale(0.5)

    this.tweens.add({
      targets: resultsScreen,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
    })
  }

  exitBattle() {
    // Fade out and return to overworld
    this.cameras.main.fadeOut(1000, 0, 0, 0)

    this.cameras.main.once("camerafadeoutcomplete", () => {
      // Clean up
      this.soundManager.stopBattleMusic()
      this.participants.clear()

      // Return to previous scene
      this.scene.start("OverworldScene")
    })
  }

  update() {
    // Update parallax background
    if (this.backgroundParallax) {
      this.backgroundParallax.tilePositionX += 0.5
    }

    // Update UI
    if (this.ui) {
      this.ui.update()
    }
  }
}

module.exports = BattleScene
