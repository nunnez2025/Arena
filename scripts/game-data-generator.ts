// Game Data Generator Script
// This script generates game data, character stats, and NFT metadata

interface GameCharacter {
  id: string
  name: string
  class: string
  rarity: "Common" | "Rare" | "Epic" | "Legendary"
  baseStats: {
    hp: number
    mp: number
    attack: number
    defense: number
    speed: number
    luck: number
  }
  skills: string[]
  description: string
  lore: string
}

interface GameSkill {
  id: string
  name: string
  description: string
  type: "attack" | "heal" | "buff" | "debuff" | "special"
  mpCost: number
  power: number
  accuracy: number
  effects: string[]
  animation: string
}

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
  rarity_rank: number
  collection: string
}

// Generate Characters
const generateCharacters = (): GameCharacter[] => {
  return [
    {
      id: "shadow-warrior-001",
      name: "Kael, the Shadow Warrior",
      class: "Warrior",
      rarity: "Legendary",
      baseStats: {
        hp: 150,
        mp: 80,
        attack: 95,
        defense: 85,
        speed: 70,
        luck: 60,
      },
      skills: ["shadow-strike", "void-slash", "dark-barrier", "shadow-step"],
      description: "Um guerreiro ancestral que domina as artes sombrias",
      lore: "Nascido nas profundezas do Reino das Sombras, Kael foi treinado pelos antigos mestres da guerra sombria. Sua lâmina corta através da realidade, abrindo portais para o vazio.",
    },
    {
      id: "cosmic-mage-001",
      name: "Lyra, the Cosmic Sage",
      class: "Mage",
      rarity: "Epic",
      baseStats: {
        hp: 100,
        mp: 150,
        attack: 70,
        defense: 50,
        speed: 85,
        luck: 90,
      },
      skills: ["cosmic-blast", "star-heal", "meteor-storm", "time-warp"],
      description: "Uma sábia que canaliza o poder das estrelas",
      lore: "Lyra estudou os segredos do cosmos por décadas, aprendendo a manipular a energia estelar. Suas magias podem alterar o próprio tecido do espaço-tempo.",
    },
    {
      id: "void-assassin-001",
      name: "Zara, the Void Assassin",
      class: "Assassin",
      rarity: "Rare",
      baseStats: {
        hp: 90,
        mp: 70,
        attack: 110,
        defense: 40,
        speed: 120,
        luck: 85,
      },
      skills: ["void-strike", "shadow-clone", "poison-blade", "vanish"],
      description: "Uma assassina que se move entre as sombras",
      lore: "Treinada pela guilda secreta dos Assassinos do Vazio, Zara pode se mover entre dimensões, atacando seus inimigos antes que percebam sua presença.",
    },
    {
      id: "forge-guardian-001",
      name: "Thorin, the Forge Guardian",
      class: "Guardian",
      rarity: "Epic",
      baseStats: {
        hp: 200,
        mp: 60,
        attack: 75,
        defense: 120,
        speed: 45,
        luck: 50,
      },
      skills: ["forge-hammer", "metal-shield", "earth-quake", "repair"],
      description: "Guardião ancestral das forjas sagradas",
      lore: "Thorin protege as antigas forjas onde são criados os artefatos mais poderosos. Sua força é lendária, capaz de quebrar montanhas com seu martelo.",
    },
  ]
}

// Generate Skills
const generateSkills = (): GameSkill[] => {
  return [
    {
      id: "shadow-strike",
      name: "Shadow Strike",
      description: "Um ataque devastador que emerge das sombras",
      type: "attack",
      mpCost: 15,
      power: 140,
      accuracy: 90,
      effects: ["shadow-damage", "may-cause-fear"],
      animation: "shadow-strike-anim",
    },
    {
      id: "cosmic-blast",
      name: "Cosmic Blast",
      description: "Explosão de energia cósmica concentrada",
      type: "attack",
      mpCost: 20,
      power: 160,
      accuracy: 85,
      effects: ["cosmic-damage", "may-cause-stun"],
      animation: "cosmic-blast-anim",
    },
    {
      id: "star-heal",
      name: "Star Heal",
      description: "Cura usando a energia das estrelas",
      type: "heal",
      mpCost: 12,
      power: 80,
      accuracy: 100,
      effects: ["heal-hp", "remove-debuffs"],
      animation: "star-heal-anim",
    },
    {
      id: "void-slash",
      name: "Void Slash",
      description: "Corte dimensional que ignora defesas",
      type: "attack",
      mpCost: 25,
      power: 180,
      accuracy: 75,
      effects: ["void-damage", "ignore-defense"],
      animation: "void-slash-anim",
    },
    {
      id: "meteor-storm",
      name: "Meteor Storm",
      description: "Invoca uma chuva de meteoros devastadora",
      type: "attack",
      mpCost: 35,
      power: 200,
      accuracy: 70,
      effects: ["cosmic-damage", "area-effect", "may-cause-burn"],
      animation: "meteor-storm-anim",
    },
    {
      id: "shadow-step",
      name: "Shadow Step",
      description: "Teleporte instantâneo através das sombras",
      type: "buff",
      mpCost: 10,
      power: 0,
      accuracy: 100,
      effects: ["increase-speed", "dodge-next-attack"],
      animation: "shadow-step-anim",
    },
    {
      id: "forge-hammer",
      name: "Forge Hammer",
      description: "Golpe poderoso com o martelo ancestral",
      type: "attack",
      mpCost: 18,
      power: 150,
      accuracy: 95,
      effects: ["physical-damage", "may-cause-stun"],
      animation: "forge-hammer-anim",
    },
  ]
}

// Generate NFT Metadata
const generateNFTMetadata = (character: GameCharacter): NFTMetadata => {
  const rarityRanks = {
    Common: Math.floor(Math.random() * 1000) + 3000,
    Rare: Math.floor(Math.random() * 500) + 1000,
    Epic: Math.floor(Math.random() * 200) + 100,
    Legendary: Math.floor(Math.random() * 50) + 1,
  }

  return {
    name: character.name,
    description: `${character.description}\n\n${character.lore}`,
    image: `/nft-images/${character.id}.png`,
    attributes: [
      { trait_type: "Class", value: character.class },
      { trait_type: "Rarity", value: character.rarity },
      { trait_type: "HP", value: character.baseStats.hp },
      { trait_type: "MP", value: character.baseStats.mp },
      { trait_type: "Attack", value: character.baseStats.attack },
      { trait_type: "Defense", value: character.baseStats.defense },
      { trait_type: "Speed", value: character.baseStats.speed },
      { trait_type: "Luck", value: character.baseStats.luck },
      { trait_type: "Skill Count", value: character.skills.length },
      { trait_type: "Generation", value: 1 },
    ],
    rarity_rank: rarityRanks[character.rarity],
    collection: "Game das Sombras - Shadow Arena",
  }
}

// Generate Battle Scenarios
const generateBattleScenarios = () => {
  return [
    {
      id: "shadow-realm-1",
      name: "Portal das Sombras",
      description: "Um portal se abriu no Reino das Sombras, liberando criaturas ancestrais",
      enemies: ["shadow-beast", "void-wraith"],
      background: "shadow-realm-bg",
      music: "shadow-battle-theme",
      rewards: {
        experience: 200,
        shadowTokens: 75,
        nftDropChance: 0.15,
      },
    },
    {
      id: "cosmic-arena-1",
      name: "Arena Cósmica",
      description: "Uma arena flutuante no espaço onde guerreiros testam suas habilidades",
      enemies: ["cosmic-guardian", "star-elemental"],
      background: "cosmic-arena-bg",
      music: "cosmic-battle-theme",
      rewards: {
        experience: 300,
        shadowTokens: 100,
        nftDropChance: 0.25,
      },
    },
    {
      id: "forge-depths-1",
      name: "Profundezas da Forja",
      description: "Nas profundezas das forjas ancestrais, guardiões protegem segredos antigos",
      enemies: ["forge-golem", "lava-elemental"],
      background: "forge-depths-bg",
      music: "forge-battle-theme",
      rewards: {
        experience: 250,
        shadowTokens: 90,
        nftDropChance: 0.2,
      },
    },
  ]
}

// Main execution
const main = () => {
  console.log("🎮 Generating Game Data for Shadow Arena...")

  const characters = generateCharacters()
  const skills = generateSkills()
  const battleScenarios = generateBattleScenarios()

  console.log(`✅ Generated ${characters.length} characters`)
  console.log(`✅ Generated ${skills.length} skills`)
  console.log(`✅ Generated ${battleScenarios.length} battle scenarios`)

  // Generate NFT metadata for each character
  const nftMetadata = characters.map(generateNFTMetadata)
  console.log(`✅ Generated ${nftMetadata.length} NFT metadata entries`)

  // Export data
  const gameData = {
    characters,
    skills,
    battleScenarios,
    nftMetadata,
    generatedAt: new Date().toISOString(),
    version: "1.0.0",
  }

  console.log("📊 Game Data Summary:")
  console.log(`- Total Characters: ${characters.length}`)
  console.log(`- Legendary: ${characters.filter((c) => c.rarity === "Legendary").length}`)
  console.log(`- Epic: ${characters.filter((c) => c.rarity === "Epic").length}`)
  console.log(`- Rare: ${characters.filter((c) => c.rarity === "Rare").length}`)
  console.log(`- Common: ${characters.filter((c) => c.rarity === "Common").length}`)

  return gameData
}

// Execute the script
const gameData = main()
export default gameData
