/**
 * Shadow Battle Scene - Cyber-occult NFT battle arena
 * Inspired by Yu-Gi-Oh! Master Duel with Pokemon-style UI
 */

const Phaser = require("phaser")

class ShadowBattleScene extends Phaser.Scene {
  constructor() {
    super({ key: "ShadowBattleScene" })

    this.shadowEntities = new Map()
    this.battleUI = null
    this.masterAffinity = null
    this.battleArena = null
    this.effectsManager = null
    this.aiController = null
    this.isAutomatic = true
  }

  init(data) {
    this.battleData = data
    this.playerShadows = data.playerShadows || []
    this.enemyShadows = data.enemyShadows || []
    this.masterAffinity = data.masterAffinity || "Chaos"
    this.playerName = data.playerName || "Shadow Master"
    this.enemyName = data.enemyName || "Rival Summoner"

    console.log(
      "[ShadowBattleScene] Initialized with shadows:",
      this.playerShadows.length,
      "vs",
      this.enemyShadows.length,
    )
  }

  preload() {
    this.loadShadowAssets()
  }

  loadShadowAssets() {
    // Cyber-occult backgrounds
    this.load.image("cyber_arena", "/batalha/assets/backgrounds/cyber_arena.jpg")
    this.load.image("occult_portal", "/batalha/assets/backgrounds/occult_portal.jpg")
    this.load.image("shadow_realm", "/batalha/assets/backgrounds/shadow_realm.jpg")

    // Shadow NFT sprites
    this.load.spritesheet("shadow_priest", "/batalha/assets/shadows/shadow_priest.png", {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet("cyber_demon", "/batalha/assets/shadows/cyber_demon.png", {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet("tech_wraith", "/batalha/assets/shadows/tech_wraith.png", {
      frameWidth: 128,
      frameHeight: 128,
    })
    this.load.spritesheet("chaos_knight", "/batalha/assets/shadows/chaos_knight.png", {
      frameWidth: 128,
      frameHeight: 128,
    })

    // UI elements with cyber-occult theme
    this.load.image("battle_frame", "/batalha/assets/ui/cyber_battle_frame.png")
    this.load.image("shadow_portrait_frame", "/batalha/assets/ui/shadow_portrait_frame.png")
    this.load.image("hp_bar_cyber", "/batalha/assets/ui/hp_bar_cyber.png")
    this.load.image("hp_fill_cyber", "/batalha/assets/ui/hp_fill_cyber.png")
    this.load.image("affinity_icon_chaos", "/batalha/assets/ui/affinity_chaos.png")
    this.load.image("affinity_icon_light", "/batalha/assets/ui/affinity_light.png")
    this.load.image("affinity_icon_tech", "/batalha/assets/ui/affinity_tech.png")
    this.load.image("affinity_icon_fire", "/batalha/assets/ui/affinity_fire.png")

    // Rarity gems
    this.load.image("rarity_common", "/batalha/assets/ui/rarity_common.png")
    this.load.image("rarity_rare", "/batalha/assets/ui/rarity_rare.png")
    this.load.image("rarity_epic", "/batalha/assets/ui/rarity_epic.png")
    this.load.image("rarity_legendary", "/batalha/assets/ui/rarity_legendary.png")

    // Effect sprites
    this.load.spritesheet("cyber_explosion", "/batalha/assets/effects/cyber_explosion.png", {
      frameWidth: 64,
      frameHeight: 64,
    })
    this.load.spritesheet("shadow_burst", "/batalha/assets/effects/shadow_burst.png", {
      frameWidth: 64,
      frameHeight: 64,
    })
    this.load.spritesheet("tech_lightning", "/batalha/assets/effects/tech_lightning.png", {
      frameWidth: 64,
      frameHeight: 64,
    })

    // Audio
    this.load.audio("cyber_battle_theme", "/batalha/assets/audio/cyber_battle_theme.mp3")
    this.load.audio("shadow_summon", "/batalha/assets/audio/shadow_summon.wav")
    this.load.audio("cyber_attack", "/batalha/assets/audio/cyber_attack.wav")
    this.load.audio("occult_spell", "/batalha/assets/audio/occult_spell.wav")
  }

  create() {
    console.log("[ShadowBattleScene] Creating cyber-occult battle arena")

    // Setup camera with cyber effects
    this.cameras.main.setBackgroundColor("#0a0a0a")

    // Create battle arena
    this.createBattleArena()

    // Create UI system
    this.createBattleUI()

    // Setup effects manager
    this.setupEffectsManager()

    // Setup AI controller
    this.setupAIController()

    // Create shadow entities
    this.createShadowEntities()

    // Setup animations
    this.createShadowAnimations()

    // Start battle music
    this.sound.play("cyber_battle_theme", { loop: true, volume: 0.4 })

    // Begin automatic battle
    this.startAutomaticBattle()
  }

  createBattleArena() {
    // Main arena background
    this.arenaBackground = this.add.image(400, 300, "cyber_arena")
    this.arenaBackground.setScale(1.2)
    this.arenaBackground.setAlpha(0.8)

    // Animated portal effects
    this.portalLeft = this.add.image(200, 350, "occult_portal")
    this.portalLeft.setScale(0.6)
    this.portalLeft.setAlpha(0.7)

    this.portalRight = this.add.image(600, 350, "occult_portal")
    this.portalRight.setScale(0.6)
    this.portalRight.setAlpha(0.7)
    this.portalRight.setFlipX(true)

    // Animate portals
    this.tweens.add({
      targets: [this.portalLeft, this.portalRight],
      rotation: Math.PI * 2,
      duration: 10000,
      repeat: -1,
    })

    // Battle platforms
    this.playerPlatform = this.add.ellipse(200, 400, 120, 40, 0x333333, 0.6)
    this.playerPlatform.setStrokeStyle(2, 0x00ffff)

    this.enemyPlatform = this.add.ellipse(600, 400, 120, 40, 0x333333, 0.6)
    this.enemyPlatform.setStrokeStyle(2, 0xff0066)

    // Cyber grid overlay
    this.createCyberGrid()
  }

  createCyberGrid() {
    const graphics = this.add.graphics()
    graphics.lineStyle(1, 0x00ffff, 0.3)

    // Vertical lines
    for (let x = 0; x < 800; x += 40) {
      graphics.moveTo(x, 0)
      graphics.lineTo(x, 600)
    }

    // Horizontal lines
    for (let y = 0; y < 600; y += 40) {
      graphics.moveTo(0, y)
      graphics.lineTo(800, y)
    }

    graphics.strokePath()

    // Animate grid
    this.tweens.add({
      targets: graphics,
      alpha: 0.1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
    })
  }

  createBattleUI() {
    // Main battle frame (inspired by Pokemon UI)
    this.battleFrame = this.add.image(400, 300, "battle_frame")
    this.battleFrame.setScale(1.0)
    this.battleFrame.setDepth(100)

    // Player name banner (top)
    this.createPlayerBanner()

    // Action text box (center)
    this.createActionTextBox()

    // Shadow info panels (bottom)
    this.createShadowInfoPanels()

    // Side portrait panels
    this.createPortraitPanels()

    // Master affinity display
    this.createAffinityDisplay()
  }

  createPlayerBanner() {
    // Player banner background
    const bannerBg = this.add.rectangle(400, 50, 400, 60, 0x1a1a2e, 0.9)
    bannerBg.setStrokeStyle(2, 0x00ffff)
    bannerBg.setDepth(101)

    // Player name
    this.playerNameText = this.add.text(400, 40, this.playerName, {
      fontSize: "20px",
      fontFamily: "Arial Black",
      color: "#00ffff",
      stroke: "#000000",
      strokeThickness: 2,
    })
    this.playerNameText.setOrigin(0.5)
    this.playerNameText.setDepth(102)

    // VS indicator
    this.vsText = this.add.text(400, 60, "VS", {
      fontSize: "16px",
      fontFamily: "Arial Black",
      color: "#ff0066",
    })
    this.vsText.setOrigin(0.5)
    this.vsText.setDepth(102)

    // Enemy name
    this.enemyNameText = this.add.text(400, 80, this.enemyName, {
      fontSize: "18px",
      fontFamily: "Arial",
      color: "#ff6600",
      stroke: "#000000",
      strokeThickness: 1,
    })
    this.enemyNameText.setOrigin(0.5)
    this.enemyNameText.setDepth(102)
  }

  createActionTextBox() {
    // Action text background
    this.actionTextBg = this.add.rectangle(400, 200, 500, 80, 0x0f0f23, 0.95)
    this.actionTextBg.setStrokeStyle(2, 0xffff00)
    this.actionTextBg.setDepth(101)

    // Action text
    this.actionText = this.add.text(400, 200, "Battle begins! Shadows prepare for combat...", {
      fontSize: "16px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 480 },
    })
    this.actionText.setOrigin(0.5)
    this.actionText.setDepth(102)
  }

  createShadowInfoPanels() {
    // Player shadow info (bottom left)
    this.playerShadowInfo = this.add.container(150, 500)
    this.playerShadowInfo.setDepth(101)

    const playerInfoBg = this.add.rectangle(0, 0, 250, 80, 0x1a1a2e, 0.9)
    playerInfoBg.setStrokeStyle(2, 0x00ffff)
    this.playerShadowInfo.add(playerInfoBg)

    // Enemy shadow info (bottom right)
    this.enemyShadowInfo = this.add.container(650, 500)
    this.enemyShadowInfo.setDepth(101)

    const enemyInfoBg = this.add.rectangle(0, 0, 250, 80, 0x1a1a2e, 0.9)
    enemyInfoBg.setStrokeStyle(2, 0xff0066)
    this.enemyShadowInfo.add(enemyInfoBg)
  }

  createPortraitPanels() {
    // Left side portraits (player shadows)
    this.playerPortraits = this.add.container(50, 300)
    this.playerPortraits.setDepth(100)

    // Right side portraits (enemy shadows)
    this.enemyPortraits = this.add.container(750, 300)
    this.enemyPortraits.setDepth(100)
  }

  createAffinityDisplay() {
    // Master affinity icon
    const affinityIcon = this.add.image(50, 50, `affinity_icon_${this.masterAffinity.toLowerCase()}`)
    affinityIcon.setScale(0.8)
    affinityIcon.setDepth(102)

    // Affinity text
    const affinityText = this.add.text(50, 80, `${this.masterAffinity} Master`, {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffff00",
    })
    affinityText.setOrigin(0.5)
    affinityText.setDepth(102)

    // Animate affinity icon
    this.tweens.add({
      targets: affinityIcon,
      scale: 0.9,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    })
  }

  setupEffectsManager() {
    this.effectsManager = {
      scene: this,

      createShadowSummonEffect(x, y, element) {
        const effect = this.scene.add.sprite(x, y, "shadow_burst")
        effect.setScale(2)
        effect.setTint(this.getElementColor(element))
        effect.play("shadow_summon_anim")
        effect.setDepth(50)

        effect.on("animationcomplete", () => {
          effect.destroy()
        })

        return effect
      },

      createAttackEffect(x, y, attackType, element) {
        let effectKey = "cyber_explosion"

        switch (attackType) {
          case "tech":
            effectKey = "tech_lightning"
            break
          case "shadow":
            effectKey = "shadow_burst"
            break
          default:
            effectKey = "cyber_explosion"
        }

        const effect = this.scene.add.sprite(x, y, effectKey)
        effect.setScale(1.5)
        effect.setTint(this.getElementColor(element))
        effect.play(`${effectKey}_anim`)
        effect.setDepth(60)

        effect.on("animationcomplete", () => {
          effect.destroy()
        })

        return effect
      },

      createDamageNumber(x, y, damage, isCritical = false) {
        const color = isCritical ? "#ff0000" : "#ffffff"
        const fontSize = isCritical ? "28px" : "20px"

        const text = this.scene.add.text(x, y, damage.toString(), {
          fontSize: fontSize,
          fontFamily: "Arial Black",
          color: color,
          stroke: "#000000",
          strokeThickness: 3,
        })

        text.setOrigin(0.5)
        text.setDepth(70)

        this.scene.tweens.add({
          targets: text,
          y: y - 60,
          alpha: 0,
          scale: isCritical ? 1.5 : 1.2,
          duration: 1500,
          ease: "Power2",
          onComplete: () => {
            text.destroy()
          },
        })

        return text
      },

      createAffinityBuff(x, y, affinity) {
        const buffEffect = this.scene.add.sprite(x, y, "shadow_burst")
        buffEffect.setScale(1.2)
        buffEffect.setTint(this.getAffinityColor(affinity))
        buffEffect.setAlpha(0.7)
        buffEffect.play("buff_anim")
        buffEffect.setDepth(55)

        this.scene.tweens.add({
          targets: buffEffect,
          scale: 1.5,
          alpha: 0,
          duration: 2000,
          onComplete: () => {
            buffEffect.destroy()
          },
        })

        return buffEffect
      },

      getElementColor(element) {
        const colors = {
          Dark: 0x6600cc,
          Light: 0xffff00,
          Fire: 0xff3300,
          Water: 0x0066ff,
          Tech: 0x00ffff,
          Chaos: 0xff0066,
        }
        return colors[element] || 0xffffff
      },

      getAffinityColor(affinity) {
        const colors = {
          Chaos: 0xff0066,
          Light: 0xffff00,
          Tech: 0x00ffff,
          Fire: 0xff3300,
        }
        return colors[affinity] || 0xffffff
      },

      shakeCamera(intensity = 8) {
        this.scene.cameras.main.shake(300, intensity)
      },

      flashScreen(color = 0xffffff, duration = 150) {
        const flash = this.scene.add.rectangle(400, 300, 800, 600, color)
        flash.setAlpha(0.3)
        flash.setDepth(200)

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

  setupAIController() {
    const ShadowAIController = require("./ShadowAIController")
    this.aiController = new ShadowAIController(this)
  }

  createShadowEntities() {
    // Create player shadows
    this.playerShadows.forEach((shadowData, index) => {
      const shadow = this.createShadowEntity(shadowData, "player", index)
      this.shadowEntities.set(shadow.id, shadow)
    })

    // Create enemy shadows
    this.enemyShadows.forEach((shadowData, index) => {
      const shadow = this.createShadowEntity(shadowData, "enemy", index)
      this.shadowEntities.set(shadow.id, shadow)
    })
  }

  createShadowEntity(shadowData, team, index) {
    const isPlayer = team === "player"
    const x = isPlayer ? 200 : 600
    const y = 350 + index * 20

    // Create shadow sprite
    const sprite = this.add.sprite(x, y, shadowData.sprite || "shadow_priest")
    sprite.setScale(isPlayer ? 1.2 : -1.2, 1.2) // Flip enemy sprites
    sprite.setDepth(40)

    // Apply affinity buff visual if applicable
    if (this.hasAffinityMatch(shadowData, this.masterAffinity)) {
      sprite.setTint(0x00ff00) // Green tint for affinity match
      this.effectsManager.createAffinityBuff(x, y, this.masterAffinity)
    }

    // Create shadow entity object
    const shadow = {
      id: shadowData.id,
      name: shadowData.name,
      element: shadowData.element,
      affinity: shadowData.affinity,
      class: shadowData.class,
      power: shadowData.power,
      defense: shadowData.defense,
      speed: shadowData.speed,
      rarity: shadowData.rarity,
      team: team,
      sprite: sprite,
      currentHp: shadowData.power, // Use power as HP
      maxHp: shadowData.power,
      isAlive: true,
      buffs: [],
      position: { x, y },
    }

    // Apply master affinity buff
    if (this.hasAffinityMatch(shadowData, this.masterAffinity)) {
      shadow.power = Math.floor(shadow.power * 1.15) // 15% power boost
      shadow.buffs.push({
        type: "affinity_boost",
        value: 0.15,
        source: this.masterAffinity,
      })
    }

    // Create portrait in side panel
    this.createShadowPortrait(shadow, index)

    // Create info display
    this.updateShadowInfo(shadow)

    console.log(`[ShadowBattleScene] Created shadow: ${shadow.name} (${shadow.team})`)

    return shadow
  }

  createShadowPortrait(shadow, index) {
    const isPlayer = shadow.team === "player"
    const container = isPlayer ? this.playerPortraits : this.enemyPortraits
    const y = index * 60 - 100

    // Portrait frame
    const frame = this.add.image(0, y, "shadow_portrait_frame")
    frame.setScale(0.6)
    container.add(frame)

    // Portrait image (mini version of sprite)
    const portrait = this.add.image(0, y, shadow.sprite.texture.key)
    portrait.setScale(0.3)
    container.add(portrait)

    // Rarity gem
    const rarityGem = this.add.image(15, y - 15, `rarity_${shadow.rarity.toLowerCase()}`)
    rarityGem.setScale(0.4)
    container.add(rarityGem)

    // HP bar
    const hpBarBg = this.add.rectangle(0, y + 20, 40, 6, 0x333333)
    const hpBarFill = this.add.rectangle(-18, y + 20, 36, 4, 0x00ff00)
    hpBarFill.setOrigin(0, 0.5)
    container.add(hpBarBg)
    container.add(hpBarFill)

    // Store references
    shadow.portraitElements = {
      frame,
      portrait,
      rarityGem,
      hpBarBg,
      hpBarFill,
    }
  }

  updateShadowInfo(shadow) {
    const isPlayer = shadow.team === "player"
    const container = isPlayer ? this.playerShadowInfo : this.enemyShadowInfo

    // Clear previous info
    container.removeAll(true)

    // Background
    const bg = this.add.rectangle(0, 0, 250, 80, 0x1a1a2e, 0.9)
    bg.setStrokeStyle(2, isPlayer ? 0x00ffff : 0xff0066)
    container.add(bg)

    // Shadow name and level
    const nameText = this.add.text(0, -25, shadow.name, {
      fontSize: "16px",
      fontFamily: "Arial Black",
      color: "#ffffff",
    })
    nameText.setOrigin(0.5)
    container.add(nameText)

    // HP display
    const hpText = this.add.text(-80, -5, `HP ${shadow.currentHp}/${shadow.maxHp}`, {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#00ff00",
    })
    container.add(hpText)

    // Power display
    const powerText = this.add.text(80, -5, `PWR ${shadow.power}`, {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ff6600",
    })
    powerText.setOrigin(1, 0)
    container.add(powerText)

    // HP bar
    const hpBarBg = this.add.rectangle(0, 15, 200, 12, 0x333333)
    const hpPercentage = shadow.currentHp / shadow.maxHp
    const hpBarFill = this.add.rectangle(-98, 15, 196 * hpPercentage, 8, 0x00ff00)
    hpBarFill.setOrigin(0, 0.5)

    container.add(hpBarBg)
    container.add(hpBarFill)

    // Element and affinity icons
    const elementIcon = this.add.text(-100, 30, shadow.element, {
      fontSize: "10px",
      fontFamily: "Arial",
      color: "#ffff00",
    })
    container.add(elementIcon)

    const affinityIcon = this.add.text(100, 30, shadow.affinity, {
      fontSize: "10px",
      fontFamily: "Arial",
      color: "#ff00ff",
    })
    affinityIcon.setOrigin(1, 0)
    container.add(affinityIcon)
  }

  createShadowAnimations() {
    // Shadow summon animation
    this.anims.create({
      key: "shadow_summon_anim",
      frames: this.anims.generateFrameNumbers("shadow_burst", { start: 0, end: 7 }),
      frameRate: 12,
      repeat: 0,
    })

    // Attack animations for different shadow types
    this.anims.create({
      key: "cyber_explosion_anim",
      frames: this.anims.generateFrameNumbers("cyber_explosion", { start: 0, end: 5 }),
      frameRate: 15,
      repeat: 0,
    })

    this.anims.create({
      key: "tech_lightning_anim",
      frames: this.anims.generateFrameNumbers("tech_lightning", { start: 0, end: 6 }),
      frameRate: 18,
      repeat: 0,
    })

    this.anims.create({
      key: "shadow_burst_anim",
      frames: this.anims.generateFrameNumbers("shadow_burst", { start: 0, end: 4 }),
      frameRate: 10,
      repeat: 0,
    })

    // Buff animation
    this.anims.create({
      key: "buff_anim",
      frames: this.anims.generateFrameNumbers("shadow_burst", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 2,
    })

    // Shadow idle animations
    Array.from(this.shadowEntities.values()).forEach((shadow) => {
      shadow.sprite.play(`${shadow.sprite.texture.key}_idle`)
    })
  }

  hasAffinityMatch(shadowData, masterAffinity) {
    return shadowData.affinity === masterAffinity
  }

  async startAutomaticBattle() {
    console.log("[ShadowBattleScene] Starting automatic battle")

    this.updateActionText("Battle begins! Shadows prepare for combat...")

    // Show summon effects
    await this.showSummonEffects()

    // Wait a moment
    await this.delay(2000)

    // Start battle loop
    this.battleLoop()
  }

  async showSummonEffects() {
    const allShadows = Array.from(this.shadowEntities.values())

    for (const shadow of allShadows) {
      this.effectsManager.createShadowSummonEffect(shadow.position.x, shadow.position.y, shadow.element)
      this.sound.play("shadow_summon", { volume: 0.3 })
      await this.delay(500)
    }
  }

  async battleLoop() {
    while (this.isBattleActive()) {
      // Get all alive shadows sorted by speed
      const aliveShadows = Array.from(this.shadowEntities.values())
        .filter((shadow) => shadow.isAlive)
        .sort((a, b) => b.speed - a.speed)

      for (const shadow of aliveShadows) {
        if (!shadow.isAlive || !this.isBattleActive()) break

        await this.processShadowTurn(shadow)
        await this.delay(1500) // Pause between actions
      }

      // Check for battle end
      if (!this.isBattleActive()) {
        this.endBattle()
        break
      }

      await this.delay(1000) // Pause between rounds
    }
  }

  async processShadowTurn(shadow) {
    console.log(`[ShadowBattleScene] Processing turn for: ${shadow.name}`)

    // Get AI decision
    const action = await this.aiController.getAction(shadow, this.getBattleState())

    if (!action) {
      console.warn(`[ShadowBattleScene] No action received for ${shadow.name}`)
      return
    }

    // Execute action
    await this.executeAction(shadow, action)
  }

  async executeAction(attacker, action) {
    const target = this.shadowEntities.get(action.targetId)

    if (!target || !target.isAlive) {
      console.warn(`[ShadowBattleScene] Invalid target for action`)
      return
    }

    this.updateActionText(`${attacker.name} attacks ${target.name}!`)

    // Calculate damage
    const damage = this.calculateDamage(attacker, target, action)
    const isCritical = Math.random() < 0.15 // 15% critical chance

    const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage

    // Apply damage
    target.currentHp = Math.max(0, target.currentHp - finalDamage)

    // Visual effects
    this.effectsManager.createAttackEffect(target.position.x, target.position.y, action.type, attacker.element)
    this.effectsManager.createDamageNumber(target.position.x, target.position.y - 30, finalDamage, isCritical)

    // Sound effects
    this.sound.play("cyber_attack", { volume: 0.4 })

    if (isCritical) {
      this.effectsManager.shakeCamera(12)
      this.effectsManager.flashScreen(0xff0000, 200)
    } else {
      this.effectsManager.shakeCamera(6)
    }

    // Damage animation on target
    this.tweens.add({
      targets: target.sprite,
      x: target.position.x + (Math.random() - 0.5) * 20,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        target.sprite.x = target.position.x
      },
    })

    // Flash target red
    target.sprite.setTint(0xff0000)
    this.time.delayedCall(200, () => {
      if (target.isAlive) {
        target.sprite.clearTint()
        if (this.hasAffinityMatch(target, this.masterAffinity)) {
          target.sprite.setTint(0x00ff00)
        }
      }
    })

    // Update UI
    this.updateShadowInfo(target)
    this.updatePortraitHP(target)

    // Check if target dies
    if (target.currentHp <= 0) {
      await this.handleShadowDeath(target)
    }

    console.log(`[ShadowBattleScene] ${attacker.name} dealt ${finalDamage} damage to ${target.name}`)
  }

  calculateDamage(attacker, target, action) {
    let baseDamage = attacker.power - target.defense * 0.3

    // Element effectiveness (simplified)
    const effectiveness = this.getElementEffectiveness(attacker.element, target.element)
    baseDamage *= effectiveness

    // Random variance
    baseDamage *= 0.8 + Math.random() * 0.4

    // Minimum damage
    return Math.max(1, Math.floor(baseDamage))
  }

  getElementEffectiveness(attackerElement, targetElement) {
    const effectiveness = {
      Fire: { Water: 0.5, Tech: 1.5, Dark: 1.0, Light: 1.0, Chaos: 1.2 },
      Water: { Fire: 1.5, Tech: 0.5, Dark: 1.0, Light: 1.0, Chaos: 1.0 },
      Tech: { Water: 1.5, Fire: 0.5, Dark: 1.2, Light: 0.8, Chaos: 1.0 },
      Dark: { Light: 1.5, Tech: 0.8, Fire: 1.0, Water: 1.0, Chaos: 1.3 },
      Light: { Dark: 1.5, Chaos: 1.2, Fire: 1.0, Water: 1.0, Tech: 1.2 },
      Chaos: { Light: 0.8, Dark: 0.7, Fire: 0.8, Water: 1.0, Tech: 1.0 },
    }

    return effectiveness[attackerElement]?.[targetElement] || 1.0
  }

  async handleShadowDeath(shadow) {
    console.log(`[ShadowBattleScene] Shadow defeated: ${shadow.name}`)

    shadow.isAlive = false
    shadow.sprite.setTint(0x666666)
    shadow.sprite.setAlpha(0.5)

    // Death animation
    this.tweens.add({
      targets: shadow.sprite,
      scale: shadow.sprite.scaleX * 0.8,
      alpha: 0.3,
      duration: 1000,
    })

    // Update portrait
    if (shadow.portraitElements) {
      shadow.portraitElements.portrait.setTint(0x666666)
      shadow.portraitElements.hpBarFill.setVisible(false)
    }

    this.updateActionText(`${shadow.name} has been defeated!`)

    await this.delay(1500)
  }

  updatePortraitHP(shadow) {
    if (!shadow.portraitElements) return

    const hpPercentage = shadow.currentHp / shadow.maxHp
    const maxWidth = 36

    shadow.portraitElements.hpBarFill.setDisplaySize(maxWidth * hpPercentage, 4)

    // Change color based on HP
    let color = 0x00ff00 // Green
    if (hpPercentage < 0.5) color = 0xffff00 // Yellow
    if (hpPercentage < 0.25) color = 0xff0000 // Red

    shadow.portraitElements.hpBarFill.setFillStyle(color)
  }

  getBattleState() {
    return {
      playerShadows: Array.from(this.shadowEntities.values()).filter((s) => s.team === "player"),
      enemyShadows: Array.from(this.shadowEntities.values()).filter((s) => s.team === "enemy"),
      masterAffinity: this.masterAffinity,
      turn: this.currentTurn || 0,
    }
  }

  isBattleActive() {
    const playerAlive = Array.from(this.shadowEntities.values()).some((s) => s.team === "player" && s.isAlive)
    const enemyAlive = Array.from(this.shadowEntities.values()).some((s) => s.team === "enemy" && s.isAlive)

    return playerAlive && enemyAlive
  }

  endBattle() {
    const playerAlive = Array.from(this.shadowEntities.values()).some((s) => s.team === "player" && s.isAlive)
    const winner = playerAlive ? "player" : "enemy"

    console.log(`[ShadowBattleScene] Battle ended. Winner: ${winner}`)

    this.updateActionText(winner === "player" ? "Victory! Your shadows prevail!" : "Defeat! Enemy shadows triumph!")

    // Stop battle music
    this.sound.stopAll()

    // Show results after delay
    this.time.delayedCall(3000, () => {
      this.showBattleResults(winner)
    })
  }

  showBattleResults(winner) {
    // Create results overlay
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8)
    overlay.setDepth(300)

    // Results text
    const resultText = winner === "player" ? "VICTORY!" : "DEFEAT!"
    const resultColor = winner === "player" ? "#00ff00" : "#ff0000"

    const results = this.add.text(400, 250, resultText, {
      fontSize: "48px",
      fontFamily: "Arial Black",
      color: resultColor,
      stroke: "#000000",
      strokeThickness: 4,
    })
    results.setOrigin(0.5)
    results.setDepth(301)

    // Continue button
    const continueBtn = this.add.text(400, 350, "CONTINUE", {
      fontSize: "24px",
      fontFamily: "Arial Black",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 20, y: 10 },
    })
    continueBtn.setOrigin(0.5)
    continueBtn.setDepth(301)
    continueBtn.setInteractive()

    continueBtn.on("pointerdown", () => {
      this.scene.start("MainMenuScene")
    })

    // Animate results
    results.setScale(0)
    this.tweens.add({
      targets: results,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
    })
  }

  updateActionText(text) {
    if (this.actionText) {
      this.actionText.setText(text)
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  update() {
    // Update any continuous effects or animations
  }
}

module.exports = ShadowBattleScene
