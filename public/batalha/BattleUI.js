/**
 * BattleUI - User interface for battle system
 * Handles menus, HUD, turn queue, and player interactions
 */

class BattleUI {
  constructor(scene, battleManager) {
    this.scene = scene
    this.battleManager = battleManager
    this.isPlayerTurn = false
    this.currentPlayer = null

    // UI Elements
    this.actionMenu = null
    this.skillMenu = null
    this.itemMenu = null
    this.targetMenu = null
    this.turnQueue = null
    this.battleLog = null
    this.turnTimer = null

    // UI State
    this.currentMenu = null
    this.selectedAction = null
    this.availableTargets = []
  }

  create() {
    console.log("[BattleUI] Creating battle UI")

    this.createActionMenu()
    this.createSkillMenu()
    this.createItemMenu()
    this.createTargetMenu()
    this.createTurnQueue()
    this.createBattleLog()
    this.createTurnTimer()

    // Initially hide all menus
    this.hideAllMenus()
  }

  createActionMenu() {
    this.actionMenu = this.scene.add.container(400, 500)

    // Background
    const bg = this.scene.add.rectangle(0, 0, 400, 100, 0x000000, 0.8)
    bg.setStrokeStyle(2, 0xffffff)
    this.actionMenu.add(bg)

    // Action buttons
    const actions = [
      { key: "attack", text: "ATTACK", x: -150 },
      { key: "skill", text: "MAGIC", x: -50 },
      { key: "item", text: "ITEM", x: 50 },
      { key: "defend", text: "DEFEND", x: 150 },
    ]

    this.actionButtons = {}

    actions.forEach((action) => {
      const button = this.createButton(action.x, 0, action.text, () => {
        this.onActionSelected(action.key)
      })

      this.actionMenu.add(button.container)
      this.actionButtons[action.key] = button
    })

    this.actionMenu.setVisible(false)
  }

  createSkillMenu() {
    this.skillMenu = this.scene.add.container(200, 300)

    // Background
    const bg = this.scene.add.rectangle(0, 0, 300, 400, 0x000000, 0.9)
    bg.setStrokeStyle(2, 0x0088ff)
    this.skillMenu.add(bg)

    // Title
    const title = this.scene.add.text(0, -180, "MAGIC SKILLS", {
      fontSize: "20px",
      fontFamily: "Arial Black",
      color: "#0088ff",
    })
    title.setOrigin(0.5)
    this.skillMenu.add(title)

    // Skill list container
    this.skillList = this.scene.add.container(0, -100)
    this.skillMenu.add(this.skillList)

    // Back button
    const backButton = this.createButton(0, 160, "BACK", () => {
      this.showActionMenu()
    })
    this.skillMenu.add(backButton.container)

    this.skillMenu.setVisible(false)
  }

  createItemMenu() {
    this.itemMenu = this.scene.add.container(200, 300)

    // Background
    const bg = this.scene.add.rectangle(0, 0, 300, 400, 0x000000, 0.9)
    bg.setStrokeStyle(2, 0x00ff00)
    this.itemMenu.add(bg)

    // Title
    const title = this.scene.add.text(0, -180, "ITEMS", {
      fontSize: "20px",
      fontFamily: "Arial Black",
      color: "#00ff00",
    })
    title.setOrigin(0.5)
    this.itemMenu.add(title)

    // Item list container
    this.itemList = this.scene.add.container(0, -100)
    this.itemMenu.add(this.itemList)

    // Back button
    const backButton = this.createButton(0, 160, "BACK", () => {
      this.showActionMenu()
    })
    this.itemMenu.add(backButton.container)

    this.itemMenu.setVisible(false)
  }

  createTargetMenu() {
    this.targetMenu = this.scene.add.container(600, 300)

    // Background
    const bg = this.scene.add.rectangle(0, 0, 200, 300, 0x000000, 0.9)
    bg.setStrokeStyle(2, 0xff0000)
    this.targetMenu.add(bg)

    // Title
    const title = this.scene.add.text(0, -130, "SELECT TARGET", {
      fontSize: "16px",
      fontFamily: "Arial Black",
      color: "#ff0000",
    })
    title.setOrigin(0.5)
    this.targetMenu.add(title)

    // Target list container
    this.targetList = this.scene.add.container(0, -50)
    this.targetMenu.add(this.targetList)

    // Back button
    const backButton = this.createButton(0, 120, "BACK", () => {
      this.showPreviousMenu()
    })
    this.targetMenu.add(backButton.container)

    this.targetMenu.setVisible(false)
  }

  createTurnQueue() {
    this.turnQueue = this.scene.add.container(50, 50)

    // Background
    const bg = this.scene.add.rectangle(0, 0, 200, 60, 0x000000, 0.7)
    bg.setStrokeStyle(2, 0xffff00)
    this.turnQueue.add(bg)

    // Title
    const title = this.scene.add.text(0, -20, "TURN ORDER", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffff00",
    })
    title.setOrigin(0.5)
    this.turnQueue.add(title)

    // Turn list container
    this.turnList = this.scene.add.container(0, 10)
    this.turnQueue.add(this.turnList)
  }

  createBattleLog() {
    this.battleLog = this.scene.add.container(50, 450)

    // Background
    const bg = this.scene.add.rectangle(0, 0, 300, 120, 0x000000, 0.7)
    bg.setStrokeStyle(1, 0x888888)
    this.battleLog.add(bg)

    // Title
    const title = this.scene.add.text(-140, -50, "BATTLE LOG", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#888888",
    })
    this.battleLog.add(title)

    // Log text container
    this.logText = this.scene.add.container(-140, -30)
    this.battleLog.add(this.logText)

    this.logEntries = []
  }

  createTurnTimer() {
    this.turnTimer = this.scene.add.container(700, 50)

    // Background circle
    this.timerCircle = this.scene.add.circle(0, 0, 30, 0x000000, 0.8)
    this.timerCircle.setStrokeStyle(3, 0xffffff)
    this.turnTimer.add(this.timerCircle)

    // Timer text
    this.timerText = this.scene.add.text(0, 0, "30", {
      fontSize: "20px",
      fontFamily: "Arial Black",
      color: "#ffffff",
    })
    this.timerText.setOrigin(0.5)
    this.turnTimer.add(this.timerText)

    // Timer arc (visual countdown)
    this.timerArc = this.scene.add.graphics()
    this.turnTimer.add(this.timerArc)

    this.turnTimer.setVisible(false)
  }

  createButton(x, y, text, callback) {
    const container = this.scene.add.container(x, y)

    // Button background
    const bg = this.scene.add.rectangle(0, 0, 80, 30, 0x333333)
    bg.setStrokeStyle(1, 0xffffff)
    bg.setInteractive()
    container.add(bg)

    // Button text
    const buttonText = this.scene.add.text(0, 0, text, {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
    })
    buttonText.setOrigin(0.5)
    container.add(buttonText)

    // Hover effects
    bg.on("pointerover", () => {
      bg.setFillStyle(0x555555)
      buttonText.setColor("#ffff00")
    })

    bg.on("pointerout", () => {
      bg.setFillStyle(0x333333)
      buttonText.setColor("#ffffff")
    })

    bg.on("pointerdown", callback)

    return { container, bg, text: buttonText }
  }

  onActionSelected(actionType) {
    this.selectedAction = { type: actionType }

    switch (actionType) {
      case "attack":
        this.showTargetMenu("enemy")
        break

      case "skill":
        this.showSkillMenu()
        break

      case "item":
        this.showItemMenu()
        break

      case "defend":
        this.executeAction({
          type: "defend",
          targetId: this.currentPlayer.id,
        })
        break
    }
  }

  showActionMenu() {
    this.hideAllMenus()
    this.actionMenu.setVisible(true)
    this.currentMenu = "action"
  }

  showSkillMenu() {
    if (!this.currentPlayer) return

    this.hideAllMenus()
    this.skillMenu.setVisible(true)
    this.currentMenu = "skill"

    // Clear previous skill list
    this.skillList.removeAll(true)

    // Add available skills
    const availableSkills = this.currentPlayer.skills.filter((skillId) => {
      const skill = this.battleManager.config.skills[skillId]
      return skill && this.currentPlayer.stats.mp >= skill.mpCost
    })

    availableSkills.forEach((skillId, index) => {
      const skill = this.battleManager.config.skills[skillId]
      const y = index * 30 - 50

      const skillButton = this.createButton(0, y, `${skill.name} (${skill.mpCost} MP)`, () => {
        this.selectedAction.skillId = skillId
        this.showTargetMenu(skill.targetType)
      })

      this.skillList.add(skillButton.container)
    })

    if (availableSkills.length === 0) {
      const noSkillsText = this.scene.add.text(0, -50, "No skills available", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#888888",
      })
      noSkillsText.setOrigin(0.5)
      this.skillList.add(noSkillsText)
    }
  }

  showItemMenu() {
    if (!this.currentPlayer) return

    this.hideAllMenus()
    this.itemMenu.setVisible(true)
    this.currentMenu = "item"

    // Clear previous item list
    this.itemList.removeAll(true)

    // Add available items
    const availableItems = this.currentPlayer.items.filter((item) => item.quantity > 0 && item.usableInBattle)

    availableItems.forEach((item, index) => {
      const y = index * 30 - 50

      const itemButton = this.createButton(0, y, `${item.name} (${item.quantity})`, () => {
        this.selectedAction.itemId = item.id
        this.showTargetMenu(item.targetType || "single_ally")
      })

      this.itemList.add(itemButton.container)
    })

    if (availableItems.length === 0) {
      const noItemsText = this.scene.add.text(0, -50, "No items available", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#888888",
      })
      noItemsText.setOrigin(0.5)
      this.itemList.add(noItemsText)
    }
  }

  showTargetMenu(targetType) {
    this.hideAllMenus()
    this.targetMenu.setVisible(true)
    this.currentMenu = "target"

    // Clear previous target list
    this.targetList.removeAll(true)

    // Get available targets based on target type
    this.availableTargets = this.getAvailableTargets(targetType)

    this.availableTargets.forEach((target, index) => {
      const y = index * 25 - 40

      const targetButton = this.createButton(0, y, target.name, () => {
        this.selectedAction.targetId = target.id
        this.executeAction(this.selectedAction)
      })

      this.targetList.add(targetButton.container)
    })

    if (this.availableTargets.length === 0) {
      const noTargetsText = this.scene.add.text(0, -40, "No valid targets", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#888888",
      })
      noTargetsText.setOrigin(0.5)
      this.targetList.add(noTargetsText)
    }
  }

  getAvailableTargets(targetType) {
    const participants = Array.from(this.battleManager.state.participants.values())

    switch (targetType) {
      case "single_enemy":
      case "enemy":
        return participants.filter((p) => p.team !== this.currentPlayer.team && p.isAlive)

      case "single_ally":
      case "ally":
        return participants.filter((p) => p.team === this.currentPlayer.team && p.isAlive)

      case "self":
        return [this.currentPlayer]

      case "all_enemies":
        return participants.filter((p) => p.team !== this.currentPlayer.team && p.isAlive)

      case "all_allies":
        return participants.filter((p) => p.team === this.currentPlayer.team && p.isAlive)

      default:
        return participants.filter((p) => p.isAlive)
    }
  }

  executeAction(action) {
    console.log("[BattleUI] Executing action:", action)

    // Send action to battle manager
    this.battleManager.executeAction(this.currentPlayer.id, action)

    // Hide menus
    this.hideAllMenus()
    this.isPlayerTurn = false
    this.currentPlayer = null
  }

  showPreviousMenu() {
    switch (this.currentMenu) {
      case "target":
        if (this.selectedAction.type === "skill") {
          this.showSkillMenu()
        } else if (this.selectedAction.type === "item") {
          this.showItemMenu()
        } else {
          this.showActionMenu()
        }
        break

      case "skill":
      case "item":
        this.showActionMenu()
        break

      default:
        this.hideAllMenus()
    }
  }

  hideAllMenus() {
    this.actionMenu.setVisible(false)
    this.skillMenu.setVisible(false)
    this.itemMenu.setVisible(false)
    this.targetMenu.setVisible(false)
    this.currentMenu = null
  }

  onBattleStarted(data) {
    console.log("[BattleUI] Battle started, updating UI")

    // Update turn queue
    this.updateTurnQueue(data.turnQueue, data.participants)

    // Clear battle log
    this.clearBattleLog()
    this.addToBattleLog("Battle begins!")
  }

  onTurnStarted(data) {
    console.log("[BattleUI] Turn started for:", data.participant.name)

    // Update current player
    if (data.participant.type === "player" && data.participant.isActive) {
      this.isPlayerTurn = true
      this.currentPlayer = data.participant
      this.showActionMenu()
      this.startTurnTimer(30) // 30 seconds
    } else {
      this.isPlayerTurn = false
      this.currentPlayer = null
      this.hideAllMenus()
      this.hideTurnTimer()
    }

    // Add to battle log
    this.addToBattleLog(`${data.participant.name}'s turn`)
  }

  updateTurnQueue(turnQueue, participants) {
    // Clear previous turn list
    this.turnList.removeAll(true)

    // Add participants to turn queue display
    turnQueue.slice(0, 5).forEach((participantId, index) => {
      const participant = participants.find((p) => p.id === participantId)
      if (participant) {
        const x = index * 35 - 70

        // Create participant icon
        const icon = this.scene.add.circle(x, 0, 8, participant.team === "player" ? 0x0088ff : 0xff0000)
        this.turnList.add(icon)

        // Add name text
        const nameText = this.scene.add.text(x, 15, participant.name.substr(0, 6), {
          fontSize: "8px",
          fontFamily: "Arial",
          color: "#ffffff",
        })
        nameText.setOrigin(0.5)
        this.turnList.add(nameText)
      }
    })
  }

  startTurnTimer(seconds) {
    this.turnTimer.setVisible(true)

    let timeLeft = seconds
    this.timerText.setText(timeLeft.toString())

    // Update timer every second
    const timerInterval = setInterval(() => {
      timeLeft--
      this.timerText.setText(timeLeft.toString())

      // Update visual arc
      const percentage = timeLeft / seconds
      this.updateTimerArc(percentage)

      // Change color as time runs out
      if (timeLeft <= 10) {
        this.timerText.setColor("#ff0000")
        this.timerCircle.setStrokeStyle(3, 0xff0000)
      } else if (timeLeft <= 20) {
        this.timerText.setColor("#ffff00")
        this.timerCircle.setStrokeStyle(3, 0xffff00)
      }

      if (timeLeft <= 0) {
        clearInterval(timerInterval)
        this.hideTurnTimer()
      }
    }, 1000)

    // Store interval reference for cleanup
    this.currentTimerInterval = timerInterval
  }

  updateTimerArc(percentage) {
    this.timerArc.clear()
    this.timerArc.lineStyle(4, 0x00ff00)
    this.timerArc.beginPath()
    this.timerArc.arc(0, 0, 25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * percentage, false)
    this.timerArc.strokePath()
  }

  hideTurnTimer() {
    this.turnTimer.setVisible(false)

    if (this.currentTimerInterval) {
      clearInterval(this.currentTimerInterval)
      this.currentTimerInterval = null
    }

    // Reset timer appearance
    this.timerText.setColor("#ffffff")
    this.timerCircle.setStrokeStyle(3, 0xffffff)
    this.timerArc.clear()
  }

  addToBattleLog(message) {
    // Add new log entry
    this.logEntries.push(message)

    // Keep only last 5 entries
    if (this.logEntries.length > 5) {
      this.logEntries.shift()
    }

    // Update log display
    this.updateBattleLogDisplay()
  }

  updateBattleLogDisplay() {
    // Clear previous log text
    this.logText.removeAll(true)

    // Add log entries
    this.logEntries.forEach((entry, index) => {
      const y = index * 15
      const alpha = 1 - index * 0.15 // Fade older entries

      const logEntry = this.scene.add.text(0, y, entry, {
        fontSize: "10px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      logEntry.setAlpha(alpha)
      this.logText.add(logEntry)
    })
  }

  clearBattleLog() {
    this.logEntries = []
    this.updateBattleLogDisplay()
  }

  update() {
    // Update UI elements if needed
    if (this.isPlayerTurn && this.currentPlayer) {
      // Update action button states based on current player state
      this.updateActionButtonStates()
    }
  }

  updateActionButtonStates() {
    if (!this.currentPlayer) return

    // Update skill button based on MP
    const hasUsableSkills = this.currentPlayer.skills.some((skillId) => {
      const skill = this.battleManager.config.skills[skillId]
      return skill && this.currentPlayer.stats.mp >= skill.mpCost
    })

    if (this.actionButtons.skill) {
      const skillButton = this.actionButtons.skill
      if (hasUsableSkills) {
        skillButton.bg.setFillStyle(0x333333)
        skillButton.text.setColor("#ffffff")
      } else {
        skillButton.bg.setFillStyle(0x666666)
        skillButton.text.setColor("#888888")
      }
    }

    // Update item button based on available items
    const hasUsableItems = this.currentPlayer.items.some((item) => item.quantity > 0 && item.usableInBattle)

    if (this.actionButtons.item) {
      const itemButton = this.actionButtons.item
      if (hasUsableItems) {
        itemButton.bg.setFillStyle(0x333333)
        itemButton.text.setColor("#ffffff")
      } else {
        itemButton.bg.setFillStyle(0x666666)
        itemButton.text.setColor("#888888")
      }
    }
  }
}

module.exports = BattleUI
