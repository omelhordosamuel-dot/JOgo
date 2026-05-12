window.GP = window.GP || {};

GP.Game = function(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d", { willReadFrequently: true });
  this.keys = {};
  this.frame = 0;
  this.running = false;
  this.camera = { x: 0, y: 0 };
  this.enemies = [];
  this.attacks = [];
  this.impactEffects = [];
  this.particles = [];
  this.coins = [];
  this.texts = [];
  this.quests = {};
  this.selectedQuestId = null;
  this.selectedHotbarSlot = 0;
  this.hotbarItems = [{ id: "baseFighting", nome: "Estilo de luta base" }];
  this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };

  this.sprites = {
    frente: { sx: 20, sy: 205, sw: 320, sh: 545, dw: 36, dh: 60, offX: -18, offY: -45 },
    skill: { sx: 340, sy: 205, sw: 530, sh: 555, dw: 58, dh: 60, offX: -28, offY: -45 },
    lado: { sx: 870, sy: 205, sw: 230, sh: 545, dw: 28, dh: 60, offX: -14, offY: -45 },
    costas: { sx: 1100, sy: 205, sw: 325, sh: 545, dw: 38, dh: 60, offX: -19, offY: -45 }
  };

  this.resize();
  window.addEventListener("resize", () => this.resize());
  document.addEventListener("keydown", e => this.onKeyDown(e));
  document.addEventListener("keyup", e => {
    this.keys[e.key.toLowerCase()] = false;
  });
  this.canvas.addEventListener("mousemove", e => this.updateMousePosition(e));
  this.canvas.addEventListener("mousedown", e => this.onMouseDown(e));
  this.setupHotbarControls();
};

GP.Game.prototype.resize = function() {
  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;
  this.ctx.imageSmoothingEnabled = false;
};

GP.Game.prototype.setupHotbarControls = function() {
  this.hotbarSlots = Array.from(document.querySelectorAll(".hotbar-slot"));
  this.hotbarSlots.forEach((slot, index) => {
    slot.addEventListener("click", () => this.selectHotbarSlot(index));
  });

  const hotbar = document.getElementById("hotbar");
  if (hotbar) {
    hotbar.addEventListener("wheel", event => {
      event.preventDefault();
      this.cycleHotbarSlot(event.deltaY > 0 ? 1 : -1);
    }, { passive: false });
  }

  window.addEventListener("wheel", event => {
    if (!this.running || document.body.classList.contains("menu-open")) return;
    event.preventDefault();
    this.cycleHotbarSlot(event.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  this.selectHotbarSlot(0);
};

GP.Game.prototype.selectHotbarSlot = function(index) {
  this.selectedHotbarSlot = (index + 9) % 9;
  if (!this.hotbarSlots) return;

  this.hotbarSlots.forEach((slot, slotIndex) => {
    slot.classList.toggle("active", slotIndex === this.selectedHotbarSlot);
  });
};

GP.Game.prototype.cycleHotbarSlot = function(direction) {
  this.selectHotbarSlot(this.selectedHotbarSlot + direction);
};

GP.Game.prototype.updateMousePosition = function(event) {
  const rect = this.canvas.getBoundingClientRect();
  const zoom = GP.CONFIG.camera.zoom || 1;
  this.mouse.x = event.clientX - rect.left;
  this.mouse.y = event.clientY - rect.top;
  this.mouse.worldX = this.camera.x + this.mouse.x / zoom;
  this.mouse.worldY = this.camera.y + this.mouse.y / zoom;
};

GP.Game.prototype.onMouseDown = function(event) {
  if (event.button !== 0) return;
  this.updateMousePosition(event);
  if (!this.running || document.body.classList.contains("menu-open")) return;
  if (this.selectedHotbarSlot === 0 && this.hotbarItems[0]) {
    this.basicPunchAt(this.mouse.worldX, this.mouse.worldY);
    event.preventDefault();
  }
};

GP.Game.prototype.start = function() {
  GP.UI.hideMenu();
  this.player = GP.Entities.createPlayer();
  this.npcs = GP.CONFIG.questNpcs.map(data => GP.Entities.createNpc(data));
  this.enemies = [];
  this.attacks = [];
  this.impactEffects = [];
  this.particles = [];
  this.coins = [];
  this.texts = [];
  this.selectedQuestId = null;
  this.selectHotbarSlot(this.selectedHotbarSlot || 0);
  GP.GameMap.invalidateCache();
  GP.GameMap.resetInteractables();
  this.resetQuests();

  Object.keys(GP.CONFIG.campEnemies).forEach(campId => {
    const camp = GP.CONFIG.campEnemies[campId];
    for (let i = 0; i < camp.count; i++) this.enemies.push(GP.Entities.createEnemy(campId, i));
  });

  this.running = true;
  requestAnimationFrame(() => this.loop());
};

GP.Game.prototype.onKeyDown = function(event) {
  const key = event.key.toLowerCase();
  if (/^[1-9]$/.test(key)) {
    this.selectHotbarSlot(Number(key) - 1);
    event.preventDefault();
    return;
  }

  this.keys[key] = true;

  if (!this.running) return;

  if (key === "e") this.tryInteract();
};

GP.Game.prototype.moveWithCollision = function(obj, dx, dy) {
  const oldX = obj.x;
  const oldY = obj.y;

  obj.x += dx;
  if (!GP.GameMap.canWalk(obj.x, obj.y, obj.r)) obj.x = oldX;

  obj.y += dy;
  if (!GP.GameMap.canWalk(obj.x, obj.y, obj.r)) obj.y = oldY;
};

GP.Game.prototype.updatePlayer = function() {
  let mx = 0;
  let my = 0;

  if (this.keys.w) my -= 1;
  if (this.keys.s) my += 1;
  if (this.keys.a) mx -= 1;
  if (this.keys.d) mx += 1;

  if (mx || my) {
    const dir = GP.Utils.normalize(mx, my);
    this.player.dirX = dir.x;
    this.player.dirY = dir.y;
    this.player.facing = this.getFacingDirection(dir.x, dir.y);
    this.player.walkTime++;
    this.moveWithCollision(this.player, dir.x * this.player.velocidade, dir.y * this.player.velocidade);

    if (this.player.estadoTempo <= 0) this.player.estado = "walk";
  } else if (this.player.estadoTempo <= 0) {
    this.player.estado = "idle";
    this.player.walkTime = 0;
  }
};

GP.Game.prototype.getFacingDirection = function(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "up" : "down";
};

GP.Game.prototype.resetQuests = function() {
  this.quests = {};
  Object.keys(GP.CONFIG.quests).forEach(id => {
    const quest = GP.CONFIG.quests[id];
    this.quests[id] = {
      id,
      ativa: false,
      completa: false,
      objetivo: quest.objective,
      progresso: 0
    };
  });
};

GP.Game.prototype.getQuestState = function(id) {
  return this.quests[id];
};

GP.Game.prototype.getQuestConfig = function(id) {
  return GP.CONFIG.quests[id];
};

GP.Game.prototype.getActiveQuestForHud = function() {
  const active = Object.keys(this.quests).map(id => this.quests[id]).find(quest => quest.ativa && !quest.completa);
  if (active) return active;
  const available = Object.keys(this.quests).map(id => this.quests[id]).find(quest => !quest.completa);
  return available || Object.keys(this.quests).map(id => this.quests[id])[0];
};

GP.Game.prototype.basicPunchAt = function(targetX, targetY) {
  if (this.player.cooldownAtaque > 0) return;

  const dir = GP.Utils.normalize(targetX - this.player.x, targetY - this.player.y);
  this.player.dirX = dir.x || this.player.dirX || 1;
  this.player.dirY = dir.y || this.player.dirY || 0;
  this.player.facing = this.getFacingDirection(this.player.dirX, this.player.dirY);
  this.player.cooldownAtaque = 22;
  this.player.estado = "punch";
  this.player.estadoTempo = 18;
  this.player.actionDuration = 18;

  const handX = this.player.x + this.player.dirX * 28 + (Math.abs(this.player.dirY) > Math.abs(this.player.dirX) ? 0 : this.player.dirX * 8);
  const handY = this.player.y + this.player.dirY * 28 - 22;

  this.attacks.push({
    x: this.player.x + this.player.dirX * 56,
    y: this.player.y + this.player.dirY * 56,
    vx: this.player.dirX * 5.5,
    vy: this.player.dirY * 5.5,
    r: 30,
    dano: this.player.dano,
    vida: 10,
    cor: "#fff7d1",
    melee: true
  });

  this.createPunchImpact(handX, handY, Math.atan2(this.player.dirY, this.player.dirX), { fromFist: true });
};

GP.Game.prototype.createPunchImpact = function(x, y, angle, options) {
  const data = options || {};
  this.impactEffects.push({
    x,
    y,
    angle,
    age: 0,
    duration: data.duration || 24,
    frames: data.frames || 12,
    width: data.width || 168,
    height: data.height || 96,
    fromFist: !!data.fromFist
  });
};

GP.Game.prototype.useSkill = function() {
  if (this.player.cooldownSkill > 0) return;
  if (this.player.fruta.nome === "Nenhuma") {
    GP.UI.showToast("Voce ainda nao tem fruta. Aperte G para girar.");
    return;
  }

  const fruit = this.player.fruta;
  this.player.cooldownSkill = 90;
  this.player.estado = "skill";
  this.player.estadoTempo = 28;
  this.player.actionDuration = 28;

  if (fruit.nome === "Bomba") {
    this.explosion(this.player.x + this.player.dirX * 100, this.player.y + this.player.dirY * 100, 110, 32, fruit.cor);
  }

  if (fruit.nome === "Areia") {
    for (let i = -1; i <= 1; i++) {
      this.attacks.push({
        x: this.player.x,
        y: this.player.y,
        vx: this.player.dirX * 11 + i,
        vy: this.player.dirY * 11 + i,
        r: 15,
        dano: 24,
        vida: 50,
        cor: fruit.cor
      });
    }
  }

  if (fruit.nome === "Fogo") this.projectile(15, 28, 42, 60, fruit.cor);
  if (fruit.nome === "Gelo") this.projectile(13, 24, 36, 62, fruit.cor, { gelo: true });
  if (fruit.nome === "Luz") this.projectile(20, 18, 58, 46, fruit.cor, { luz: true });

  this.createText(this.player.x, this.player.y - 60, fruit.skill, fruit.cor);
  this.createParticles(this.player.x, this.player.y, fruit.cor, 32);
};

GP.Game.prototype.useSpecial = function() {
  if (this.player.cooldownEspecial > 0) return;
  if (this.player.fruta.nome === "Nenhuma") {
    GP.UI.showToast("Voce precisa de uma fruta para usar especial.");
    return;
  }

  const fruit = this.player.fruta;
  this.player.cooldownEspecial = 320;
  this.player.estado = "skill";
  this.player.estadoTempo = 38;
  this.player.actionDuration = 38;

  if (fruit.nome === "Bomba") this.explosion(this.player.x, this.player.y, 250, 62, fruit.cor);
  if (fruit.nome === "Areia") this.explosion(this.player.x, this.player.y, 280, 46, fruit.cor);
  if (fruit.nome === "Gelo") this.explosion(this.player.x, this.player.y, 300, 54, fruit.cor);
  if (fruit.nome === "Luz") {
    this.explosion(this.player.x, this.player.y, 360, 90, fruit.cor);
    this.player.vida = Math.min(this.player.vidaMax, this.player.vida + 45);
  }

  if (fruit.nome === "Fogo") {
    for (let i = 0; i < 16; i++) {
      const a = Math.PI * 2 * i / 16;
      this.attacks.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(a) * 9,
        vy: Math.sin(a) * 9,
        r: 24,
        dano: 42,
        vida: 75,
        cor: fruit.cor
      });
    }
  }

  this.createText(this.player.x, this.player.y - 70, fruit.especial + "!", fruit.cor);
  this.checkDeadEnemies();
};

GP.Game.prototype.projectile = function(speed, radius, damage, life, color, extra) {
  const data = extra || {};
  this.attacks.push(Object.assign({
    x: this.player.x,
    y: this.player.y,
    vx: this.player.dirX * speed,
    vy: this.player.dirY * speed,
    r: radius,
    dano: damage,
    vida: life,
    cor: color
  }, data));
};

GP.Game.prototype.explosion = function(x, y, radius, damage, color) {
  this.createWave(x, y, radius, color);
  this.createParticles(x, y, color, 70);

  this.enemies.forEach(enemy => {
    if (GP.Utils.dist(x, y, enemy.x, enemy.y) < radius + enemy.r) {
      enemy.aggro = true;
      enemy.vida -= damage;
      this.pushObject(enemy, x, y, 45);
      this.createParticles(enemy.x, enemy.y, color, 25);
      this.createText(enemy.x, enemy.y - 35, "-" + damage, color);
    }
  });

  this.checkDeadEnemies();
};

GP.Game.prototype.tryTalkNpc = function(npc) {
  const questId = npc.questId;
  const quest = this.getQuestState(questId);
  const config = this.getQuestConfig(questId);
  this.selectedQuestId = questId;

  if (this.player.nivel < config.levelRequired) {
    GP.UI.showDialog("<b>" + npc.nome + ":</b><br>" + config.intro + "<br><br>Requisito: nivel " + config.levelRequired + ".");
    return;
  }

  if (!quest.ativa && !quest.completa) {
    GP.UI.showDialog("<b>" + npc.nome + ":</b><br>" + config.intro + "<br><br>Recompensa: " + config.rewardCoins + " moedas e " + config.rewardXp + " XP.");
  } else if (quest.ativa && quest.progresso < quest.objetivo) {
    GP.UI.showDialog("<b>" + npc.nome + ":</b><br>" + config.activeText + "<br>Progresso: " + quest.progresso + "/" + quest.objetivo + ".");
  } else if (quest.completa) {
    GP.UI.showDialog("<b>" + npc.nome + ":</b><br>" + config.completeText);
  }
};

GP.Game.prototype.getNearbyNpc = function() {
  for (const npc of this.npcs) {
    if (GP.Utils.dist(this.player.x, this.player.y, npc.x, npc.y) <= 110) return npc;
  }
  return null;
};

GP.Game.prototype.tryInteract = function() {
  const npc = this.getNearbyNpc();
  if (npc) {
    this.tryTalkNpc(npc);
    return;
  }

  const item = GP.GameMap.getNearbyInteractable(this.player.x, this.player.y);
  if (!item) {
    GP.UI.showToast("Nao ha nada para interagir aqui.");
    return;
  }

  const message = GP.GameMap.useInteractable(item, this.player);
  GP.UI.showToast(message);
  this.createText(item.x, item.y - 70, item.label, item.reward ? "#ffe66d" : "#d9f4ff");
};

GP.Game.prototype.acceptQuest = function() {
  const questId = this.selectedQuestId;
  const quest = questId && this.getQuestState(questId);
  const config = questId && this.getQuestConfig(questId);

  if (quest && config && !quest.completa) {
    if (this.player.nivel < config.levelRequired) {
      GP.UI.showToast("Voce precisa estar no nivel " + config.levelRequired + " para essa missao.");
    } else {
      quest.ativa = true;
      GP.UI.showToast("Missao aceita: " + config.title + ".");
    }
  }
  GP.UI.closeDialog();
};

GP.Game.prototype.rollFruit = function() {
  if (this.player.moedas < 25) {
    GP.UI.showToast("Voce precisa de 25 moedas para girar fruta.");
    return;
  }

  this.player.moedas -= 25;
  const fruit = GP.Utils.pickWeighted(GP.CONFIG.fruits.slice(1));
  this.player.fruta = fruit;
  GP.UI.showSpin(fruit);
  this.createParticles(this.player.x, this.player.y, fruit.cor, 100);
};

GP.Game.prototype.updateEnemies = function() {
  for (const enemy of this.enemies) {
    const d = GP.Utils.dist(this.player.x, this.player.y, enemy.x, enemy.y);

    if (enemy.aggro && d < 560) {
      const dir = GP.Utils.normalize(this.player.x - enemy.x, this.player.y - enemy.y);
      this.moveWithCollision(enemy, dir.x * enemy.velocidade, dir.y * enemy.velocidade);
    }

    if (enemy.passiveUntilHit) {
      const spawnDistance = GP.Utils.dist(enemy.x, enemy.y, enemy.spawnX, enemy.spawnY);
      if (enemy.aggro && spawnDistance > 520) enemy.aggro = false;
      if (!enemy.aggro && spawnDistance > 4) {
        enemy.x += (enemy.spawnX - enemy.x) * 0.04;
        enemy.y += (enemy.spawnY - enemy.y) * 0.04;
      }
    }

    if (enemy.hitCooldown > 0) enemy.hitCooldown--;

    if (enemy.aggro && d < this.player.r + enemy.r && enemy.hitCooldown <= 0 && this.player.invencivel <= 0) {
      this.player.vida -= enemy.dano;
      this.player.invencivel = 38;
      enemy.hitCooldown = 50;
      this.createParticles(this.player.x, this.player.y, "#ff3333", 25);
      this.createText(this.player.x, this.player.y - 45, "-" + enemy.dano, "#ff3333");
      if (this.player.vida <= 0) this.die();
    }
  }
};

GP.Game.prototype.updateAttacks = function() {
  for (let i = this.attacks.length - 1; i >= 0; i--) {
    const attack = this.attacks[i];
    attack.x += attack.vx;
    attack.y += attack.vy;
    attack.vida--;
    if (!attack.melee) this.createParticles(attack.x, attack.y, attack.cor, 1);

    if (attack.vida <= 0) {
      this.attacks.splice(i, 1);
      continue;
    }

    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const enemy = this.enemies[j];
      if (GP.Utils.dist(attack.x, attack.y, enemy.x, enemy.y) < attack.r + enemy.r) {
        enemy.aggro = true;
        enemy.vida -= attack.dano;
        this.pushObject(enemy, this.player.x, this.player.y, 22);
        if (attack.gelo) enemy.velocidade *= 0.7;
        if (attack.melee) this.createPunchImpact(enemy.x - attack.vx * 2, enemy.y - attack.vy * 2 - 12, Math.atan2(attack.vy, attack.vx), { duration: 20, width: 142, height: 86 });
        else this.createParticles(enemy.x, enemy.y, attack.cor, 20);
        this.createText(enemy.x, enemy.y - 35, "-" + attack.dano, attack.cor);
        this.attacks.splice(i, 1);
        if (enemy.vida <= 0) this.killEnemy(j);
        break;
      }
    }
  }
};

GP.Game.prototype.updateImpactEffects = function() {
  for (let i = this.impactEffects.length - 1; i >= 0; i--) {
    const effect = this.impactEffects[i];
    effect.age++;
    if (effect.age >= effect.duration) this.impactEffects.splice(i, 1);
  }
};

GP.Game.prototype.killEnemy = function(index) {
  const enemy = this.enemies[index];
  this.player.xp += enemy.xp;
  this.player.moedas += enemy.moedas;

  const quest = enemy.questId && this.getQuestState(enemy.questId);
  if (quest && quest.ativa && !quest.completa && quest.progresso < quest.objetivo) {
    quest.progresso++;
  }

  this.createParticles(enemy.x, enemy.y, "#ffe66d", 35);
  this.createText(enemy.x, enemy.y - 45, "+" + enemy.xp + " XP", "#ffe66d");
  this.coins.push({ x: enemy.x, y: enemy.y, r: 10, valor: enemy.moedas });
  this.enemies.splice(index, 1);
  if (quest && quest.ativa && !quest.completa && quest.progresso >= quest.objetivo) this.completeQuest(enemy.questId);
  setTimeout(() => {
    if (this.running && enemy.campId) this.enemies.push(GP.Entities.createEnemy(enemy.campId, enemy.spawnIndex));
  }, 1200);
  this.checkLevelUp();
};

GP.Game.prototype.completeQuest = function(questId) {
  const quest = this.getQuestState(questId);
  const config = this.getQuestConfig(questId);
  if (!quest || !config || quest.completa) return;

  quest.ativa = false;
  quest.completa = true;
  this.player.moedas += config.rewardCoins;
  this.player.xp += config.rewardXp;
  this.createText(this.player.x, this.player.y - 65, "MISSAO COMPLETA!", "#ffe66d");
  this.createParticles(this.player.x, this.player.y, "#ffe66d", 90);
  GP.UI.showQuestComplete(config.title, "+" + config.rewardCoins + " moedas  +" + config.rewardXp + " XP");
  GP.UI.showToast(config.title + " completa! +" + config.rewardCoins + " moedas e +" + config.rewardXp + " XP");
  this.checkLevelUp();
};

GP.Game.prototype.checkDeadEnemies = function() {
  for (let i = this.enemies.length - 1; i >= 0; i--) {
    if (this.enemies[i].vida <= 0) this.killEnemy(i);
  }
};

GP.Game.prototype.checkLevelUp = function() {
  while (this.player.xp >= this.player.xpMax) {
    this.player.xp -= this.player.xpMax;
    this.player.nivel++;
    this.player.xpMax += 35;
    this.player.vidaMax += 18;
    this.player.vida = this.player.vidaMax;
    this.player.dano += 4;
    this.createText(this.player.x, this.player.y - 65, "LEVEL UP!", "#ffe66d");
    this.createParticles(this.player.x, this.player.y, "#ffe66d", 90);
  }
};

GP.Game.prototype.updateCoins = function() {
  for (let i = this.coins.length - 1; i >= 0; i--) {
    const coin = this.coins[i];
    const d = GP.Utils.dist(this.player.x, this.player.y, coin.x, coin.y);

    if (d < 150 && d > 0) {
      coin.x += (this.player.x - coin.x) / d * 4;
      coin.y += (this.player.y - coin.y) / d * 4;
    }

    if (d < this.player.r + coin.r) {
      this.player.moedas += coin.valor;
      this.createParticles(coin.x, coin.y, "#ffe66d", 15);
      this.coins.splice(i, 1);
    }
  }
};

GP.Game.prototype.updateParticles = function() {
  for (let i = this.particles.length - 1; i >= 0; i--) {
    const p = this.particles[i];
    if (p.onda) {
      p.r += p.raioMax / 25;
      p.vida--;
    } else {
      p.x += p.vx;
      p.y += p.vy;
      p.vida--;
    }

    if (p.vida <= 0) this.particles.splice(i, 1);
  }
};

GP.Game.prototype.updateTexts = function() {
  for (let i = this.texts.length - 1; i >= 0; i--) {
    this.texts[i].y -= 0.8;
    this.texts[i].vida--;
    if (this.texts[i].vida <= 0) this.texts.splice(i, 1);
  }
};

GP.Game.prototype.updateCooldowns = function() {
  if (this.player.cooldownAtaque > 0) this.player.cooldownAtaque--;
  if (this.player.cooldownSkill > 0) this.player.cooldownSkill--;
  if (this.player.cooldownEspecial > 0) this.player.cooldownEspecial--;
  if (this.player.invencivel > 0) this.player.invencivel--;

  if (this.player.estadoTempo > 0) this.player.estadoTempo--;
  if (this.player.estadoTempo <= 0 && this.player.estado !== "walk") this.player.estado = "idle";
};

GP.Game.prototype.updateCamera = function() {
  const world = GP.CONFIG.world;
  const zoom = GP.CONFIG.camera.zoom || 1;
  const viewW = this.canvas.width / zoom;
  const viewH = this.canvas.height / zoom;
  this.camera.x = GP.Utils.clamp(this.player.x - viewW / 2, 0, Math.max(0, world.width - viewW));
  this.camera.y = GP.Utils.clamp(this.player.y - viewH / 2, 0, Math.max(0, world.height - viewH));
};

GP.Game.prototype.die = function() {
  this.running = false;
  GP.UI.showGameOver(this.player);
};

GP.Game.prototype.createParticles = function(x, y, color, amount) {
  for (let i = 0; i < amount; i++) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 7,
      vy: (Math.random() - 0.5) * 7,
      r: Math.random() * 4 + 2,
      vida: 25 + Math.random() * 25,
      cor: color
    });
  }
};

GP.Game.prototype.createWave = function(x, y, radius, color) {
  this.particles.push({ x, y, r: 10, raioMax: radius, vida: 35, cor: color, onda: true });
};

GP.Game.prototype.createText = function(x, y, text, color) {
  this.texts.push({ x, y, texto: text, cor: color, vida: 60 });
};

GP.Game.prototype.pushObject = function(obj, ox, oy, force) {
  let dx = obj.x - ox;
  let dy = obj.y - oy;
  let d = Math.hypot(dx, dy) || 1;
  const oldX = obj.x;
  const oldY = obj.y;
  obj.x += dx / d * force;
  obj.y += dy / d * force;
  if (obj.r && !GP.GameMap.canWalk(obj.x, obj.y, obj.r)) {
    obj.x = oldX;
    obj.y = oldY;
  }
};

GP.Game.prototype.draw = function() {
  const ctx = this.ctx;
  const zoom = GP.CONFIG.camera.zoom || 1;
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  GP.GameMap.drawBase(ctx, this.camera, this.canvas, zoom);

  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(-this.camera.x, -this.camera.y);

  this.drawGroundProps(ctx);
  this.drawCoins(ctx);
  this.drawDepthSortedScene(ctx);
  this.drawParticles(ctx);
  this.drawImpactEffects(ctx);
  this.drawTexts(ctx);
  this.drawAttacks(ctx);
  this.drawInteractablePrompt(ctx);

  ctx.restore();
};

GP.Game.prototype.drawGroundProps = function(ctx) {
  const zoom = GP.CONFIG.camera.zoom || 1;

  GP.GameMap.getVisibleGroundProps(this.camera, this.canvas, zoom).forEach(prop => {
    GP.GameMap.drawProp(ctx, prop);
  });
};

GP.Game.prototype.drawDepthSortedScene = function(ctx) {
  const renderables = [];
  const zoom = GP.CONFIG.camera.zoom || 1;

  GP.GameMap.getVisibleProps(this.camera, this.canvas, zoom).forEach(prop => {
    renderables.push({
      sortY: prop.sortY,
      draw: () => GP.GameMap.drawProp(ctx, prop)
    });
  });

  this.npcs.forEach(npc => {
    renderables.push({
      sortY: npc.y + 34,
      draw: () => this.drawNpc(ctx, npc)
    });
  });

  this.enemies.forEach(enemy => {
    renderables.push({
      sortY: enemy.y + enemy.r,
      draw: () => this.drawEnemy(ctx, enemy)
    });
  });

  renderables.push({
    sortY: this.player.y + this.player.r,
    draw: () => this.drawPlayer(ctx)
  });

  renderables
    .sort((a, b) => a.sortY - b.sortY)
    .forEach(item => item.draw());
};

GP.Game.prototype.drawNpc = function(ctx, npc) {
  const color = npc.cor || "#35d96f";
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#071827";
  ctx.beginPath();
  ctx.ellipse(npc.x, npc.y + 18, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#267c47";
  ctx.fillRect(npc.x - 12, npc.y - 2, 24, 24);
  ctx.fillStyle = color;
  ctx.fillRect(npc.x - 15, npc.y - 18, 30, 20);
  ctx.fillStyle = "#f1c086";
  ctx.beginPath();
  ctx.arc(npc.x, npc.y - 26, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#14251d";
  ctx.fillRect(npc.x - 13, npc.y - 40, 26, 10);
  ctx.fillRect(npc.x - 8, npc.y + 22, 6, 15);
  ctx.fillRect(npc.x + 2, npc.y + 22, 6, 15);
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(npc.x - 5, npc.y - 27, 2.5, 0, Math.PI * 2);
  ctx.arc(npc.x + 5, npc.y - 27, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe66d";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  ctx.fillText("!", npc.x, npc.y - 30);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px Arial";
  ctx.fillText(npc.nome, npc.x, npc.y + 34);
  if (npc.titulo) {
    ctx.fillStyle = "#d9f4ff";
    ctx.font = "bold 8px Arial";
    ctx.fillText(npc.titulo, npc.x, npc.y + 45);
  }
  ctx.restore();
  if (GP.Utils.dist(this.player.x, this.player.y, npc.x, npc.y) < 110) {
    ctx.fillStyle = "#ffe66d";
    ctx.font = "bold 11px Arial";
    ctx.fillText("Aperte E", npc.x, npc.y - 48);
  }
};

GP.Game.prototype.drawInteractablePrompt = function(ctx) {
  const item = GP.GameMap.getNearbyInteractable(this.player.x, this.player.y);
  if (!item || this.getNearbyNpc()) return;

  ctx.fillStyle = item.used ? "#b9c7cf" : "#ffe66d";
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.fillText("E - " + item.label, item.x, item.y - item.r - 24);
};

GP.Game.prototype.drawPlayer = function(ctx) {
  const pose = this.getPlayerPose();

  ctx.save();
  if (this.player.invencivel > 0 && this.frame % 8 < 4) ctx.globalAlpha = 0.48;
  this.drawPlayerShadow(ctx, pose);
  if (this.player.estado === "skill") this.drawSkillWindup(ctx, pose);
  if (this.player.estado === "punch" && GP.Assets.cleanPunchSheet) this.drawPunchSprite(ctx, pose);
  else this.drawPlayerSprite(ctx, pose);
  if (this.player.estado === "attack") this.drawAttackArc(ctx, pose);
  ctx.restore();

  this.drawBar(ctx, this.player.x - 21, this.player.y - 52, 42, 5, this.player.vida, this.player.vidaMax, "#30ff68");
  ctx.fillStyle = "#fff";
  ctx.font = "bold 9px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Gabriel", this.player.x, this.player.y + 26);
};

GP.Game.prototype.getPlayerPose = function() {
  const player = this.player;
  const facing = player.facing || "right";
  let sprite = this.sprites.frente;
  let flip = false;

  if (facing === "up") sprite = this.sprites.costas;
  if (facing === "down") sprite = this.sprites.frente;
  if (facing === "left" || facing === "right") {
    sprite = this.sprites.lado;
    flip = facing === "right";
  }

  if ((player.estado === "skill" || player.estado === "attack" || player.estado === "punch") && (facing === "left" || facing === "right")) {
    sprite = this.sprites.skill;
    flip = facing === "right";
  }

  const walkCycle = player.estado === "walk" ? Math.sin(player.walkTime * 0.55) : 0;
  const actionDuration = player.actionDuration || 1;
  const actionProgress = player.estadoTempo > 0 ? 1 - player.estadoTempo / actionDuration : 1;
  const casting = player.estado === "skill" && player.estadoTempo > 0;
  const attacking = (player.estado === "attack" || player.estado === "punch") && player.estadoTempo > 0;

  let bob = walkCycle * 5;
  let sway = walkCycle * 2.5;
  let scaleX = 1;
  let scaleY = 1;
  let rotation = 0;

  if (casting) {
    const pulse = Math.sin(actionProgress * Math.PI);
    bob -= pulse * 7;
    scaleX += pulse * 0.08;
    scaleY += pulse * 0.08;
    rotation = (facing === "left" ? -1 : 1) * pulse * 0.04;
  }

  if (attacking) {
    const slash = Math.sin(actionProgress * Math.PI);
    const side = facing === "left" ? -1 : 1;
    sway += side * slash * 8;
    rotation = side * slash * 0.08;
  }

  return {
    sprite,
    flip,
    facing,
    x: player.x + sway,
    y: player.y + bob,
    scaleX,
    scaleY,
    rotation,
    actionProgress,
    walkCycle
  };
};

GP.Game.prototype.drawPlayerSprite = function(ctx, pose) {
  const sheet = GP.Assets.cleanPlayerSheet;
  if (!sheet) {
    ctx.fillStyle = "#ffe66d";
    ctx.beginPath();
    ctx.arc(pose.x, pose.y, this.player.r, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const sprite = pose.sprite;
  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.rotate(pose.rotation);
  ctx.scale(pose.flip ? -pose.scaleX : pose.scaleX, pose.scaleY);

  if (pose.flip) {
    ctx.drawImage(sheet, sprite.sx, sprite.sy, sprite.sw, sprite.sh, sprite.offX, sprite.offY, sprite.dw, sprite.dh);
  } else {
    ctx.drawImage(sheet, sprite.sx, sprite.sy, sprite.sw, sprite.sh, sprite.offX, sprite.offY, sprite.dw, sprite.dh);
  }
  ctx.restore();
};

GP.Game.prototype.drawPunchSprite = function(ctx, pose) {
  const frontPunch = this.player.facing === "down" && GP.Assets.cleanPunchFrontSheet;
  const backPunch = this.player.facing === "up" && GP.Assets.cleanPunchBackSheet;
  const sheet = frontPunch ? GP.Assets.cleanPunchFrontSheet : backPunch ? GP.Assets.cleanPunchBackSheet : GP.Assets.cleanPunchSheet;
  const actionProgress = Math.max(0, Math.min(0.999, pose.actionProgress || 0));
  const frame = Math.floor(actionProgress * 4);
  const frameW = Math.floor(sheet.width / 4);
  const frameH = sheet.height;
  const flip = !frontPunch && !backPunch && this.player.dirX < 0;

  ctx.save();
  ctx.translate(this.player.x, this.player.y);
  ctx.rotate(frontPunch || backPunch ? 0 : (this.player.dirY || 0) * 0.07);
  ctx.scale(flip ? -1 : 1, 1);
  ctx.drawImage(sheet, frame * frameW, 0, frameW, frameH, frontPunch || backPunch ? -31 : -30, frontPunch || backPunch ? -59 : -58, 62, 72);
  ctx.restore();
};

GP.Game.prototype.drawPlayerShadow = function(ctx, pose) {
  const width = 24 + Math.abs(pose.walkCycle) * 3;
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#071827";
  ctx.beginPath();
  ctx.ellipse(this.player.x, this.player.y + 14, width, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (this.player.estado === "walk") {
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#1e3b2a";
    ctx.beginPath();
    ctx.ellipse(this.player.x - pose.walkCycle * 4, this.player.y + 19, 7, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(this.player.x + pose.walkCycle * 4, this.player.y + 20, 7, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

GP.Game.prototype.drawSkillWindup = function(ctx, pose) {
  const p = this.player;
  const fruit = p.fruta || GP.CONFIG.fruits[0];
  const pulse = Math.sin(pose.actionProgress * Math.PI);
  const dir = this.getDirectionVector(pose.facing);
  const handX = p.x + dir.x * (24 + pulse * 10);
  const handY = p.y + dir.y * (24 + pulse * 10) - 14;

  ctx.save();
  ctx.globalAlpha = 0.35 + pulse * 0.35;
  ctx.strokeStyle = fruit.cor;
  ctx.fillStyle = fruit.cor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 10, 24 + pulse * 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowColor = fruit.cor;
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(handX, handY, 7 + pulse * 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

GP.Game.prototype.drawAttackArc = function(ctx, pose) {
  const p = this.player;
  const dir = p.estado === "punch" ? GP.Utils.normalize(p.dirX, p.dirY) : this.getDirectionVector(pose.facing);
  const angle = Math.atan2(dir.y, dir.x);
  const progress = pose.actionProgress;

  ctx.save();
  ctx.translate(p.x + dir.x * 22, p.y + dir.y * 22 - 12);
  ctx.rotate(angle);
  ctx.globalAlpha = Math.sin(progress * Math.PI);
  ctx.strokeStyle = "#fff7d1";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, 0, 28, -0.75, 0.75);
  ctx.stroke();
  ctx.restore();
};

GP.Game.prototype.getDirectionVector = function(facing) {
  if (facing === "left") return { x: -1, y: 0 };
  if (facing === "right") return { x: 1, y: 0 };
  if (facing === "up") return { x: 0, y: -1 };
  return { x: 0, y: 1 };
};

GP.Game.prototype.drawEnemies = function(ctx) {
  for (const enemy of this.enemies) {
    this.drawEnemy(ctx, enemy);
  }
};

GP.Game.prototype.drawEnemy = function(ctx, enemy) {
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#071827";
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + 17, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = enemy.cor;
  ctx.fillRect(enemy.x - 12, enemy.y - 6, 24, 24);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(enemy.x - 12, enemy.y - 6, 8, 24);
  ctx.fillStyle = "#d6a06f";
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y - 19, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#22151a";
  ctx.fillRect(enemy.x - 12, enemy.y - 31, 24, 7);
  ctx.fillRect(enemy.x - 8, enemy.y + 18, 6, 13);
  ctx.fillRect(enemy.x + 2, enemy.y + 18, 6, 13);
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(enemy.x - 5, enemy.y - 20, 2.5, 0, Math.PI * 2);
  ctx.arc(enemy.x + 5, enemy.y - 20, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  this.drawBar(ctx, enemy.x - 20, enemy.y - 32, 40, 5, enemy.vida, enemy.vidaMax, "#ff3030");
  ctx.fillStyle = "#fff";
  ctx.font = "9px Arial";
  ctx.textAlign = "center";
  ctx.fillText(enemy.nome, enemy.x, enemy.y + 31);
};

GP.Game.prototype.drawAttacks = function(ctx) {
  for (const attack of this.attacks) {
    if (attack.melee) continue;
    ctx.save();
    ctx.shadowColor = attack.cor;
    ctx.shadowBlur = 18;
    ctx.fillStyle = attack.cor;
    if (attack.luz) {
      ctx.fillRect(attack.x - 30, attack.y - 5, 60, 10);
    } else {
      ctx.beginPath();
      ctx.arc(attack.x, attack.y, attack.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

GP.Game.prototype.drawImpactEffects = function(ctx) {
  const sheet = GP.Assets.cleanPunchImpactSheet;
  if (!sheet) return;

  for (const effect of this.impactEffects) {
    const progress = Math.max(0, Math.min(0.999, effect.age / effect.duration));
    const frame = Math.min(effect.frames - 1, Math.floor(progress * effect.frames));
    const frameW = Math.floor(sheet.width / effect.frames);
    const frameH = sheet.height;
    const width = effect.width * (0.86 + progress * 0.18);
    const height = effect.height * (0.9 + progress * 0.16);
    const push = effect.fromFist ? progress * 36 : progress * 18;

    ctx.save();
    ctx.translate(effect.x, effect.y);
    ctx.rotate(effect.angle);
    ctx.globalAlpha = 1 - Math.max(0, progress - 0.62) / 0.38;
    ctx.drawImage(sheet, frame * frameW, 0, frameW, frameH, -12 + push, -height / 2, width, height);
    ctx.restore();
  }
};

GP.Game.prototype.drawCoins = function(ctx) {
  for (const coin of this.coins) {
    ctx.fillStyle = "#ffe66d";
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7a5a00";
    ctx.font = "bold 8px Arial";
    ctx.textAlign = "center";
    ctx.fillText("$", coin.x, coin.y + 3);
  }
};

GP.Game.prototype.drawParticles = function(ctx) {
  for (const p of this.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(p.vida / 50, 0);
    ctx.strokeStyle = p.cor;
    ctx.fillStyle = p.cor;
    if (p.onda) {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

GP.Game.prototype.drawTexts = function(ctx) {
  for (const t of this.texts) {
    ctx.save();
    ctx.globalAlpha = t.vida / 60;
    ctx.fillStyle = t.cor;
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(t.texto, t.x, t.y);
    ctx.restore();
  }
};

GP.Game.prototype.drawBar = function(ctx, x, y, w, h, value, max, color) {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(value / max, 0), h);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
};

GP.Game.prototype.loop = function() {
  if (!this.running) return;

  this.frame++;
  this.updatePlayer();
  this.updateEnemies();
  this.updateAttacks();
  this.updateCoins();
  this.updateParticles();
  this.updateImpactEffects();
  this.updateTexts();
  this.updateCooldowns();
  this.updateCamera();
  GP.UI.updateHud(this.player, this.getActiveQuestForHud(), GP.CONFIG.quests);
  this.draw();

  requestAnimationFrame(() => this.loop());
};
