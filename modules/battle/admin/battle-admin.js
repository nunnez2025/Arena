// Admin panel integration for battle system

class BattleAdmin {
  constructor(adminManager) {
    this.adminManager = adminManager
    this.setupAdminRoutes()
  }

  setupAdminRoutes() {
    // Battle system management routes
    this.adminManager.addRoute("/admin/battle", this.getBattleOverview.bind(this))
    this.adminManager.addRoute("/admin/battle/skills", this.getSkillsManager.bind(this))
    this.adminManager.addRoute("/admin/battle/classes", this.getClassesManager.bind(this))
    this.adminManager.addRoute("/admin/battle/enemies", this.getEnemiesManager.bind(this))
    this.adminManager.addRoute("/admin/battle/environments", this.getEnvironmentsManager.bind(this))

    // API routes for CRUD operations
    this.adminManager.addAPIRoute("POST", "/api/admin/battle/skill", this.createSkill.bind(this))
    this.adminManager.addAPIRoute("PUT", "/api/admin/battle/skill/:id", this.updateSkill.bind(this))
    this.adminManager.addAPIRoute("DELETE", "/api/admin/battle/skill/:id", this.deleteSkill.bind(this))

    this.adminManager.addAPIRoute("POST", "/api/admin/battle/enemy", this.createEnemy.bind(this))
    this.adminManager.addAPIRoute("PUT", "/api/admin/battle/enemy/:id", this.updateEnemy.bind(this))
    this.adminManager.addAPIRoute("DELETE", "/api/admin/battle/enemy/:id", this.deleteEnemy.bind(this))
  }

  getBattleOverview(req, res) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Battle System - Admin Panel</title>
        <link rel="stylesheet" href="/admin/css/admin.css">
      </head>
      <body>
        <div class="admin-container">
          <h1>Battle System Management</h1>
          
          <div class="admin-grid">
            <div class="admin-card">
              <h3>Skills Management</h3>
              <p>Create and manage battle skills</p>
              <a href="/admin/battle/skills" class="btn btn-primary">Manage Skills</a>
            </div>
            
            <div class="admin-card">
              <h3>Classes Management</h3>
              <p>Configure character classes</p>
              <a href="/admin/battle/classes" class="btn btn-primary">Manage Classes</a>
            </div>
            
            <div class="admin-card">
              <h3>Enemies Management</h3>
              <p>Create and configure enemies</p>
              <a href="/admin/battle/enemies" class="btn btn-primary">Manage Enemies</a>
            </div>
            
            <div class="admin-card">
              <h3>Environments</h3>
              <p>Configure battle environments</p>
              <a href="/admin/battle/environments" class="btn btn-primary">Manage Environments</a>
            </div>
          </div>
          
          <div class="battle-stats">
            <h3>Battle Statistics</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Active Battles:</span>
                <span class="stat-value" id="active-battles">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Battles Today:</span>
                <span class="stat-value" id="battles-today">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Average Battle Duration:</span>
                <span class="stat-value" id="avg-duration">0m</span>
              </div>
            </div>
          </div>
        </div>
        
        <script src="/admin/js/battle-admin.js"></script>
      </body>
      </html>
    `

    res.send(html)
  }

  getSkillsManager(req, res) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Skills Management - Battle System</title>
        <link rel="stylesheet" href="/admin/css/admin.css">
      </head>
      <body>
        <div class="admin-container">
          <h1>Skills Management</h1>
          
          <div class="admin-toolbar">
            <button class="btn btn-success" onclick="createNewSkill()">Create New Skill</button>
            <button class="btn btn-info" onclick="importSkills()">Import Skills</button>
            <button class="btn btn-warning" onclick="exportSkills()">Export Skills</button>
          </div>
          
          <div class="skills-list">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Power</th>
                  <th>MP Cost</th>
                  <th>Target</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="skills-table-body">
                <!-- Skills will be loaded here -->
              </tbody>
            </table>
          </div>
          
          <!-- Skill Editor Modal -->
          <div id="skill-editor-modal" class="modal">
            <div class="modal-content">
              <span class="close">&times;</span>
              <h2>Skill Editor</h2>
              
              <form id="skill-form">
                <div class="form-group">
                  <label for="skill-id">Skill ID:</label>
                  <input type="text" id="skill-id" name="id" required>
                </div>
                
                <div class="form-group">
                  <label for="skill-name">Name:</label>
                  <input type="text" id="skill-name" name="name" required>
                </div>
                
                <div class="form-group">
                  <label for="skill-type">Type:</label>
                  <select id="skill-type" name="type" required>
                    <option value="damage">Damage</option>
                    <option value="heal">Heal</option>
                    <option value="status">Status Effect</option>
                    <option value="buff">Buff</option>
                    <option value="debuff">Debuff</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="skill-power">Power:</label>
                  <input type="number" id="skill-power" name="power" min="0">
                </div>
                
                <div class="form-group">
                  <label for="skill-mp-cost">MP Cost:</label>
                  <input type="number" id="skill-mp-cost" name="mpCost" min="0" required>
                </div>
                
                <div class="form-group">
                  <label for="skill-cooldown">Cooldown:</label>
                  <input type="number" id="skill-cooldown" name="cooldown" min="0">
                </div>
                
                <div class="form-group">
                  <label for="skill-target-type">Target Type:</label>
                  <select id="skill-target-type" name="targetType" required>
                    <option value="single_enemy">Single Enemy</option>
                    <option value="all_enemies">All Enemies</option>
                    <option value="single_ally">Single Ally</option>
                    <option value="all_allies">All Allies</option>
                    <option value="self">Self</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="skill-animation">Animation:</label>
                  <input type="text" id="skill-animation" name="animation">
                </div>
                
                <div class="form-group">
                  <label for="skill-description">Description:</label>
                  <textarea id="skill-description" name="description" rows="3"></textarea>
                </div>
                
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Save Skill</button>
                  <button type="button" class="btn btn-secondary" onclick="closeSkillEditor()">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <script src="/admin/js/skills-manager.js"></script>
      </body>
      </html>
    `

    res.send(html)
  }

  async createSkill(req, res) {
    try {
      const skillData = req.body

      // Validate skill data
      if (!skillData.id || !skillData.name || !skillData.type) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // Save skill to database
      const skill = await this.adminManager.database.skills.create(skillData)

      // Update battle config
      await this.updateBattleConfig()

      res.json({ success: true, skill: skill })
    } catch (error) {
      console.error("Error creating skill:", error)
      res.status(500).json({ error: "Failed to create skill" })
    }
  }

  async updateSkill(req, res) {
    try {
      const skillId = req.params.id
      const skillData = req.body

      // Update skill in database
      const skill = await this.adminManager.database.skills.update(skillId, skillData)

      // Update battle config
      await this.updateBattleConfig()

      res.json({ success: true, skill: skill })
    } catch (error) {
      console.error("Error updating skill:", error)
      res.status(500).json({ error: "Failed to update skill" })
    }
  }

  async deleteSkill(req, res) {
    try {
      const skillId = req.params.id

      // Delete skill from database
      await this.adminManager.database.skills.delete(skillId)

      // Update battle config
      await this.updateBattleConfig()

      res.json({ success: true })
    } catch (error) {
      console.error("Error deleting skill:", error)
      res.status(500).json({ error: "Failed to delete skill" })
    }
  }

  async createEnemy(req, res) {
    try {
      const enemyData = req.body

      // Validate enemy data
      if (!enemyData.id || !enemyData.name) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // Save enemy to database
      const enemy = await this.adminManager.database.enemies.create(enemyData)

      // Update battle config
      await this.updateBattleConfig()

      res.json({ success: true, enemy: enemy })
    } catch (error) {
      console.error("Error creating enemy:", error)
      res.status(500).json({ error: "Failed to create enemy" })
    }
  }

  async updateEnemy(req, res) {
    try {
      const enemyId = req.params.id
      const enemyData = req.body

      // Update enemy in database
      const enemy = await this.adminManager.database.enemies.update(enemyId, enemyData)

      // Update battle config
      await this.updateBattleConfig()

      res.json({ success: true, enemy: enemy })
    } catch (error) {
      console.error("Error updating enemy:", error)
      res.status(500).json({ error: "Failed to update enemy" })
    }
  }

  async deleteEnemy(req, res) {
    try {
      const enemyId = req.params.id

      // Delete enemy from database
      await this.adminManager.database.enemies.delete(enemyId)

      // Update battle config
      await this.updateBattleConfig()

      res.json({ success: true })
    } catch (error) {
      console.error("Error deleting enemy:", error)
      res.status(500).json({ error: "Failed to delete enemy" })
    }
  }

  async updateBattleConfig() {
    // Regenerate battle config from database
    const skills = await this.adminManager.database.skills.findAll()
    const enemies = await this.adminManager.database.enemies.findAll()
    const classes = await this.adminManager.database.classes.findAll()

    const config = {
      skills: skills.reduce((acc, skill) => {
        acc[skill.id] = skill
        return acc
      }, {}),
      enemies: enemies.reduce((acc, enemy) => {
        acc[enemy.id] = enemy
        return acc
      }, {}),
      classes: classes.reduce((acc, cls) => {
        acc[cls.id] = cls
        return acc
      }, {}),
    }

    // Save updated config
    const fs = require("fs")
    const path = require("path")
    const configPath = path.join(__dirname, "../config/battle-config.json")

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

    console.log("[BattleAdmin] Battle config updated")
  }
}

module.exports = BattleAdmin
