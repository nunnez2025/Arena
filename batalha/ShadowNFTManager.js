/**
 * Shadow NFT Manager - Handles NFT Shadow creation and management
 * Generates shadows based on metadata and rarity
 */

class ShadowNFTManager {
  constructor(config) {
    this.config = config
    this.shadowDatabase = new Map()
    this.playerCollections = new Map()
    this.rarityWeights = this.calculateRarityWeights()

    console.log("[ShadowNFTManager] Initialized with config")
  }

  calculateRarityWeights() {
    const weights = {}
    let totalWeight = 0

    Object.entries(this.config.rarities).forEach(([rarity, data]) => {
      weights[rarity] = data.dropRate
      totalWeight += data.dropRate
    })

    // Normalize weights
    Object.keys(weights).forEach((rarity) => {
      weights[rarity] = weights[rarity] / totalWeight
    })

    return weights
  }

  generateRandomShadow(level = 1, forceRarity = null) {
    const rarity = forceRarity || this.selectRandomRarity()
    const shadowClass = this.selectRandomClass()
    const element = this.selectRandomElement(shadowClass)
    const affinity = this.selectRandomAffinity()

    const baseStats = this.calculateBaseStats(level, rarity, shadowClass)

    const shadow = {
      id: this.generateShadowId(),
      name: this.generateShadowName(shadowClass, element),
      element: element,
      affinity: affinity,
      class: shadowClass,
      power: baseStats.power,
      defense: baseStats.defense,
      speed: baseStats.speed,
      rarity: rarity,
      level: level,
      experience: 0,
      sprite: this.getSpriteForShadow(shadowClass, element),
      portrait: this.getPortraitForShadow(shadowClass, element),
      metadata: {
        createdAt: Date.now(),
        generation: 1,
        traits: this.generateTraits(shadowClass, element, rarity),
        backstory: this.generateBackstory(shadowClass, element, affinity),
      },
    }

    this.shadowDatabase.set(shadow.id, shadow)

    console.log(`[ShadowNFTManager] Generated ${rarity} ${shadowClass}: ${shadow.name}`)

    return shadow
  }

  selectRandomRarity() {
    const random = Math.random()
    let cumulativeWeight = 0

    for (const [rarity, weight] of Object.entries(this.rarityWeights)) {
      cumulativeWeight += weight
      if (random <= cumulativeWeight) {
        return rarity
      }
    }

    return "Common" // Fallback
  }

  selectRandomClass() {
    const classes = Object.keys(this.config.shadowClasses)
    return classes[Math.floor(Math.random() * classes.length)]
  }

  selectRandomElement(shadowClass) {
    const classConfig = this.config.shadowClasses[shadowClass]
    const preferredElements = classConfig.preferredElements

    // 70% chance to get preferred element, 30% chance for any element
    if (Math.random() < 0.7 && preferredElements.length > 0) {
      return preferredElements[Math.floor(Math.random() * preferredElements.length)]
    } else {
      const allElements = Object.keys(this.config.elements)
      return allElements[Math.floor(Math.random() * allElements.length)]
    }
  }

  selectRandomAffinity() {
    const affinities = Object.keys(this.config.affinities)
    return affinities[Math.floor(Math.random() * affinities.length)]
  }

  calculateBaseStats(level, rarity, shadowClass) {
    const rarityConfig = this.config.rarities[rarity]
    const classConfig = this.config.shadowClasses[shadowClass]

    const basePower = 50 + level * 10
    const baseDefense = 30 + level * 5
    const baseSpeed = 20 + level * 3

    return {
      power: Math.floor(basePower * rarityConfig.statMultiplier * classConfig.baseStats.powerMultiplier),
      defense: Math.floor(baseDefense * rarityConfig.statMultiplier * classConfig.baseStats.defenseMultiplier),
      speed: Math.floor(baseSpeed * rarityConfig.statMultiplier * classConfig.baseStats.speedMultiplier),
    }
  }

  generateShadowId() {
    return `shadow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  generateShadowName(shadowClass, element) {
    const classNames = {
      Invoker: ["Mystic", "Oracle", "Seer", "Sage", "Warlock"],
      Warrior: ["Knight", "Champion", "Blade", "Guardian", "Sentinel"],
      Assassin: ["Shadow", "Phantom", "Wraith", "Specter", "Shade"],
      Guardian: ["Protector", "Defender", "Warden", "Shield", "Bastion"],
      Berserker: ["Fury", "Rage", "Storm", "Chaos", "Wild"],
      Technomancer: ["Cyber", "Digital", "Neural", "Matrix", "Code"],
    }

    const elementPrefixes = {
      Dark: ["Shadow", "Void", "Night", "Abyss", "Eclipse"],
      Light: ["Radiant", "Bright", "Solar", "Divine", "Pure"],
      Fire: ["Flame", "Inferno", "Blaze", "Ember", "Pyre"],
      Water: ["Frost", "Tide", "Storm", "Ice", "Flow"],
      Tech: ["Cyber", "Neural", "Digital", "Quantum", "Binary"],
      Chaos: ["Wild", "Primal", "Twisted", "Mad", "Corrupt"],
    }

    const className = classNames[shadowClass][Math.floor(Math.random() * classNames[shadowClass].length)]
    const elementPrefix = elementPrefixes[element][Math.floor(Math.random() * elementPrefixes[element].length)]

    return `${elementPrefix} ${className}`
  }

  generateTraits(shadowClass, element, rarity) {
    const traits = []

    // Class trait
    traits.push({
      trait_type: "Class",
      value: shadowClass,
    })

    // Element trait
    traits.push({
      trait_type: "Element",
      value: element,
    })

    // Rarity trait
    traits.push({
      trait_type: "Rarity",
      value: rarity,
    })

    // Random special traits based on rarity
    const specialTraits = this.getSpecialTraits(rarity)
    traits.push(...specialTraits)

    return traits
  }

  getSpecialTraits(rarity) {
    const traitPools = {
      Common: [
        { trait_type: "Battle Style", value: "Standard" },
        { trait_type: "Origin", value: "Mortal Realm" },
      ],
      Rare: [
        { trait_type: "Battle Style", value: "Enhanced" },
        { trait_type: "Origin", value: "Shadow Realm" },
        { trait_type: "Special Ability", value: "Elemental Mastery" },
      ],
      Epic: [
        { trait_type: "Battle Style", value: "Superior" },
        { trait_type: "Origin", value: "Cyber Dimension" },
        { trait_type: "Special Ability", value: "Affinity Resonance" },
        { trait_type: "Aura", value: "Mystical" },
      ],
      Legendary: [
        { trait_type: "Battle Style", value: "Legendary" },
        { trait_type: "Origin", value: "Primordial Void" },
        { trait_type: "Special Ability", value: "Reality Manipulation" },
        { trait_type: "Aura", value: "Divine" },
        { trait_type: "Title", value: "Ancient One" },
      ],
    }

    return traitPools[rarity] || traitPools.Common
  }

  generateBackstory(shadowClass, element, affinity) {
    const backstories = {
      Invoker: {
        Dark: "A master of forbidden knowledge who delved too deep into the shadow arts.",
        Light: "A divine scholar who channels pure celestial energy through ancient rituals.",
        Fire: "A flame-touched mystic who learned to bind infernal powers to their will.",
        Water: "An oceanic sage who commands the depths and tidal forces.",
        Tech: "A cyber-mystic who merged ancient magic with quantum technology.",
        Chaos: "A reality-bender who embraces the unpredictable nature of existence.",
      },
      Warrior: {
        Dark: "A fallen knight who found strength in embracing the darkness within.",
        Light: "A holy champion blessed by celestial forces to fight evil.",
        Fire: "A battle-hardened fighter forged in the flames of countless wars.",
        Water: "A fluid combatant who adapts like water to overcome any obstacle.",
        Tech: "A cyber-enhanced soldier equipped with advanced combat systems.",
        Chaos: "A wild fighter who thrives in the unpredictability of battle.",
      },
      Assassin: {
        Dark: "A shadow-walker who moves unseen through the darkest corners of reality.",
        Light: "A divine executioner who eliminates evil with righteous precision.",
        Fire: "A flame-dancer who strikes with the speed and heat of wildfire.",
        Water: "A mist-walker who flows like water to reach any target.",
        Tech: "A digital phantom who infiltrates both cyber and physical realms.",
        Chaos: "An unpredictable killer whose methods defy all logic and reason.",
      },
    }

    const classStories = backstories[shadowClass] || backstories.Warrior
    return classStories[element] || "A mysterious entity from the shadow realm."
  }

  getSpriteForShadow(shadowClass, element) {
    const spriteMap = {
      Invoker: {
        Dark: "shadow_priest",
        Light: "light_oracle",
        Fire: "flame_mystic",
        Water: "frost_sage",
        Tech: "cyber_mage",
        Chaos: "chaos_warlock",
      },
      Warrior: {
        Dark: "shadow_knight",
        Light: "paladin",
        Fire: "flame_warrior",
        Water: "tide_guardian",
        Tech: "cyber_soldier",
        Chaos: "chaos_berserker",
      },
      Assassin: {
        Dark: "shadow_assassin",
        Light: "light_blade",
        Fire: "flame_dancer",
        Water: "mist_walker",
        Tech: "cyber_ninja",
        Chaos: "chaos_stalker",
      },
    }

    return spriteMap[shadowClass]?.[element] || "shadow_priest"
  }

  getPortraitForShadow(shadowClass, element) {
    return `${this.getSpriteForShadow(shadowClass, element)}_portrait`
  }

  createPlayerCollection(playerId, startingShadows = 3) {
    const collection = []

    // Generate starting shadows
    for (let i = 0; i < startingShadows; i++) {
      const shadow = this.generateRandomShadow(1)
      collection.push(shadow)
    }

    this.playerCollections.set(playerId, collection)

    console.log(`[ShadowNFTManager] Created collection for player ${playerId} with ${startingShadows} shadows`)

    return collection
  }

  getPlayerCollection(playerId) {
    return this.playerCollections.get(playerId) || []
  }

  addShadowToPlayer(playerId, shadow) {
    const collection = this.getPlayerCollection(playerId)
    collection.push(shadow)
    this.playerCollections.set(playerId, collection)

    console.log(`[ShadowNFTManager] Added shadow ${shadow.name} to player ${playerId}`)
  }

  getShadowById(shadowId) {
    return this.shadowDatabase.get(shadowId)
  }

  generateBattleTeam(playerId, teamSize = 3) {
    const collection = this.getPlayerCollection(playerId)

    if (collection.length === 0) {
      // Generate temporary team if no collection exists
      const tempTeam = []
      for (let i = 0; i < teamSize; i++) {
        tempTeam.push(this.generateRandomShadow(1))
      }
      return tempTeam
    }

    // Select best shadows from collection
    const sortedShadows = collection
      .filter((shadow) => shadow.level > 0)
      .sort((a, b) => b.power + b.defense + b.speed - (a.power + a.defense + a.speed))

    return sortedShadows.slice(0, teamSize)
  }

  generateEnemyTeam(playerLevel = 1, teamSize = 3) {
    const enemyTeam = []

    for (let i = 0; i < teamSize; i++) {
      // Generate enemies slightly above or below player level
      const enemyLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1)
      const enemy = this.generateRandomShadow(enemyLevel)
      enemyTeam.push(enemy)
    }

    console.log(`[ShadowNFTManager] Generated enemy team of ${teamSize} shadows`)

    return enemyTeam
  }

  applyAffinityBonus(shadow, masterAffinity) {
    if (shadow.affinity === masterAffinity) {
      const bonusConfig = this.config.affinities[masterAffinity].bonuses

      // Apply power bonus
      if (bonusConfig.powerBonus) {
        shadow.power = Math.floor(shadow.power * (1 + bonusConfig.powerBonus))
      }

      // Apply defense bonus
      if (bonusConfig.defenseBonus) {
        shadow.defense = Math.floor(shadow.defense * (1 + bonusConfig.defenseBonus))
      }

      // Apply speed bonus
      if (bonusConfig.speedBonus) {
        shadow.speed = Math.floor(shadow.speed * (1 + bonusConfig.speedBonus))
      }

      console.log(`[ShadowNFTManager] Applied ${masterAffinity} affinity bonus to ${shadow.name}`)
    }

    return shadow
  }

  exportShadowMetadata(shadowId) {
    const shadow = this.getShadowById(shadowId)
    if (!shadow) return null

    return {
      name: shadow.name,
      description: shadow.metadata.backstory,
      image: `https://shadows.game/api/shadow/${shadowId}/image`,
      external_url: `https://shadows.game/shadow/${shadowId}`,
      attributes: shadow.metadata.traits,
      properties: {
        class: shadow.class,
        element: shadow.element,
        affinity: shadow.affinity,
        rarity: shadow.rarity,
        level: shadow.level,
        power: shadow.power,
        defense: shadow.defense,
        speed: shadow.speed,
        generation: shadow.metadata.generation,
        created_at: shadow.metadata.createdAt,
      },
    }
  }

  validateShadowForBattle(shadow) {
    return shadow && shadow.power > 0 && shadow.defense > 0 && shadow.speed > 0 && shadow.level > 0
  }

  getCollectionStats(playerId) {
    const collection = this.getPlayerCollection(playerId)

    const stats = {
      totalShadows: collection.length,
      rarityBreakdown: {},
      classBreakdown: {},
      elementBreakdown: {},
      averageLevel: 0,
      totalPower: 0,
    }

    if (collection.length === 0) return stats

    let totalLevel = 0

    collection.forEach((shadow) => {
      // Rarity breakdown
      stats.rarityBreakdown[shadow.rarity] = (stats.rarityBreakdown[shadow.rarity] || 0) + 1

      // Class breakdown
      stats.classBreakdown[shadow.class] = (stats.classBreakdown[shadow.class] || 0) + 1

      // Element breakdown
      stats.elementBreakdown[shadow.element] = (stats.elementBreakdown[shadow.element] || 0) + 1

      // Totals
      totalLevel += shadow.level
      stats.totalPower += shadow.power
    })

    stats.averageLevel = Math.round(totalLevel / collection.length)

    return stats
  }
}

module.exports = ShadowNFTManager
