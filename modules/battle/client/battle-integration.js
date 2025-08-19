// Integration with main Reldens game client

class BattleIntegration {
  constructor(gameManager) {
    this.gameManager = gameManager
    this.battleClient = null
    this.currentBattle = null
  }

  initialize() {
    console.log("[BattleIntegration] Initializing battle integration")

    // Listen for battle invitations
    this.gameManager.client.onMessage("battle-invitation", (data) => {
      this.handleBattleInvitation(data)
    })

    // Listen for battle completion
    this.gameManager.client.onMessage("battle-completed", (data) => {
      this.handleBattleCompleted(data)
    })

    // Listen for collision events that might trigger battles
    this.gameManager.events.on("player-collision", (data) => {
      this.handlePlayerCollision(data)
    })

    // Listen for NPC interaction
    this.gameManager.events.on("npc-interaction", (data) => {
      this.handleNPCInteraction(data)
    })
  }

  handleBattleInvitation(data) {
    console.log("[BattleIntegration] Received battle invitation:", data)

    // Show battle transition screen
    this.showBattleTransition(() => {
      // Switch to battle scene
      this.gameManager.scene.start("BattleScene", {
        battleId: data.battleId,
        roomId: data.roomId,
        playerData: data.playerData,
      })
    })
  }

  handleBattleCompleted(data) {
    console.log("[BattleIntegration] Battle completed:", data)

    // Show results if not already shown
    if (data.result && !data.result.shown) {
      this.showBattleResults(data.result)
    }

    // Return to overworld
    if (data.returnToOverworld) {
      this.returnToOverworld()
    }
  }

  handlePlayerCollision(data) {
    const { player, target } = data

    // Check if collision should trigger battle
    if (this.shouldTriggerBattle(target)) {
      this.requestBattle(player, target)
    }
  }

  handleNPCInteraction(data) {
    const { player, npc } = data

    // Check if NPC interaction should trigger battle
    if (npc.hostile || npc.battleTrigger) {
      this.requestBattle(player, npc)
    }
  }

  shouldTriggerBattle(target) {
    // Determine if interaction should trigger battle
    return (
      (target.type === "npc" && (target.hostile || target.battleTrigger)) ||
      (target.type === "player" && target.pvpEnabled)
    )
  }

  requestBattle(player, target) {
    console.log("[BattleIntegration] Requesting battle:", player.id, "vs", target.id)

    // Send battle request to server
    this.gameManager.client.send("request-battle", {
      playerId: player.id,
      targetId: target.id,
      targetType: target.type,
    })
  }

  showBattleTransition(onComplete) {
    // Create transition effect
    const transitionOverlay = this.gameManager.scene.add.rectangle(400, 300, 800, 600, 0x000000, 0)

    // Fade to black
    this.gameManager.scene.tweens.add({
      targets: transitionOverlay,
      alpha: 1,
      duration: 1000,
      onComplete: () => {
        // Show "BATTLE!" text
        const battleText = this.gameManager.scene.add.text(400, 300, "BATTLE!", {
          fontSize: "48px",
          fill: "#ff0000",
          stroke: "#000000",
          strokeThickness: 4,
        })
        battleText.setOrigin(0.5)

        // Animate battle text
        this.gameManager.scene.tweens.add({
          targets: battleText,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 500,
          yoyo: true,
          onComplete: () => {
            if (onComplete) onComplete()
          },
        })
      },
    })
  }

  showBattleResults(result) {
    // Create results overlay
    const resultsContainer = this.gameManager.scene.add.container(400, 300)

    const background = this.gameManager.scene.add.rectangle(0, 0, 400, 300, 0x000000, 0.9)
    resultsContainer.add(background)

    // Title
    const title = this.gameManager.scene.add.text(0, -100, result.winner === "player" ? "VICTORY!" : "DEFEAT!", {
      fontSize: "32px",
      fill: result.winner === "player" ? "#00ff00" : "#ff0000",
    })
    title.setOrigin(0.5)
    resultsContainer.add(title)

    // Rewards
    if (result.rewards) {
      let rewardsText = ""
      if (result.rewards.experience > 0) {
        rewardsText += `Experience: +${result.rewards.experience}\n`
      }
      if (result.rewards.gold > 0) {
        rewardsText += `Gold: +${result.rewards.gold}\n`
      }
      if (result.rewards.items && result.rewards.items.length > 0) {
        rewardsText += `Items: ${result.rewards.items.map((item) => item.name).join(", ")}`
      }

      if (rewardsText) {
        const rewards = this.gameManager.scene.add.text(0, -20, rewardsText, {
          fontSize: "16px",
          fill: "#ffffff",
          align: "center",
        })
        rewards.setOrigin(0.5)
        resultsContainer.add(rewards)
      }
    }

    // Continue button
    const continueButton = this.gameManager.scene.add.text(0, 80, "Continue", {
      fontSize: "20px",
      fill: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 20, y: 10 },
    })

    continueButton.setOrigin(0.5)
    continueButton.setInteractive()

    continueButton.on("pointerdown", () => {
      resultsContainer.destroy()
      result.shown = true
    })

    resultsContainer.add(continueButton)
  }

  returnToOverworld() {
    console.log("[BattleIntegration] Returning to overworld")

    // Fade transition back to overworld
    const overlay = this.gameManager.scene.add.rectangle(400, 300, 800, 600, 0x000000, 1)

    this.gameManager.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        overlay.destroy()
      },
    })

    // Re-enable overworld controls
    this.gameManager.enablePlayerControls()

    // Resume overworld music
    this.gameManager.audioManager.resumeOverworldMusic()
  }

  cleanup() {
    if (this.battleClient) {
      this.battleClient.leave()
      this.battleClient = null
    }

    this.currentBattle = null
  }
}

module.exports = BattleIntegration
