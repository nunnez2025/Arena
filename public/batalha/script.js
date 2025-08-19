// Battle Game - Robust Implementation aligned with index.html
(function () {
  const debugEl = document.getElementById('debug')
  const logDebug = (msg) => {
    if (debugEl) debugEl.textContent = String(msg)
    // Also mirror to console for deeper debugging
    console.debug('[DEBUG]', msg)
  }

  class AudioManager {
    constructor() {
      this.bgMusic = document.getElementById('bgMusic')
      this.sfx = {
        attack: document.getElementById('sfxAttack'),
        magic: document.getElementById('sfxMagic'),
        hit: document.getElementById('sfxHit'),
        heal: document.getElementById('sfxHeal'),
      }
      this.musicVolume = 0.3
      this.sfxVolume = 0.7
    }
    async init() {
      try {
        if (this.bgMusic) this.bgMusic.volume = this.musicVolume
        Object.values(this.sfx).forEach((a) => a && (a.volume = this.sfxVolume))
      } catch (e) {
        console.warn('Audio init failed', e)
      }
    }
    playMusic() {
      if (!this.bgMusic) return
      if (!this.bgMusic.paused) return
      this.bgMusic.play().catch((e) => console.warn('bgMusic play failed', e))
    }
    stopMusic() {
      if (!this.bgMusic) return
      this.bgMusic.pause()
      this.bgMusic.currentTime = 0
    }
    playSFX(key) {
      const el = this.sfx[key]
      if (!el) return
      el.currentTime = 0
      el.play().catch(() => {})
    }
  }

  class EffectsManager {
    constructor() {
      this.screenFlashEl = document.getElementById('screenFlash')
      this.cameraShakeEl = document.getElementById('cameraShake')
      this.lightningLayer = document.querySelector('.lightning-layer')
      this.particlesLayer = document.querySelector('.particle-layer')
    }
    screenFlash(duration = 200) {
      if (!this.screenFlashEl) return
      this.screenFlashEl.style.animation = `screenFlash ${duration}ms ease-out`
      setTimeout(() => (this.screenFlashEl.style.animation = ''), duration)
    }
    cameraShake(duration = 500) {
      if (!this.cameraShakeEl) return
      this.cameraShakeEl.style.animation = `cameraShake ${duration}ms ease-out`
      setTimeout(() => (this.cameraShakeEl.style.animation = ''), duration)
    }
    magicEffect(type) {
      if (type === 'lightning' && this.lightningLayer) {
        this.lightningLayer.style.animation = 'lightning 300ms ease-out'
        setTimeout(() => (this.lightningLayer.style.animation = ''), 300)
      }
      if (this.particlesLayer) {
        for (let i = 0; i < 8; i++) {
          const p = document.createElement('div')
          p.style.position = 'absolute'
          p.style.width = '6px'
          p.style.height = '6px'
          p.style.borderRadius = '50%'
          p.style.left = Math.random() * 100 + '%'
          p.style.top = Math.random() * 100 + '%'
          p.style.background = type === 'heal' ? '#2ed573' : '#ff6b6b'
          p.style.animation = 'damageFloat 1s ease-out forwards'
          this.particlesLayer.appendChild(p)
          setTimeout(() => p.remove(), 1000)
        }
      }
    }
    healEffect() {
      this.magicEffect('heal')
    }
  }

  class AnimationManager {
    constructor() {
      this.heroCanvas = document.getElementById('heroCanvas')
      this.enemyCanvas = document.getElementById('enemyCanvas')
    }
    async playAttackAnimation(attacker) {
      const isHero = attacker.__tag === 'hero'
      const canvas = isHero ? this.heroCanvas : this.enemyCanvas
      if (!canvas) return
      const original = canvas.style.transform || ''
      canvas.style.transition = 'transform 0.2s ease-out'
      canvas.style.transform = original + (isHero ? ' translateX(50px)' : ' translateX(-50px)')
      await new Promise((r) => setTimeout(r, 200))
      canvas.style.transform = original
      await new Promise((r) => setTimeout(r, 200))
      canvas.style.transition = ''
    }
    async playCastAnimation(caster) {
      const isHero = caster.__tag === 'hero'
      const canvas = isHero ? this.heroCanvas : this.enemyCanvas
      if (!canvas) return
      const original = canvas.style.filter || ''
      canvas.style.transition = 'filter 0.4s ease-in-out'
      canvas.style.filter = original + ' drop-shadow(0 0 16px #9c27b0)'
      await new Promise((r) => setTimeout(r, 600))
      canvas.style.filter = original
      canvas.style.transition = ''
    }
    async playDefendAnimation(character) {
      const isHero = character.__tag === 'hero'
      const canvas = isHero ? this.heroCanvas : this.enemyCanvas
      if (!canvas) return
      const original = canvas.style.filter || ''
      canvas.style.transition = 'filter 0.3s ease-in-out'
      canvas.style.filter = original + ' drop-shadow(0 0 12px #3f51b5)'
      await new Promise((r) => setTimeout(r, 400))
      canvas.style.filter = original
      canvas.style.transition = ''
    }
  }

  class BattleGame {
    constructor() {
      this.gameState = 'loading'
      this.turnQueue = []
      this.currentTurn = 0
      this.battleLog = []

      this.audio = new AudioManager()
      this.effects = new EffectsManager()
      this.anim = new AnimationManager()

      this.hero = {
        __tag: 'hero',
        name: 'Guerreiro das Sombras',
        maxHp: 100,
        hp: 100,
        maxMp: 50,
        mp: 50,
        attack: 25,
        defense: 15,
        speed: 20,
        statusEffects: [],
      }
      this.enemy = {
        __tag: 'enemy',
        name: 'Dragão Sombrio',
        maxHp: 150,
        hp: 150,
        maxMp: 30,
        mp: 30,
        attack: 30,
        defense: 20,
        speed: 15,
        statusEffects: [],
      }

      this.spells = {
        fireball: { name: 'Bola de Fogo', cost: 10, damage: 35, type: 'damage' },
        heal: { name: 'Cura', cost: 8, heal: 40, type: 'heal' },
        lightning: { name: 'Raio', cost: 15, damage: 45, type: 'damage' },
      }

      this.init().catch((e) => {
        console.error('[BattleGame] init failed', e)
        logDebug('init error (see console)')
      })
    }

    async init() {
      await this.loadAssets()
      this.setupEventListeners()
      this.initializeCanvases()
      await this.startGame()
    }

    async loadAssets() {
      const loadingProgress = document.querySelector('.loading-progress')
      for (let i = 0; i <= 100; i += 10) {
        if (loadingProgress) loadingProgress.style.width = i + '%'
        await new Promise((r) => setTimeout(r, 40))
      }
      await this.audio.init()
    }

    setupEventListeners() {
      // Buttons
      document.querySelectorAll('.action-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const action = e.currentTarget.dataset.action
          this.handleAction(action)
        })
      })
      document.querySelectorAll('.magic-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const spell = e.currentTarget.dataset.spell
          const cost = Number.parseInt(e.currentTarget.dataset.cost)
          this.handleMagic(spell, cost)
        })
      })
      const backBtn = document.querySelector('.back-btn')
      if (backBtn) backBtn.addEventListener('click', () => this.showActionMenu())
      const cont = document.getElementById('continueBtn')
      if (cont) cont.addEventListener('click', () => (window.location.href = '../index.html'))
      const retry = document.getElementById('retryBtn')
      if (retry) retry.addEventListener('click', () => this.restartBattle())

      // Keyboard
      const preventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar']
      this.inputBuffer = []
      this.keysDown = new Set()

      const updateDebug = () => {
        if (!debugEl) return
        const turn = this.turnQueue[this.currentTurn]?.type ?? '-'
        debugEl.textContent = `state:${this.gameState} turn:${turn} keys:[${[...this.keysDown].join(',')}] buffer:${this.inputBuffer.join(',')}`
      }

      document.addEventListener('keydown', (e) => {
        if (preventKeys.includes(e.key)) e.preventDefault()
        this.keysDown.add(e.key)
        updateDebug()
        if (this.gameState === 'battle' && this.turnQueue[this.currentTurn]?.type === 'hero') {
          switch (e.key) {
            case 'Enter':
              this.inputBuffer.push('confirm')
              break
            case 'Escape':
              this.inputBuffer.push('cancel')
              break
            case ' ': // space
              this.inputBuffer.push('special')
              break
            case 'ArrowUp':
            case 'w':
            case 'W':
              this.inputBuffer.push('up')
              break
            case 'ArrowDown':
            case 's':
            case 'S':
              this.inputBuffer.push('down')
              break
            case 'ArrowLeft':
            case 'a':
            case 'A':
              this.inputBuffer.push('left')
              break
            case 'ArrowRight':
            case 'd':
            case 'D':
              this.inputBuffer.push('right')
              break
            case '1':
            case '2':
            case '3':
            case '4':
              this.handleKeyboard(e)
              break
          }
        }
      })
      document.addEventListener('keyup', (e) => {
        this.keysDown.delete(e.key)
        updateDebug()
      })

      // Buffer consumer for menu navigation
      setInterval(() => {
        if (this.inputBuffer.length === 0) return
        const cmd = this.inputBuffer.shift()
        if (this.gameState !== 'battle' || this.turnQueue[this.currentTurn]?.type !== 'hero') return
        const actionMenu = document.getElementById('actionMenu')
        const magicMenu = document.getElementById('magicMenu')
        const visibleButtons = (menu) => Array.from(menu.querySelectorAll('button:not(.disabled)'))
        const setFocus = (btn, list) => {
          list.forEach((b) => b.classList.remove('focused'))
          if (btn) btn.classList.add('focused')
        }
        if (actionMenu && !actionMenu.classList.contains('hidden')) {
          const buttons = visibleButtons(actionMenu)
          let index = buttons.findIndex((b) => b.classList.contains('focused'))
          if (index < 0) index = 0
          if (cmd === 'right' || cmd === 'down') index = Math.min(buttons.length - 1, index + 1)
          if (cmd === 'left' || cmd === 'up') index = Math.max(0, index - 1)
          setFocus(buttons[index], buttons)
          if (cmd === 'confirm') buttons[index]?.click()
        } else if (magicMenu && !magicMenu.classList.contains('hidden')) {
          const buttons = visibleButtons(magicMenu)
          let index = buttons.findIndex((b) => b.classList.contains('focused'))
          if (index < 0) index = 0
          if (cmd === 'down') index = Math.min(buttons.length - 1, index + 1)
          if (cmd === 'up') index = Math.max(0, index - 1)
          if (cmd === 'cancel') this.showActionMenu()
          setFocus(buttons[index], buttons)
          if (cmd === 'confirm') buttons[index]?.click()
        }
      }, 100)

      // Touch controls (mobile)
      const mc = document.getElementById('mobileControls')
      if (mc) {
        mc.querySelectorAll('.mc-btn').forEach((btn) => {
          const cmd = btn.getAttribute('data-touch')
          const push = () => {
            if (this.gameState === 'battle' && this.turnQueue[this.currentTurn]?.type === 'hero') {
              switch (cmd) {
                case 'up':
                case 'down':
                case 'left':
                case 'right':
                case 'confirm':
                case 'cancel':
                case 'special':
                  this.inputBuffer.push(cmd)
                  break
              }
            }
          }
          btn.addEventListener('touchstart', (e) => { e.preventDefault(); push() }, { passive: false })
          btn.addEventListener('click', (e) => { e.preventDefault(); push() })
        })
      }
    }

    initializeCanvases() {
      this.backgroundCanvas = document.getElementById('backgroundCanvas')
      this.backgroundCtx = this.backgroundCanvas?.getContext?.('2d') || null
      this.heroCanvas = document.getElementById('heroCanvas')
      this.heroCtx = this.heroCanvas?.getContext?.('2d') || null
      this.enemyCanvas = document.getElementById('enemyCanvas')
      this.enemyCtx = this.enemyCanvas?.getContext?.('2d') || null
      this.resizeCanvases()
      window.addEventListener('resize', () => this.resizeCanvases())
      this.animateBackground()
    }

    resizeCanvases() {
      const canvases = [this.backgroundCanvas, this.heroCanvas, this.enemyCanvas]
      canvases.forEach((c) => {
        if (!c) return
        c.width = c.offsetWidth
        c.height = c.offsetHeight
      })
    }

    animateBackground() {
      if (!this.backgroundCtx || !this.backgroundCanvas) return
      const ctx = this.backgroundCtx
      const canvas = this.backgroundCanvas
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const time = Date.now() * 0.001
        for (let i = 0; i < 20; i++) {
          const x = (Math.sin(time + i) * 0.5 + 0.5) * canvas.width
          const y = (Math.cos(time * 0.7 + i * 0.5) * 0.5 + 0.5) * canvas.height
          const size = Math.sin(time + i * 2) * 2 + 3
          const alpha = Math.sin(time + i * 1.5) * 0.3 + 0.2
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.fillStyle = '#64ffda'
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
        requestAnimationFrame(draw)
      }
      draw()
    }

    async startGame() {
      // Hide loading
      const loading = document.getElementById('loadingScreen')
      if (loading) loading.classList.add('hidden')
      // Intro
      const intro = document.getElementById('battleIntro')
      if (intro) {
        intro.classList.remove('hidden')
        this.audio.playMusic()
        await new Promise((r) => setTimeout(r, 1200))
        intro.classList.add('hidden')
      }
      // Scene
      const scene = document.getElementById('battleScene')
      if (scene) scene.classList.remove('hidden')

      // Init battle
      this.gameState = 'battle'
      this.setupTurnQueue()
      this.updateTurnDisplay()
      this.updateUI()
      // Start turn sequence
      await this.nextTurn()
    }

    setupTurnQueue() {
      const chars = [
        { ...this.hero, type: 'hero' },
        { ...this.enemy, type: 'enemy' },
      ]
      chars.sort((a, b) => b.speed - a.speed)
      this.turnQueue = chars
      this.currentTurn = 0
    }

    updateTurnDisplay() {
      const turnOrder = document.getElementById('turnOrder')
      if (!turnOrder) return
      turnOrder.innerHTML = ''
      this.turnQueue.forEach((char, i) => {
        const icon = document.createElement('div')
        icon.className = `turn-icon ${char.type}`
        if (i === this.currentTurn) icon.classList.add('active')
        icon.style.backgroundImage = `url('assets/characters/${char.type}-portrait.png')`
        turnOrder.appendChild(icon)
      })
    }

    async playerTurn() {
      this.addBattleMessage('Seu turno!', 'system')
      this.showActionMenu()
      return new Promise((resolve) => (this._resolvePlayer = resolve))
    }

    async enemyTurn() {
      this.addBattleMessage(`${this.enemy.name} está pensando...`, 'system')
      this.hideActionMenu()
      await new Promise((r) => setTimeout(r, 600))
      const choice = Math.random()
      if (choice < 0.5) await this.performAttack(this.enemy, this.hero)
      else await this.performMagic(this.enemy, this.hero, 'fireball')
      this.updateUI()
    }

    async nextTurn() {
      // Check end
      if (this.hero.hp <= 0 || this.enemy.hp <= 0) {
        await this.endBattle()
        return
      }
      this.currentTurn = (this.currentTurn + 1) % this.turnQueue.length
      this.updateTurnDisplay()
      const active = this.turnQueue[this.currentTurn]
      if (active.type === 'hero') await this.playerTurn()
      else await this.enemyTurn()
      await this.nextTurn()
    }

    handleAction(action) {
      if (this.turnQueue[this.currentTurn]?.type !== 'hero') return
      switch (action) {
        case 'attack':
          this.executePlayerAction({ type: 'attack' })
          break
        case 'magic':
          this.showMagicMenu()
          break
        case 'item':
          this.addBattleMessage('Nenhum item disponível!', 'system')
          break
        case 'defend':
          this.executePlayerAction({ type: 'defend' })
          break
      }
    }

    handleMagic(spell, cost) {
      if (this.hero.mp < cost) {
        this.addBattleMessage('MP insuficiente!', 'system')
        return
      }
      this.executePlayerAction({ type: 'magic', spell })
    }

    async executePlayerAction(action) {
      this.hideActionMenu()
      if (action.type === 'attack') {
        await this.performAttack(this.hero, this.enemy)
      } else if (action.type === 'magic') {
        await this.performMagic(this.hero, this.enemy, action.spell)
      } else if (action.type === 'defend') {
        await this.performDefend(this.hero)
      }
      if (this._resolvePlayer) {
        this._resolvePlayer()
        this._resolvePlayer = null
      }
      this.updateUI()
    }

    async performAttack(attacker, target) {
      const base = attacker.attack
      const def = target.defense
      const rnd = 0.8 + Math.random() * 0.4
      let dmg = Math.max(1, Math.floor((base - def * 0.5) * rnd))
      const crit = Math.random() < 0.1
      if (crit) dmg = Math.floor(dmg * 1.5)
      const miss = Math.random() < 0.05
      if (miss) dmg = 0

      await this.anim.playAttackAnimation(attacker)
      target.hp = Math.max(0, target.hp - dmg)

      if (miss) {
        this.showFloatingText(target, 'MISS', 'miss')
        this.addBattleMessage('O ataque errou!', 'system')
        this.audio.playSFX('hit')
      } else {
        this.showFloatingText(target, dmg, crit ? 'critical' : 'damage')
        this.addBattleMessage(`${dmg} de dano!`, 'damage')
        this.effects.screenFlash()
        this.effects.cameraShake()
        this.audio.playSFX('hit')
      }
      await new Promise((r) => setTimeout(r, 300))
    }

    async performMagic(caster, target, spellName) {
      const spell = this.spells[spellName]
      if (!spell) return
      if (caster.mp < spell.cost) {
        this.addBattleMessage('MP insuficiente!', 'system')
        return
      }
      caster.mp -= spell.cost
      this.addBattleMessage(`${caster === this.hero ? 'Você' : caster.name} conjura ${spell.name}!`, 'magic')
      await this.anim.playCastAnimation(caster)
      if (spell.type === 'damage') {
        const dmg = spell.damage + Math.floor(Math.random() * 10) - 5
        target.hp = Math.max(0, target.hp - dmg)
        this.showFloatingText(target, dmg, 'damage')
        this.effects.magicEffect(spellName)
        this.audio.playSFX('magic')
      } else if (spell.type === 'heal') {
        const heal = spell.heal + Math.floor(Math.random() * 10) - 5
        const actual = Math.min(heal, caster.maxHp - caster.hp)
        caster.hp += actual
        this.showFloatingText(caster, actual, 'heal')
        this.effects.healEffect()
        this.audio.playSFX('heal')
      }
      await new Promise((r) => setTimeout(r, 300))
    }

    async performDefend(char) {
      this.addBattleMessage(`${char === this.hero ? 'Você' : char.name} se defende!`, 'system')
      await this.anim.playDefendAnimation(char)
      await new Promise((r) => setTimeout(r, 200))
    }

    async endBattle() {
      this.gameState = 'ended'
      const isVictory = this.enemy.hp <= 0
      const result = document.getElementById('battleResult')
      const title = document.getElementById('resultTitle')
      const stats = document.getElementById('resultStats')
      if (isVictory) {
        if (title) title.textContent = 'VITÓRIA!'
        if (title) title.className = 'result-title victory'
        if (stats) stats.innerHTML = `<p>Você derrotou ${this.enemy.name}!</p>`
      } else {
        if (title) title.textContent = 'DERROTA!'
        if (title) title.className = 'result-title defeat'
        if (stats) stats.innerHTML = `<p>${this.enemy.name} foi mais forte desta vez...</p>`
      }
      if (result) result.classList.remove('hidden')
    }

    showFloatingText(target, text, type) {
      const layer = document.getElementById('damageNumbers')
      if (!layer) return
      const el = document.createElement('div')
      el.className = `damage-number ${type}`
      el.textContent = text
      const anchor = target.__tag === 'hero' ? document.getElementById('heroCharacter') : document.getElementById('enemyCharacter')
      const rect = anchor?.getBoundingClientRect?.() || { left: 0, top: 0, width: 0, height: 0 }
      el.style.left = rect.left + rect.width / 2 + 'px'
      el.style.top = rect.top + rect.height / 2 + 'px'
      layer.appendChild(el)
      setTimeout(() => el.remove(), 1500)
    }

    addBattleMessage(message, type = 'system') {
      const messages = document.getElementById('battleMessages')
      if (!messages) return
      const div = document.createElement('div')
      div.className = `battle-message message-${type}`
      div.textContent = message
      messages.appendChild(div)
      messages.scrollTop = messages.scrollHeight
      while (messages.children.length > 10) messages.removeChild(messages.firstChild)
    }

    updateUI() {
      const setBar = (id, ratio) => {
        const el = document.getElementById(id)
        if (el) el.style.width = Math.max(0, Math.min(1, ratio)) * 100 + '%'
      }
      setBar('heroHpBar', this.hero.hp / this.hero.maxHp)
      setBar('heroMpBar', this.hero.mp / this.hero.maxMp)
      setBar('enemyHpBar', this.enemy.hp / this.enemy.maxHp)
      setBar('enemyMpBar', this.enemy.mp / this.enemy.maxMp)
      const setText = (id, val) => {
        const el = document.getElementById(id)
        if (el) el.textContent = val
      }
      setText('heroHpText', `${this.hero.hp}/${this.hero.maxHp}`)
      setText('heroMpText', `${this.hero.mp}/${this.hero.maxMp}`)
      setText('enemyHpText', `${this.enemy.hp}/${this.enemy.maxHp}`)
      setText('enemyMpText', `${this.enemy.mp}/${this.enemy.maxMp}`)
    }

    handleKeyboard(e) {
      if (this.gameState !== 'battle' || this.turnQueue[this.currentTurn]?.type !== 'hero') return
      switch (e.key) {
        case '1':
          this.handleAction('attack')
          break
        case '2':
          this.handleAction('magic')
          break
        case '3':
          this.handleAction('item')
          break
        case '4':
          this.handleAction('defend')
          break
        case 'Escape':
          this.showActionMenu()
          break
      }
    }

    async restartBattle() {
      this.hero.hp = this.hero.maxHp
      this.hero.mp = this.hero.maxMp
      this.enemy.hp = this.enemy.maxHp
      this.enemy.mp = this.enemy.maxMp
      const result = document.getElementById('battleResult')
      if (result) result.classList.add('hidden')
      this.gameState = 'battle'
      this.currentTurn = 0
      this.updateTurnDisplay()
      this.updateUI()
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      window.battleGame = new BattleGame()
      logDebug('ready')
    } catch (e) {
      console.error('BattleGame bootstrap failed', e)
      logDebug('bootstrap error')
    }
  })

  document.addEventListener('visibilitychange', () => {
    if (!window.battleGame) return
    if (document.hidden) window.battleGame.audio.stopMusic()
    else window.battleGame.audio.playMusic()
  })
})()