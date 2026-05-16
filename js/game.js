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
  this.perf = {
    maxParticles: GP.AssetManifest.policy.maxLiveParticles || 120,
    particleScale: GP.AssetManifest.policy.particleBudgetScale || 0.45,
    skippedParticles: 0
  };
  this.quests = {};
  this.selectedQuestId = null;
  this.selectedHotbarSlot = 0;
  this.itemCatalog = {
    baseFighting: {
      id: "baseFighting",
      nome: "Estilo de luta base",
      tipo: "fighting",
      icon: "assets/generated/runtime/ui-icon-base-punch.png"
    },
    mihawkKogatana: {
      id: "mihawkKogatana",
      nome: "Kogatana do Mihawk",
      tipo: "sword",
      icon: "assets/generated/runtime/ui-icon-kogatana.png"
    },
    basicKatana: {
      id: "basicKatana",
      nome: "Katana sem nome",
      tipo: "sword",
      icon: "assets/generated/runtime/ui-icon-kogatana.png",
      customizableName: true,
      aiProfileKey: "katanaNameProfile",
      aiProfile: {
        source: "default",
        color: "#d9f4ff",
        damageScale: 1,
        rangeScale: 1,
        cooldownScale: 1
      }
    }
  };
  this.weaponProfiles = {};
  this.hotbarItems = [this.itemCatalog.baseFighting, null, null, null, null, null, null, null, null];
  this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
  this.mapEditor = { active: false, block: "grass", layer: "solid", tool: "paint" };
  this.shake = 0;
  this.storageKey = "gabrielPieceProgress";
  this.view = { width: window.innerWidth, height: window.innerHeight, dpr: 1 };
  this.scene = "exterior";
  this.exteriorReturn = null;
  this.enteredFromRightDoor = false;
  this.shanksIntroDone = false;

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
  this.canvas.addEventListener("contextmenu", e => {
    if (this.mapEditor.active) e.preventDefault();
  });
  this.setupHotbarControls();
};

GP.Game.prototype.resize = function() {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  this.view = { width: window.innerWidth, height: window.innerHeight, dpr };
  this.canvas.width = Math.floor(this.view.width * dpr);
  this.canvas.height = Math.floor(this.view.height * dpr);
  this.canvas.style.width = this.view.width + "px";
  this.canvas.style.height = this.view.height + "px";
  this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  this.ctx.imageSmoothingEnabled = true;
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

GP.Game.prototype.getSelectedHotbarItem = function() {
  return this.hotbarItems[this.selectedHotbarSlot] || null;
};

GP.Game.prototype.createDefaultWeaponProfile = function(name) {
  return {
    name: name || "Katana sem nome",
    source: "manual",
    color: "#d9f4ff",
    damageScale: 1,
    rangeScale: 1,
    cooldownScale: 1
  };
};

GP.Game.prototype.setWeaponNameProfile = function(itemId, name, profile) {
  const item = this.itemCatalog[itemId];
  if (!item || !item.customizableName) return false;
  const finalProfile = Object.assign(this.createDefaultWeaponProfile(name), profile || {});
  item.customName = finalProfile.name;
  item.nome = finalProfile.name;
  item.aiProfile = finalProfile;
  this.weaponProfiles[itemId] = finalProfile;
  this.updateHotbarSlots();
  this.saveProgress();
  return true;
};

GP.Game.prototype.getWeaponProfile = function(item) {
  if (!item) return null;
  return this.weaponProfiles[item.id] || item.aiProfile || null;
};

GP.Game.prototype.updateHotbarSlots = function() {
  if (!this.hotbarSlots) return;
  this.hotbarSlots.forEach((slot, index) => {
    const item = this.hotbarItems[index];
    let icon = slot.querySelector(".slot-item-icon");
    if (item) {
      if (!icon) {
        icon = document.createElement("img");
        icon.className = "slot-item-icon";
        slot.insertBefore(icon, slot.firstChild);
      }
      icon.src = item.icon;
      icon.alt = item.nome;
      icon.title = item.nome;
    } else if (icon) {
      icon.remove();
    }
    slot.classList.toggle("equipped", !!item);
  });
};

GP.Game.prototype.selectHotbarSlot = function(index) {
  this.selectedHotbarSlot = (index + 9) % 9;
  if (!this.hotbarSlots) return;

  this.hotbarSlots.forEach((slot, slotIndex) => {
    slot.classList.toggle("active", slotIndex === this.selectedHotbarSlot);
  });
  this.updateHotbarSlots();
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

GP.Game.prototype.aimPlayerAt = function(targetX, targetY) {
  const dirX = targetX < this.player.x ? -1 : 1;
  const dir = { x: dirX, y: 0 };
  this.player.dirX = dir.x;
  this.player.dirY = 0;
  this.player.facing = this.getFacingDirection(this.player.dirX, this.player.dirY);
  return dir;
};

GP.Game.prototype.aimPlayerAtMouse = function() {
  return this.aimPlayerAt(this.mouse.worldX || this.player.x + this.player.dirX * 90, this.mouse.worldY || this.player.y + this.player.dirY * 90);
};

GP.Game.prototype.getMouseAngle = function(offset) {
  const dir = this.aimPlayerAtMouse();
  const base = Math.atan2(dir.y, dir.x);
  return base + (offset || 0);
};

GP.Game.prototype.onMouseDown = function(event) {
  this.updateMousePosition(event);
  if (this.mapEditor.active) {
    this.applyMapEditorAtMouse(event.button === 2 ? "erase" : null);
    event.preventDefault();
    return;
  }
  if (event.button !== 0) return;
  if (!this.running || document.body.classList.contains("menu-open")) return;
  const selectedItem = this.getSelectedHotbarItem();
  if (selectedItem && selectedItem.id === "baseFighting") {
    this.basicClosePunchAt(this.mouse.worldX, this.mouse.worldY);
    event.preventDefault();
  }
  if (selectedItem && selectedItem.id === "mihawkKogatana") {
    this.kogatanaSlashAt(this.mouse.worldX, this.mouse.worldY);
    event.preventDefault();
  }
};

GP.Game.prototype.setMapEditorOptions = function(options) {
  this.mapEditor = Object.assign(this.mapEditor, options || {});
};

GP.Game.prototype.toggleMapEditor = function(force) {
  this.mapEditor.active = typeof force === "boolean" ? force : !this.mapEditor.active;
  GP.UI.showToast(this.mapEditor.active ? "Editor de mapa ligado." : "Editor de mapa desligado.");
  return this.mapEditor.active;
};

GP.Game.prototype.applyMapEditorAtMouse = function(forceTool) {
  const size = GP.GameMap.blockSize;
  const col = Math.floor(this.mouse.worldX / size);
  const row = Math.floor(this.mouse.worldY / size);
  const tool = forceTool || this.mapEditor.tool || "paint";
  const ok = GP.GameMap.setEditorBlock(col, row, this.mapEditor.block, this.mapEditor.layer, tool);
  if (!ok) return;

  const layerLabel = {
    solid: "solido",
    background: "fundo",
    invisible: "invisivel",
    npcMarker: "NPC",
    imageMarker: "imagem"
  }[this.mapEditor.layer] || "mapa";
  GP.UI.showToast(tool === "erase" ? "Apagado em " + layerLabel + "." : "Marcado em " + layerLabel + ".");
};

GP.Game.prototype.placeActorOnGround = function(actor) {
  if (!actor || !GP.GameMap.getGroundY) return;
  actor.y = GP.GameMap.getGroundY(actor.x);
  actor.vy = 0;
  actor.onGround = true;
};

GP.Game.prototype.placeActorsOnGround = function() {
  this.placeActorOnGround(this.player);
  this.getSceneNpcs().forEach(npc => this.placeActorOnGround(npc));
  if (this.scene === "exterior") this.enemies.forEach(enemy => this.placeActorOnGround(enemy));
};

GP.Game.prototype.getSceneNpcs = function() {
  return this.scene === "shanksHouse" ? (this.interiorNpcs || []) : (this.npcs || []);
};

GP.Game.prototype.isNearHouseDoor = function() {
  if (this.scene !== "exterior") return false;
  const door = GP.GameMap.shanksHouseDoor;
  const x = door.col * GP.GameMap.blockSize + GP.GameMap.blockSize / 2;
  const y = door.row * GP.GameMap.blockSize + GP.GameMap.blockSize;
  return GP.Utils.dist(this.player.x, this.player.y, x, y) <= 92;
};

GP.Game.prototype.isNearHouseRightDoor = function() {
  if (this.scene !== "exterior") return false;
  const door = GP.GameMap.shanksHouseRightDoor;
  const x = door.col * GP.GameMap.blockSize + GP.GameMap.blockSize / 2;
  const y = door.row * GP.GameMap.blockSize + GP.GameMap.blockSize;
  return GP.Utils.dist(this.player.x, this.player.y, x, y) <= 92;
};

GP.Game.prototype.enterShanksHouse = function(fromRightDoor) {
  this.exteriorReturn = { x: this.player.x, y: this.player.y };
  this.enteredFromRightDoor = fromRightDoor || false;
  this.scene = "shanksHouse";
  GP.GameMap.enterInterior("shanksHouse");
  const exitPoint = fromRightDoor ? GP.GameMap.interiorRightExit : GP.GameMap.interiorExit;
  this.player.x = exitPoint.col * GP.GameMap.blockSize + (fromRightDoor ? -GP.GameMap.blockSize * 1.8 : GP.GameMap.blockSize * 1.8);
  this.player.y = exitPoint.row * GP.GameMap.blockSize;
  this.placeActorsOnGround();
  this.camera.x = Math.max(0, this.player.x - this.view.width / (GP.CONFIG.camera.zoom || 1) / 2);
  GP.UI.showToast("Voce entrou na casa.");
};

GP.Game.prototype.exitShanksHouse = function(forceExteriorReturn) {
  this.scene = "exterior";
  GP.GameMap.exitInterior();
  const door = this.enteredFromRightDoor ? GP.GameMap.shanksHouseRightDoor : GP.GameMap.shanksHouseDoor;
  if (forceExteriorReturn && this.exteriorReturn) {
    this.player.x = this.exteriorReturn.x;
    this.player.y = this.exteriorReturn.y;
  } else {
    this.player.x = door.col * GP.GameMap.blockSize + (this.enteredFromRightDoor ? 36 : -36);
    this.player.y = door.row * GP.GameMap.blockSize + GP.GameMap.blockSize;
  }
  this.placeActorOnGround(this.player);
  this.enteredFromRightDoor = false;
  GP.UI.showToast("Voce saiu da casa.");
};

GP.Game.prototype.handleDoorEnter = function() {
  if (!this.player) return;
  if (this.scene === "shanksHouse") {
    const leftExitX = GP.GameMap.interiorExit.col * GP.GameMap.blockSize + GP.GameMap.blockSize / 2;
    const leftExitY = GP.GameMap.interiorExit.row * GP.GameMap.blockSize + GP.GameMap.blockSize;
    const rightExitX = GP.GameMap.interiorRightExit.col * GP.GameMap.blockSize + GP.GameMap.blockSize / 2;
    const rightExitY = GP.GameMap.interiorRightExit.row * GP.GameMap.blockSize + GP.GameMap.blockSize;
    const nearLeft = GP.Utils.dist(this.player.x, this.player.y, leftExitX, leftExitY) <= 96;
    const nearRight = GP.Utils.dist(this.player.x, this.player.y, rightExitX, rightExitY) <= 96;
    if (nearLeft || nearRight) this.exitShanksHouse();
    else GP.UI.showToast("Chegue perto da porta para sair.");
    return;
  }
  if (this.isNearHouseDoor()) this.enterShanksHouse();
  else if (this.isNearHouseRightDoor()) this.enterShanksHouse(true);
  else GP.UI.showToast("Nao ha nenhuma entrada perto.");
};

GP.Game.prototype.start = function() {
  GP.UI.hideMenu();
  this.scene = "exterior";
  GP.GameMap.exitInterior();
  this.player = GP.Entities.createPlayer();
  this.npcs = GP.CONFIG.questNpcs.map(data => GP.Entities.createNpc(data));
  this.interiorNpcs = [
    GP.Entities.createNpc({
      id: "redhairMentor",
      x: 15 * GP.GameMap.blockSize + GP.GameMap.blockSize / 2,
      y: 624,
      r: 18,
      name: "Capitao Ruivo",
      title: "Grande Pirata",
      spriteId: "npcRedhairMentor"
    })
  ];
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
  this.loadProgress();
  this.placeActorOnGround(this.player);
  this.npcs.forEach(npc => this.placeActorOnGround(npc));

  Object.keys(GP.CONFIG.campEnemies).forEach(campId => {
    const camp = GP.CONFIG.campEnemies[campId];
    for (let i = 0; i < camp.count; i++) this.enemies.push(GP.Entities.createEnemy(campId, i));
  });
  this.enemies.forEach(enemy => this.placeActorOnGround(enemy));

  this.running = true;
  requestAnimationFrame(() => this.loop());
};

GP.Game.prototype.onKeyDown = function(event) {
  if (event.target && event.target.closest && event.target.closest("input, textarea, select, button")) return;

  const key = event.key.toLowerCase();
  if (/^[1-9]$/.test(key)) {
    this.selectHotbarSlot(Number(key) - 1);
    event.preventDefault();
    return;
  }

  this.keys[key] = true;
  if (key === " " || key === "w") event.preventDefault();

  if (!this.running) return;

  if (key === "z") {
    this.useFistZ();
    event.preventDefault();
  }

  if (key === "x") {
    this.useFistX();
    event.preventDefault();
  }

  if (key === "e") {
    this.handleInventoryOrInteract();
    event.preventDefault();
  }

  if (key === "f") {
    this.handleDoorEnter();
    event.preventDefault();
  }

  if (key === "f8" && window.verificarVisual) {
    window.verificarVisual();
    event.preventDefault();
  }
};

GP.Game.prototype.moveWithCollision = function(obj, dx, dy) {
  const oldX = obj.x;
  const oldY = obj.y;
  obj.x += dx;
  obj.x = GP.Utils.clamp(obj.x, obj.r, GP.CONFIG.world.width - obj.r);
  if (!this.canActorMoveTo(obj, obj.x, obj.y, oldX, oldY)) obj.x = oldX;
  obj.y += dy;
  const groundY = GP.GameMap.getGroundYBelow ? GP.GameMap.getGroundYBelow(obj.x, obj.y) : GP.GameMap.getGroundY(obj.x);
  if (obj.y > groundY) obj.y = groundY;
};

GP.Game.prototype.getActorCollisionHeight = function(obj) {
  if (obj === this.player) return 74;
  return Math.max(42, (obj.r || 12) * 4.6);
};

GP.Game.prototype.canActorMoveTo = function(obj, x, y, oldX, oldY) {
  const radius = obj.r || 12;
  if (!GP.GameMap.canWalk(x, y, radius)) return false;
  if (GP.GameMap.actorOverlapsSolid && GP.GameMap.actorOverlapsSolid(x, y, radius, this.getActorCollisionHeight(obj))) return false;

  const oldGroundY = GP.GameMap.getGroundYBelow ? GP.GameMap.getGroundYBelow(oldX, oldY || y) : GP.GameMap.getGroundY(oldX);
  const nextGroundY = GP.GameMap.getGroundYBelow ? GP.GameMap.getGroundYBelow(x, y) : GP.GameMap.getGroundY(x);
  const wasGrounded = Math.abs((oldY || y) - oldGroundY) <= 6;
  const stepLimit = 14;
  if (wasGrounded && nextGroundY < oldGroundY - stepLimit && nextGroundY < y - stepLimit) return false;
  return true;
};

GP.Game.prototype.updatePlayer = function() {
  let mx = 0;

  if (this.keys.a) mx -= 1;
  if (this.keys.d) mx += 1;

  if ((this.keys.w || this.keys[" "] || this.keys.space) && this.player.onGround) {
    this.player.vy = -13.2;
    this.player.onGround = false;
  }

  if (mx) {
    this.player.dirX = mx < 0 ? -1 : 1;
    this.player.dirY = 0;
    this.player.facing = this.getFacingDirection(this.player.dirX, 0);
    this.player.walkTime++;
    if (this.player.estadoTempo <= 0) this.player.estado = "walk";
  } else if (this.player.estadoTempo <= 0) {
    this.player.estado = "idle";
    this.player.walkTime = 0;
  }

  this.player.vx = mx * this.player.velocidade;
  this.player.vy = Math.min(18, (this.player.vy || 0) + 0.72);
  const oldX = this.player.x;
  const oldY = this.player.y;
  this.player.x += this.player.vx;
  this.player.x = GP.Utils.clamp(this.player.x, this.player.r, GP.CONFIG.world.width - this.player.r);
  if (!this.canActorMoveTo(this.player, this.player.x, this.player.y, oldX, oldY)) this.player.x = oldX;

  const groundY = GP.GameMap.getGroundYBelow ? GP.GameMap.getGroundYBelow(this.player.x, this.player.y) : GP.GameMap.getGroundY(this.player.x);
  this.player.y += this.player.vy;
  if (this.player.y >= groundY) {
    this.player.y = groundY;
    this.player.vy = 0;
    this.player.onGround = true;
  } else {
    this.player.onGround = false;
    if (this.player.estadoTempo <= 0) this.player.estado = "jump";
  }
};

GP.Game.prototype.getFacingDirection = function(dx, dy) {
  return dx < 0 ? "left" : "right";
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

GP.Game.prototype.getProgressData = function() {
  const fruitIndex = GP.CONFIG.fruits.findIndex(fruit => fruit.nome === this.player.fruta.nome);
  return {
    player: {
      nivel: this.player.nivel,
      xp: this.player.xp,
      xpMax: this.player.xpMax,
      moedas: this.player.moedas,
      statPoints: this.player.statPoints,
      stats: this.player.stats,
      vidaMax: this.player.vidaMax,
      dano: this.player.dano,
      frutaIndex: Math.max(0, fruitIndex),
      socoMaestria: this.player.socoMaestria,
      socoMaestriaXp: this.player.socoMaestriaXp,
      socoMaestriaMax: this.player.socoMaestriaMax,
      espadaMaestria: this.player.espadaMaestria,
      espadaMaestriaXp: this.player.espadaMaestriaXp,
      espadaMaestriaMax: this.player.espadaMaestriaMax,
      weaponProfiles: this.weaponProfiles,
      hotbarItems: this.hotbarItems.map(item => item ? item.id : null),
      selectedHotbarSlot: this.selectedHotbarSlot
    },
    quests: this.quests
  };
};

GP.Game.prototype.saveProgress = function() {
  if (!this.player) return;
  try {
    localStorage.setItem(this.storageKey, JSON.stringify(this.getProgressData()));
  } catch (error) {
    this.savedProgress = this.getProgressData();
  }
  this.savedProgress = this.getProgressData();
};

GP.Game.prototype.loadProgress = function() {
  let data = this.savedProgress;
  try {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) data = JSON.parse(raw);
  } catch (error) {}

  if (!data || !data.player) return;
  const p = data.player;
  this.player.nivel = p.nivel || this.player.nivel;
  this.player.xp = p.xp || 0;
  this.player.xpMax = p.xpMax || this.player.xpMax;
  this.player.moedas = p.moedas === undefined ? this.player.moedas : p.moedas;
  this.player.statPoints = p.statPoints || 0;
  this.player.stats = Object.assign(this.player.stats, p.stats || {});
  this.applyStats(false);
  this.player.fruta = GP.CONFIG.fruits[p.frutaIndex] || this.player.fruta;
  this.player.socoMaestria = p.socoMaestria || 0;
  this.player.socoMaestriaXp = p.socoMaestriaXp || 0;
  this.player.socoMaestriaMax = p.socoMaestriaMax || this.getFistMasteryRequirement(this.player.socoMaestria);
  this.player.espadaMaestria = p.espadaMaestria || 0;
  this.player.espadaMaestriaXp = p.espadaMaestriaXp || 0;
  this.player.espadaMaestriaMax = p.espadaMaestriaMax || this.getMasteryRequirement(this.player.espadaMaestria);
  this.weaponProfiles = Object.assign({}, p.weaponProfiles || {});
  Object.keys(this.weaponProfiles).forEach(itemId => {
    const item = this.itemCatalog[itemId];
    const profile = this.weaponProfiles[itemId];
    if (item && item.customizableName && profile) {
      item.customName = profile.name;
      item.nome = profile.name || item.nome;
      item.aiProfile = profile;
    }
  });
  if (Array.isArray(p.hotbarItems)) {
    this.hotbarItems = p.hotbarItems.map(id => this.itemCatalog[id] || null);
    if (!this.hotbarItems[0]) this.hotbarItems[0] = this.itemCatalog.baseFighting;
    while (this.hotbarItems.length < 9) this.hotbarItems.push(null);
  }
  if (p.selectedHotbarSlot !== undefined) this.selectedHotbarSlot = p.selectedHotbarSlot;
  this.selectHotbarSlot(this.selectedHotbarSlot || 0);

  if (data.quests) {
    Object.keys(this.quests).forEach(id => {
      if (data.quests[id]) this.quests[id] = Object.assign(this.quests[id], data.quests[id]);
    });
  }
};

GP.Game.prototype.applyStats = function(healToMax) {
  const stats = this.player.stats || {};
  const oldMax = this.player.vidaMax;
  this.player.vidaMax = this.player.baseVidaMax + (stats.saude || 0) * 12;
  this.player.dano = this.player.baseDano + (stats.corpo || 0) * 2;
  this.player.espadaDano = (stats.espada || 0) * 2;
  this.player.frutaDano = (stats.fruta || 0) * 2;

  if (healToMax) this.player.vida = this.player.vidaMax;
  else this.player.vida = Math.min(this.player.vida + Math.max(0, this.player.vidaMax - oldMax), this.player.vidaMax);
};

GP.Game.prototype.upgradeStat = function(stat) {
  if (!this.player || (this.player.statPoints || 0) <= 0) {
    GP.UI.showToast("Voce nao tem pontos de estatistica.");
    return;
  }
  if (!this.player.stats || this.player.stats[stat] === undefined) return;

  this.player.stats[stat]++;
  this.player.statPoints--;
  this.applyStats(stat === "saude");
  this.saveProgress();
  GP.UI.updateStatsPanel(this.player);
  GP.UI.showToast("Estatistica evoluida.");
};

GP.Game.prototype.basicClosePunchAt = function(targetX, targetY) {
  if (this.player.cooldownAtaque > 0) return;

  const dir = this.aimPlayerAt(targetX, targetY);
  this.player.facing = this.getFacingDirection(this.player.dirX, this.player.dirY);
  this.player.cooldownAtaque = 18;
  this.player.estado = "punch";
  this.player.estadoTempo = 14;
  this.player.actionDuration = 14;

  const hitX = this.player.x + this.player.dirX * 26;
  const hitY = this.player.y + this.player.dirY * 26;
  const damage = Math.max(2, Math.floor(this.player.dano * 0.46));
  for (let i = this.enemies.length - 1; i >= 0; i--) {
    const enemy = this.enemies[i];
    if (GP.Utils.dist(hitX, hitY, enemy.x, enemy.y) <= enemy.r + 22) {
      enemy.aggro = true;
      enemy.vida -= damage;
      this.pushObject(enemy, this.player.x, this.player.y, 8);
      this.createText(enemy.x, enemy.y - 35, "-" + damage, "#fff7d1");
      if (enemy.vida <= 0) this.killEnemy(i);
    }
  }

};

GP.Game.prototype.useFistZ = function() {
  const item = this.getSelectedHotbarItem();
  if (!this.running || !item) return;
  if (item.id === "mihawkKogatana") {
    this.useKogatanaZ();
    return;
  }
  if (item.id !== "baseFighting") return;
  if ((this.player.socoMaestria || 0) < 5) {
    GP.UI.showToast("Soco no Ar desbloqueia com maestria 5.");
    return;
  }
  if (this.player.cooldownSocoZ > 0) {
    GP.UI.showToast("Soco no Ar ainda esta recarregando.");
    return;
  }
  this.airPunchAt(this.mouse.worldX || this.player.x + this.player.dirX * 90, this.mouse.worldY || this.player.y + this.player.dirY * 90);
};

GP.Game.prototype.useFistX = function() {
  const item = this.getSelectedHotbarItem();
  if (!this.running || !item) return;
  if (item.id === "mihawkKogatana") {
    this.useKogatanaX();
    return;
  }
  if (item.id !== "baseFighting") return;
  if ((this.player.socoMaestria || 0) < 10) {
    GP.UI.showToast("Impacto do Corsario desbloqueia com maestria 10.");
    return;
  }
  if (this.player.cooldownSocoX > 0) {
    GP.UI.showToast("Impacto do Corsario ainda esta recarregando.");
    return;
  }
  this.groundSlam();
};

GP.Game.prototype.kogatanaSlashAt = function(targetX, targetY) {
  if (this.player.cooldownAtaque > 0) return;

  const dir = this.aimPlayerAt(targetX, targetY);
  this.player.cooldownAtaque = 24;
  this.player.estado = "kogatanaM1";
  this.player.estadoTempo = 24;
  this.player.actionDuration = 24;

  const damage = Math.max(4, Math.floor(this.player.dano * 0.42 + (this.player.espadaDano || 0) * 0.9 + (this.player.espadaMaestria || 0) * 0.42));
  const hitX = this.player.x + this.player.dirX * 34;
  const hitY = this.player.y + this.player.dirY * 34;

  this.attacks.push({
    x: hitX,
    y: hitY,
    vx: this.player.dirX * 2,
    vy: this.player.dirY * 2,
    r: 34,
    dano: damage,
    vida: 6,
    cor: "#ffe08a",
    melee: true,
    sword: true,
    ownerItem: "mihawkKogatana"
  });
};

GP.Game.prototype.useKogatanaZ = function() {
  if ((this.player.espadaMaestria || 0) < 5) {
    GP.UI.showToast("Corte do Colar desbloqueia com maestria 5.");
    return;
  }
  if (this.player.cooldownEspadaZ > 0) {
    GP.UI.showToast("Corte do Colar ainda esta recarregando.");
    return;
  }
  const dir = this.aimPlayerAtMouse();
  this.player.cooldownEspadaZ = 150;
  this.player.estado = "attack";
  this.player.estadoTempo = 18;
  this.player.actionDuration = 18;
  this.projectileSwordSlash(dir.x, dir.y, 8.8, 22, Math.max(12, Math.floor(this.player.dano * 0.75 + (this.player.espadaDano || 0) * 1.35)), 42);
  GP.UI.showToast("Corte do Colar!");
};

GP.Game.prototype.useKogatanaX = function() {
  if ((this.player.espadaMaestria || 0) < 12) {
    GP.UI.showToast("Mini Yoru desbloqueia com maestria 12.");
    return;
  }
  if (this.player.cooldownEspadaX > 0) {
    GP.UI.showToast("Mini Yoru ainda esta recarregando.");
    return;
  }
  this.aimPlayerAtMouse();
  this.player.cooldownEspadaX = 280;
  this.player.estado = "attack";
  this.player.estadoTempo = 32;
  this.player.actionDuration = 32;
  for (let i = -1; i <= 1; i++) {
    const angle = this.getMouseAngle(i * 0.22);
    this.attacks.push({
      x: this.player.x + Math.cos(angle) * 26,
      y: this.player.y + Math.sin(angle) * 26,
      vx: Math.cos(angle) * 7.5,
      vy: Math.sin(angle) * 7.5,
      r: 27,
      dano: Math.max(14, Math.floor(this.player.dano * 0.65 + (this.player.espadaDano || 0) * 1.15)),
      vida: 36,
      maxVida: 36,
      cor: "transparent",
      sword: true,
      hidden: false,
      ownerItem: "mihawkKogatana"
    });
  }
  GP.UI.showToast("Mini Yoru!");
};

GP.Game.prototype.projectileSwordSlash = function(dirX, dirY, speed, radius, damage, life) {
  this.attacks.push({
    x: this.player.x + dirX * 32,
    y: this.player.y + dirY * 32,
    vx: dirX * speed,
    vy: dirY * speed,
    r: radius,
    dano: damage,
    vida: life,
    maxVida: life,
    cor: "transparent",
    sword: true,
    hidden: false,
    ownerItem: "mihawkKogatana"
  });
};

GP.Game.prototype.groundSlam = function() {
  this.player.cooldownSocoX = 300;
  this.shake = 22;
  this.player.estado = "groundPunch";
  this.player.estadoTempo = 58;
  this.player.actionDuration = 58;
  GP.UI.showToast("Impacto do Corsario: Modelo Gabriel!");
};

GP.Game.prototype.airPunchAt = function(targetX, targetY) {
  const dir = this.aimPlayerAt(targetX, targetY);
  this.shake = 10;
  this.player.dirX = dir.x;
  this.player.dirY = 0;
  this.player.facing = this.getFacingDirection(this.player.dirX, this.player.dirY);
  this.player.cooldownSocoZ = 180;
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
    dano: Math.max(6, Math.floor(this.player.dano * 1.05)),
    vida: 10,
    cor: "#fff7d1",
    melee: true,
    air: true
  });

  this.createPunchImpact(handX, handY, Math.atan2(this.player.dirY, this.player.dirX), { fromFist: true });
  this.createParticles(handX, handY, "#ffffff", 15);
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

GP.Game.prototype.createGroundCrack = function(x, y) {
  this.impactEffects.push({
    type: "groundCrack",
    x,
    y,
    angle: 0,
    age: 0,
    duration: 180,
    frames: 12,
    width: 245,
    height: 245,
    damageRadius: 128,
    damage: Math.max(10, Math.floor(this.player.dano * 1.65)),
    damageApplied: false
  });
};

GP.Game.prototype.addFistMastery = function(amount) {
  this.player.socoMaestriaXp += amount;
  while (this.player.socoMaestriaXp >= this.player.socoMaestriaMax) {
    this.player.socoMaestriaXp -= this.player.socoMaestriaMax;
    this.player.socoMaestria++;
    this.player.socoMaestriaMax = this.getFistMasteryRequirement(this.player.socoMaestria);
    this.createText(this.player.x, this.player.y - 82, "MAESTRIA +" + this.player.socoMaestria, "#d9f4ff");
    GP.UI.playMasteryLevelUp();
  }
};

GP.Game.prototype.getFistMasteryRequirement = function(masteryLevel) {
  return this.getMasteryRequirement(masteryLevel);
};

GP.Game.prototype.getMasteryRequirement = function(masteryLevel) {
  const cfg = GP.CONFIG.mastery;
  return Math.floor(cfg.baseRequired + masteryLevel * cfg.growth + Math.pow(masteryLevel, cfg.levelGrowth) * 4);
};

GP.Game.prototype.addSwordMastery = function(amount) {
  this.player.espadaMaestriaXp += amount;
  while (this.player.espadaMaestriaXp >= this.player.espadaMaestriaMax) {
    this.player.espadaMaestriaXp -= this.player.espadaMaestriaMax;
    this.player.espadaMaestria++;
    this.player.espadaMaestriaMax = this.getMasteryRequirement(this.player.espadaMaestria);
    this.createText(this.player.x, this.player.y - 82, "ESPADA +" + this.player.espadaMaestria, "#ffe08a");
    GP.UI.playMasteryLevelUp();
  }
};

GP.Game.prototype.getFruitDamage = function(baseDamage) {
  return baseDamage + (this.player.frutaDano || 0);
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
    this.explosion(this.player.x + this.player.dirX * 100, this.player.y + this.player.dirY * 100, 110, this.getFruitDamage(32), fruit.cor);
  }

  if (fruit.nome === "Areia") {
    for (let i = -1; i <= 1; i++) {
      this.attacks.push({
        x: this.player.x,
        y: this.player.y,
        vx: this.player.dirX * 11 + i,
        vy: this.player.dirY * 11 + i,
        r: 15,
        dano: this.getFruitDamage(24),
        vida: 50,
        cor: fruit.cor
      });
    }
  }

  if (fruit.nome === "Fogo") this.projectile(15, 28, this.getFruitDamage(42), 60, fruit.cor);
  if (fruit.nome === "Gelo") this.projectile(13, 24, this.getFruitDamage(36), 62, fruit.cor, { gelo: true });
  if (fruit.nome === "Luz") this.projectile(20, 18, this.getFruitDamage(58), 46, fruit.cor, { luz: true });

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

  if (fruit.nome === "Bomba") this.explosion(this.player.x, this.player.y, 250, this.getFruitDamage(62), fruit.cor);
  if (fruit.nome === "Areia") this.explosion(this.player.x, this.player.y, 280, this.getFruitDamage(46), fruit.cor);
  if (fruit.nome === "Gelo") this.explosion(this.player.x, this.player.y, 300, this.getFruitDamage(54), fruit.cor);
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
        dano: this.getFruitDamage(42),
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
    maxVida: life,
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
  if (npc && npc.id === "redhairMentor") {
    this.talkRedhairMentor(npc);
    return;
  }

  const questId = npc.questId;
  const quest = this.getQuestState(questId);
  const config = this.getQuestConfig(questId);

  if (!questId || !quest || !config) {
    GP.UI.showDialog("<b>" + npc.nome + ":</b><br>" + (npc.dialog || "Ainda nao tenho uma missao pronta."));
    return;
  }

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
    GP.UI.showDialog("<b>" + npc.nome + ":</b><br>" + config.completeText + "<br><br>Voce pode repetir essa missao pela mesma recompensa.");
  }
};

GP.Game.prototype.isBlessedName = function(name) {
  return ["gabriel", "gabi", "gaybriel"].includes(String(name || "").trim().toLowerCase());
};

GP.Game.prototype.showFutureRoulette = function() {
  GP.UI.showSpin({
    nome: "Roleta em construcao",
    raridade: "Sem premio ainda",
    cor: "#ffe66d",
    costText: "Direito liberado pelo Capitao Ruivo",
    skill: "Akuma no Mi ruins no futuro",
    especial: "Ou talvez virar um Pikachu, literalmente"
  });
};

GP.Game.prototype.giveKogatanaGift = function() {
  const alreadyHas = this.hotbarItems.some(item => item && item.id === "mihawkKogatana");
  if (!alreadyHas) this.giveItem("mihawkKogatana", 1);
};

GP.Game.prototype.tryBuyBasicKatana = function() {
  const alreadyHas = this.hotbarItems.some(item => item && item.id === "basicKatana");
  if (alreadyHas) {
    GP.UI.showToast("Voce ja tem a katana basica.");
    return;
  }
  if (!window.confirm("Comprar a katana basica por 100 moedas? Depois ela podera receber nome premiado por IA.")) return;
  if (this.player.moedas < 100) {
    GP.UI.showToast("Voce precisa de 100 moedas.");
    return;
  }
  this.player.moedas -= 100;
  this.giveItem("basicKatana", 2);
  this.saveProgress();
  GP.UI.showToast("Katana basica comprada.");
};

GP.Game.prototype.talkRedhairMentor = function(npc) {
  GP.UI.showDialog("<b>" + npc.nome + ":</b><br>Eu sou um grande pirata. Antes de seguir, diga seu nome.");
  const name = window.prompt("O grande pirata pergunta: qual e o seu nome?");
  if (name === null) return;

  if (this.isBlessedName(name)) {
    GP.UI.showDialog("<b>" + npc.nome + ":</b><br>Voce e digno. Merece a lembrancinha do meu amigo.");
    this.giveKogatanaGift();
    this.showFutureRoulette();
  } else if (window.confirm("Esse nome nao me convenceu. Quer testar a sua sorte?")) {
    GP.UI.showDialog("<b>" + npc.nome + ":</b><br>Entao gire. Hoje ainda nao ha premios, mas um dia essa roleta vai mudar destinos.");
    this.showFutureRoulette();
  } else {
    GP.UI.showDialog("<b>" + npc.nome + ":</b><br>Sem sorte, sem premio. Volte quando quiser tentar de novo.");
  }

  this.tryBuyBasicKatana();
  this.saveProgress();
};

GP.Game.prototype.getNearbyNpc = function() {
  for (const npc of this.getSceneNpcs()) {
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

GP.Game.prototype.handleInventoryOrInteract = function() {
  if (GP.UI.isInventoryOpen && GP.UI.isInventoryOpen()) {
    GP.UI.closeInventory();
    return;
  }

  const npc = this.getNearbyNpc();
  const item = GP.GameMap.getNearbyInteractable(this.player.x, this.player.y);
  if (npc || item) {
    this.tryInteract();
    return;
  }

  if (GP.GameMap.toggleDoorNear && GP.GameMap.toggleDoorNear(this.player.x, this.player.y)) {
    GP.GameMap.saveCustomMap();
    GP.UI.showToast("Porta alternada.");
    return;
  }

  GP.UI.openInventory(this.player, this);
};

GP.Game.prototype.acceptQuest = function() {
  const questId = this.selectedQuestId;
  const quest = questId && this.getQuestState(questId);
  const config = questId && this.getQuestConfig(questId);

  if (quest && config) {
    if (this.player.nivel < config.levelRequired) {
      GP.UI.showToast("Voce precisa estar no nivel " + config.levelRequired + " para essa missao.");
    } else {
      quest.completa = false;
      quest.ativa = true;
      quest.progresso = 0;
      GP.UI.showToast("Missao aceita: " + config.title + ".");
      this.saveProgress();
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
  this.saveProgress();
  GP.UI.showSpin(fruit);
  this.createParticles(this.player.x, this.player.y, fruit.cor, 100);
};

GP.Game.prototype.giveItem = function(itemId, slotIndex) {
  const item = this.itemCatalog[itemId];
  if (!item) return false;
  const slot = slotIndex === undefined ? 1 : Math.max(0, Math.min(8, slotIndex));
  this.hotbarItems[slot] = item;
  this.selectHotbarSlot(slot);
  this.updateHotbarSlots();
  this.saveProgress();
  GP.UI.showToast(item.nome + " equipado no slot " + (slot + 1) + ".");
  return true;
};

GP.Game.prototype.setAdminFruit = function(fruitName) {
  const fruit = GP.CONFIG.fruits.find(item => item.nome === fruitName);
  if (!fruit) return false;
  this.player.fruta = fruit;
  this.saveProgress();
  GP.UI.showToast("Fruta equipada: " + fruit.nome + ".");
  return true;
};

GP.Game.prototype.applyAdminStats = function(data) {
  const clampInt = (value, min, max) => Math.max(min, Math.min(max, Math.floor(Number(value) || 0)));
  this.player.nivel = clampInt(data.level, 1, 999);
  this.player.xp = 0;
  this.player.xpMax = 50 + Math.max(0, this.player.nivel - 1) * 35;
  this.player.socoMaestria = clampInt(data.fistMastery, 0, 999);
  this.player.socoMaestriaXp = 0;
  this.player.socoMaestriaMax = this.getMasteryRequirement(this.player.socoMaestria);
  this.player.espadaMaestria = clampInt(data.swordMastery, 0, 999);
  this.player.espadaMaestriaXp = 0;
  this.player.espadaMaestriaMax = this.getMasteryRequirement(this.player.espadaMaestria);
  this.player.stats.saude = clampInt(data.saude, 0, 999);
  this.player.stats.corpo = clampInt(data.corpo, 0, 999);
  this.player.stats.espada = clampInt(data.espada, 0, 999);
  this.player.stats.fruta = clampInt(data.fruta, 0, 999);
  this.player.statPoints = clampInt(data.statPoints, 0, 9999);
  this.applyStats(true);
  this.saveProgress();
  GP.UI.updateStatsPanel(this.player);
  GP.UI.showToast("Niveis de admin aplicados.");
};

GP.Game.prototype.updateEnemies = function() {
  if (this.scene !== "exterior") return;
  for (const enemy of this.enemies) {
    const d = GP.Utils.dist(this.player.x, this.player.y, enemy.x, enemy.y);

    if (enemy.aggro && d < 560) {
      const dirX = this.player.x < enemy.x ? -1 : 1;
      const oldX = enemy.x;
      const oldY = enemy.y;
      enemy.x += dirX * enemy.velocidade;
      enemy.x = GP.Utils.clamp(enemy.x, enemy.r, GP.CONFIG.world.width - enemy.r);
      if (!this.canActorMoveTo(enemy, enemy.x, enemy.y, oldX, oldY)) enemy.x = oldX;
      enemy.y = GP.GameMap.getGroundYBelow ? GP.GameMap.getGroundYBelow(enemy.x, enemy.y) : GP.GameMap.getGroundY(enemy.x);
    }

    if (enemy.passiveUntilHit) {
      const spawnDistance = Math.abs(enemy.x - enemy.spawnX);
      if (enemy.aggro && spawnDistance > 520) enemy.aggro = false;
      if (!enemy.aggro && spawnDistance > 4) {
        enemy.x += (enemy.spawnX - enemy.x) * 0.04;
        enemy.y = GP.GameMap.getGroundYBelow ? GP.GameMap.getGroundYBelow(enemy.x, enemy.y) : GP.GameMap.getGroundY(enemy.x);
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
    if (!attack.melee || attack.air) this.createParticles(attack.x, attack.y, attack.cor, attack.air ? 3 : 1);

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
    if (effect.type === "groundCrack" && !effect.damageApplied && effect.age >= 20) {
      this.applyGroundCrackDamage(effect);
      effect.damageApplied = true;
    }
    if (effect.age >= effect.duration) this.impactEffects.splice(i, 1);
  }
};

GP.Game.prototype.applyGroundCrackDamage = function(effect) {
  for (let i = this.enemies.length - 1; i >= 0; i--) {
    const enemy = this.enemies[i];
    if (GP.Utils.dist(effect.x, effect.y, enemy.x, enemy.y) <= effect.damageRadius + enemy.r) {
      enemy.aggro = true;
      enemy.vida -= effect.damage;
      this.pushObject(enemy, effect.x, effect.y, 34);
      this.createText(enemy.x, enemy.y - 35, "-" + effect.damage, "#ffe66d");
      if (enemy.vida <= 0) this.killEnemy(i);
    }
  }
  this.shake = 15;
  this.createParticles(effect.x, effect.y, "#ffe66d", 50);
  this.createParticles(effect.x, effect.y, "#8b653c", 25);
};

GP.Game.prototype.killEnemy = function(index) {
  const enemy = this.enemies[index];
  this.player.xp += enemy.xp;
  const masteryXp = enemy.masteryXp || Math.max(1, Math.ceil(enemy.xp * 0.45));
  const selectedItem = this.getSelectedHotbarItem();
  if (selectedItem && selectedItem.id === "mihawkKogatana") this.addSwordMastery(masteryXp);
  else this.addFistMastery(masteryXp);
  this.player.moedas += enemy.moedas;

  const quest = enemy.questId && this.getQuestState(enemy.questId);
  if (quest && quest.ativa && !quest.completa && quest.progresso < quest.objetivo) {
    quest.progresso++;
  }

  this.createParticles(enemy.x, enemy.y, "#ffe66d", 35);
  this.createText(enemy.x, enemy.y - 45, "+" + enemy.xp + " XP", "#ffe66d");
  this.createText(enemy.x, enemy.y - 62, "+" + masteryXp + " MX", selectedItem && selectedItem.id === "mihawkKogatana" ? "#ffe08a" : "#d9f4ff");
  this.coins.push({ x: enemy.x, y: enemy.y, r: 10, valor: enemy.moedas });
  this.enemies.splice(index, 1);
  if (quest && quest.ativa && !quest.completa && quest.progresso >= quest.objetivo) this.completeQuest(enemy.questId);
  this.saveProgress();
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
  this.saveProgress();
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
    this.player.statPoints += 3;
    this.applyStats(true);
    this.createText(this.player.x, this.player.y - 65, "LEVEL UP!", "#ffe66d");
    this.createText(this.player.x, this.player.y - 86, "+3 PONTOS", "#d9f4ff");
    this.createParticles(this.player.x, this.player.y, "#ffe66d", 90);
    this.saveProgress();
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
      p.size += (p.maxSize - p.startSize) / 25;
      p.rotation += p.spin || 0;
      p.vida--;
    } else {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin || 0;
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
  if (this.player.cooldownSocoZ > 0) this.player.cooldownSocoZ--;
  if (this.player.cooldownSocoX > 0) this.player.cooldownSocoX--;
  if (this.player.cooldownEspadaZ > 0) this.player.cooldownEspadaZ--;
  if (this.player.cooldownEspadaX > 0) this.player.cooldownEspadaX--;
  if (this.player.cooldownSkill > 0) this.player.cooldownSkill--;
  if (this.player.cooldownEspecial > 0) this.player.cooldownEspecial--;
  if (this.player.invencivel > 0) this.player.invencivel--;
  if (this.shake > 0) this.shake--;

  if (this.player.estado === "groundPunch" && this.player.estadoTempo === 29) {
    this.createGroundCrack(this.player.x, this.player.y + 10);
  }

  if ((this.player.estado === "attack" || this.player.estado === "kogatanaM1") && this.getSelectedHotbarItem() && this.getSelectedHotbarItem().id === "mihawkKogatana" && this.player.estadoTempo % 6 === 0) {
    this.createParticles(this.player.x + this.player.dirX * 26, this.player.y + this.player.dirY * 26 - 12, "#ffe08a", 3);
  }

  if (this.player.estadoTempo > 0) this.player.estadoTempo--;
  if (this.player.estadoTempo <= 0 && this.player.estado !== "walk") this.player.estado = "idle";
};

GP.Game.prototype.updateCamera = function() {
  const world = GP.CONFIG.world;
  const zoom = GP.CONFIG.camera.zoom || 1;
  const viewW = this.view.width / zoom;
  const viewH = this.view.height / zoom;
  this.camera.x = GP.Utils.clamp(this.player.x - viewW * 0.42, 0, Math.max(0, world.width - viewW));
  this.camera.y = GP.Utils.clamp((world.groundY || 650) - viewH * 0.72, 0, Math.max(0, world.height - viewH));
};

GP.Game.prototype.die = function() {
  this.saveProgress();
  this.running = false;
  GP.UI.showGameOver(this.player);
};

GP.Game.prototype.createParticles = function(x, y, color, amount) {
  const maxParticles = this.perf ? this.perf.maxParticles : 120;
  const scale = this.perf ? this.perf.particleScale : 0.45;
  const freeSlots = Math.max(0, maxParticles - this.particles.length);
  const budgetedAmount = Math.min(freeSlots, Math.max(1, Math.ceil(amount * scale)));
  if (budgetedAmount <= 0) {
    if (this.perf) this.perf.skippedParticles += amount;
    return;
  }

  for (let i = 0; i < budgetedAmount; i++) {
    const life = 25 + Math.random() * 25;
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 7,
      vy: (Math.random() - 0.5) * 7,
      size: 14 + Math.random() * 18,
      vida: life,
      maxVida: life,
      cor: color,
      effectId: "spark",
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3
    });
  }
};

GP.Game.prototype.createWave = function(x, y, radius, color) {
  if (this.particles.length >= (this.perf ? this.perf.maxParticles : 120)) return;
  this.particles.push({
    x,
    y,
    size: 44,
    startSize: 44,
    maxSize: radius * 2,
    vida: 35,
    maxVida: 35,
    cor: color,
    onda: true,
    effectId: "fruitBurst",
    rotation: 0,
    spin: 0.04
  });
};

GP.Game.prototype.createText = function(x, y, text, color) {
  this.texts.push({ x, y, texto: text, cor: color, vida: 60 });
};

GP.Game.prototype.pushObject = function(obj, ox, oy, force) {
  let dx = obj.x - ox;
  let d = Math.abs(dx) || 1;
  const oldX = obj.x;
  const oldY = obj.y;
  obj.x += dx / d * force;
  obj.y = GP.GameMap.getGroundYBelow ? GP.GameMap.getGroundYBelow(obj.x, obj.y) : GP.GameMap.getGroundY(obj.x);
  if (obj.r && !this.canActorMoveTo(obj, obj.x, obj.y, oldX, oldY)) {
    obj.x = oldX;
  }
};

GP.Game.prototype.draw = function() {
  const ctx = this.ctx;
  const zoom = GP.CONFIG.camera.zoom || 1;
  ctx.setTransform(this.view.dpr, 0, 0, this.view.dpr, 0, 0);
  ctx.clearRect(0, 0, this.view.width, this.view.height);

  GP.GameMap.drawBase(ctx, this.camera, this.view, zoom);

  ctx.save();
  ctx.scale(zoom, zoom);
  const sx = (Math.random() - 0.5) * this.shake;
  const sy = (Math.random() - 0.5) * this.shake;
  ctx.translate(-this.camera.x + sx, -this.camera.y + sy);

  this.drawMapEditorOverlay(ctx);
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

GP.Game.prototype.drawMapEditorOverlay = function(ctx) {
  if (!this.mapEditor.active) return;

  const size = GP.GameMap.blockSize;
  const zoom = GP.CONFIG.camera.zoom || 1;
  const viewW = this.view.width / zoom;
  const viewH = this.view.height / zoom;
  const left = Math.max(0, Math.floor(this.camera.x / size) - 1);
  const top = Math.max(0, Math.floor(this.camera.y / size) - 1);
  const right = Math.ceil((this.camera.x + viewW) / size) + 1;
  const bottom = Math.ceil((this.camera.y + viewH) / size) + 1;
  const data = GP.GameMap.ensureCustomMap();
  const selectedCol = Math.floor(this.mouse.worldX / size);
  const selectedRow = Math.floor(this.mouse.worldY / size);

  ctx.save();
  ctx.lineWidth = 1 / zoom;

  ctx.strokeStyle = "rgba(255, 246, 170, 0.14)";
  for (let col = left; col <= right; col++) {
    const x = col * size;
    ctx.beginPath();
    ctx.moveTo(x, top * size);
    ctx.lineTo(x, bottom * size);
    ctx.stroke();
  }
  for (let row = top; row <= bottom; row++) {
    const y = row * size;
    ctx.beginPath();
    ctx.moveTo(left * size, y);
    ctx.lineTo(right * size, y);
    ctx.stroke();
  }

  Object.keys(data.invisible || {}).forEach(key => {
    const pos = GP.GameMap.parseMapKey(key);
    if (pos.col < left || pos.col > right || pos.row < top || pos.row > bottom) return;
    ctx.fillStyle = "rgba(73, 210, 255, 0.22)";
    ctx.fillRect(pos.col * size, pos.row * size, size, size);
    ctx.strokeStyle = "rgba(73, 210, 255, 0.86)";
    ctx.strokeRect(pos.col * size + 1, pos.row * size + 1, size - 2, size - 2);
  });

  Object.keys(data.markers || {}).forEach(key => {
    const pos = GP.GameMap.parseMapKey(key);
    if (pos.col < left || pos.col > right || pos.row < top || pos.row > bottom) return;
    const marker = data.markers[key];
    const x = pos.col * size;
    const y = pos.row * size;
    ctx.fillStyle = marker.type === "npc" ? "rgba(255, 224, 86, 0.28)" : "rgba(255, 92, 190, 0.24)";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = marker.type === "npc" ? "#ffe056" : "#ff5cbe";
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
    ctx.fillStyle = "#fff7d8";
    ctx.font = "900 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText(marker.type === "npc" ? "NPC" : "IMG", x + size / 2, y + size / 2 + 5);
  });

  ctx.strokeStyle = "#ffe66d";
  ctx.lineWidth = 3 / zoom;
  ctx.strokeRect(selectedCol * size + 1, selectedRow * size + 1, size - 2, size - 2);

  ctx.fillStyle = "rgba(5, 8, 12, 0.76)";
  ctx.fillRect(selectedCol * size, selectedRow * size - 24, 148, 20);
  ctx.fillStyle = "#ffe66d";
  ctx.font = "900 11px Arial";
  ctx.textAlign = "left";
  ctx.fillText(this.mapEditor.layer + " / " + this.mapEditor.tool, selectedCol * size + 5, selectedRow * size - 10);
  ctx.restore();
};

GP.Game.prototype.drawGroundProps = function(ctx) {
  const zoom = GP.CONFIG.camera.zoom || 1;

  GP.GameMap.getVisibleGroundProps(this.camera, this.view, zoom).forEach(prop => {
    GP.GameMap.drawProp(ctx, prop);
  });
};

GP.Game.prototype.drawDepthSortedScene = function(ctx) {
  const renderables = [];
  const zoom = GP.CONFIG.camera.zoom || 1;

  GP.GameMap.getVisibleProps(this.camera, this.view, zoom).forEach(prop => {
    renderables.push({
      sortY: prop.sortY,
      draw: () => GP.GameMap.drawProp(ctx, prop)
    });
  });

  this.getSceneNpcs().forEach(npc => {
    renderables.push({
      sortY: npc.y + 34,
      draw: () => this.drawNpc(ctx, npc)
    });
  });

  if (this.scene === "exterior") {
    this.enemies.forEach(enemy => {
      renderables.push({
        sortY: enemy.y + enemy.r,
        draw: () => this.drawEnemy(ctx, enemy)
      });
    });
  }

  renderables.push({
    sortY: this.player.y + this.player.r,
    draw: () => this.drawPlayer(ctx)
  });

  renderables
    .sort((a, b) => a.sortY - b.sortY)
    .forEach(item => item.draw());
};

GP.Game.prototype.drawActorShadow = function(ctx, x, y, width, height) {
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#071827";
  ctx.beginPath();
  ctx.ellipse(x, y + 3, width, height, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

GP.Game.prototype.drawNpc = function(ctx, npc) {
  ctx.save();
  this.drawActorShadow(ctx, npc.x, npc.y, 20, 7);
  GP.Assets.drawSprite(ctx, npc.spriteId || "npcDario", 0, npc.x, npc.y);
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
  if (this.scene === "exterior" && this.isNearHouseDoor()) {
    ctx.fillStyle = "#ffe66d";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("F - Entrar", this.player.x, this.player.y - 56);
    return;
  }
  if (this.scene === "shanksHouse") {
    const exitX = GP.GameMap.interiorExit.col * GP.GameMap.blockSize + GP.GameMap.blockSize / 2;
    const exitY = GP.GameMap.interiorExit.row * GP.GameMap.blockSize + GP.GameMap.blockSize;
    if (GP.Utils.dist(this.player.x, this.player.y, exitX, exitY) <= 96) {
      ctx.fillStyle = "#ffe66d";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText("F - Sair", this.player.x, this.player.y - 56);
      return;
    }
  }

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
  this.drawPlayerSprite(ctx, pose);
  this.drawHeldKogatana(ctx, pose);
  ctx.restore();

  this.drawBar(ctx, this.player.x - 24, this.player.y - 94, 48, 5, this.player.vida, this.player.vidaMax, "#30ff68");
  ctx.fillStyle = "#fff";
  ctx.font = "bold 9px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Gabriel", this.player.x, this.player.y + 26);
};

GP.Game.prototype.getPlayerPose = function() {
  const player = this.player;
  const facing = player.facing || "right";
  let sprite = "playerSide";
  let flip = false;

  flip = facing === "right";

  if (player.estado === "skill" || player.estado === "punch") {
    sprite = "playerAction";
    flip = facing === "right";
  }

  const walkCycle = player.estado === "walk" ? Math.sin(player.walkTime * 0.62) : 0;
  const walkStep = player.estado === "walk" ? Math.cos(player.walkTime * 0.62) : 0;
  const actionDuration = player.actionDuration || 1;
  const actionProgress = player.estadoTempo > 0 ? 1 - player.estadoTempo / actionDuration : 1;
  const casting = player.estado === "skill" && player.estadoTempo > 0;
  const attacking = (player.estado === "attack" || player.estado === "kogatanaM1" || player.estado === "punch" || player.estado === "groundPunch") && player.estadoTempo > 0;

  let bob = player.onGround ? Math.abs(walkStep) * -3 : 0;
  let sway = walkCycle * 2;
  let scaleX = 1;
  let scaleY = 1;
  let rotation = 0;

  if (player.estado === "walk" && player.onGround) {
    scaleX += Math.abs(walkStep) * 0.035;
    scaleY -= Math.abs(walkStep) * 0.025;
    rotation = (facing === "left" ? -1 : 1) * walkCycle * 0.045;
  }

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
  GP.Assets.drawSprite(ctx, pose.sprite, 0, pose.x, pose.y, {
    flipX: pose.flip,
    rotation: pose.rotation,
    width: (GP.Assets.getSpriteSpec(pose.sprite) || {}).drawWidth * pose.scaleX,
    height: (GP.Assets.getSpriteSpec(pose.sprite) || {}).drawHeight * pose.scaleY
  });
};

GP.Game.prototype.drawHeldKogatana = function(ctx, pose) {
  return;
};

GP.Game.prototype.drawPlayerShadow = function(ctx, pose) {
  const width = 24 + Math.abs(pose.walkCycle) * 3;
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#071827";
  ctx.beginPath();
  ctx.ellipse(this.player.x, this.player.y + 3, width, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (this.player.estado === "walk") {
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#1e3b2a";
    ctx.beginPath();
    ctx.ellipse(this.player.x - pose.walkCycle * 4, this.player.y + 7, 7, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(this.player.x + pose.walkCycle * 4, this.player.y + 8, 7, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

GP.Game.prototype.drawSkillWindup = function(ctx, pose) {
  const p = this.player;
  const pulse = Math.sin(pose.actionProgress * Math.PI);
  const dir = this.getDirectionVector(pose.facing);
  const handX = p.x + dir.x * (24 + pulse * 10);
  const handY = p.y + dir.y * (24 + pulse * 10) - 14;

  GP.Assets.drawEffect(ctx, "fruitBurst", pose.actionProgress, p.x, p.y - 10, {
    width: 48 + pulse * 28,
    height: 48 + pulse * 28,
    alpha: 0.3 + pulse * 0.28,
    rotation: pose.actionProgress * Math.PI
  });
  GP.Assets.drawEffect(ctx, "fruitBurst", pose.actionProgress, handX, handY, {
    width: 24 + pulse * 22,
    height: 24 + pulse * 22,
    alpha: 0.55 + pulse * 0.28,
    rotation: -pose.actionProgress * Math.PI
  });
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
  this.drawActorShadow(ctx, enemy.x, enemy.y, 18, 6);
  GP.Assets.drawSprite(ctx, enemy.spriteId || "enemyWeak", 0, enemy.x, enemy.y);
  this.drawBar(ctx, enemy.x - 20, enemy.y - 32, 40, 5, enemy.vida, enemy.vidaMax, "#ff3030");
  ctx.fillStyle = "#fff";
  ctx.font = "9px Arial";
  ctx.textAlign = "center";
  ctx.fillText(enemy.nome, enemy.x, enemy.y + 31);
};

GP.Game.prototype.drawAttacks = function(ctx) {
  for (const attack of this.attacks) {
    if (attack.melee && !attack.air) continue;
    if (attack.hidden) continue;
    if (attack.sword) {
      const angle = Math.atan2(attack.vy, attack.vx);
      const maxLife = attack.maxVida || 42;
      const progress = 1 - Math.max(0, attack.vida) / maxLife;
      GP.Assets.drawEffect(ctx, "swordSlash", progress, attack.x, attack.y, {
        width: attack.r * 3.4,
        height: attack.r * 1.65,
        rotation: angle,
        alpha: Math.min(0.95, 0.42 + attack.vida / maxLife)
      });
    } else if (attack.air) {
      const angle = Math.atan2(attack.vy, attack.vx);
      const progress = 1 - (attack.vida / 10);
      GP.Assets.drawEffect(ctx, "airPunch", progress, attack.x, attack.y, {
        width: attack.r * 2,
        height: attack.r * 2,
        rotation: angle,
        alpha: attack.vida / 10
      });
    } else {
      const angle = Math.atan2(attack.vy, attack.vx);
      const progress = 1 - Math.max(0, attack.vida) / (attack.maxVida || 60);
      GP.Assets.drawEffect(ctx, attack.luz ? "swordSlash" : "fruitBurst", progress, attack.x, attack.y, {
        width: attack.r * (attack.luz ? 4.2 : 2.4),
        height: attack.r * (attack.luz ? 1.1 : 2.4),
        rotation: angle,
        alpha: Math.min(0.92, 0.42 + attack.vida / (attack.maxVida || 60))
      });
    }
  }
};

GP.Game.prototype.drawImpactEffects = function(ctx) {
  for (const effect of this.impactEffects) {
    if (effect.type === "groundCrack") {
      this.drawGroundCrackEffect(ctx, effect);
      continue;
    }

    const progress = Math.max(0, Math.min(0.999, effect.age / effect.duration));
    const width = effect.width * (0.86 + progress * 0.18);
    const height = effect.height * (0.9 + progress * 0.16);
    const push = effect.fromFist ? progress * 36 : progress * 18;

    GP.Assets.drawEffect(ctx, "punchImpact", progress, effect.x + Math.cos(effect.angle) * push, effect.y + Math.sin(effect.angle) * push, {
      width,
      height,
      rotation: effect.angle,
      alpha: 1 - Math.max(0, progress - 0.62) / 0.38
    });
  }
};

GP.Game.prototype.drawGroundCrackEffect = function(ctx, effect) {
  const activeProgress = Math.max(0, Math.min(0.999, effect.age / 64));
  const fade = effect.age > 138 ? Math.max(0, 1 - (effect.age - 138) / 42) : 1;
  const scale = 0.72 + Math.min(1, effect.age / 26) * 0.28;

  GP.Assets.drawEffect(ctx, "groundCrack", activeProgress, effect.x, effect.y, {
    width: effect.width * scale,
    height: effect.height * scale,
    alpha: fade
  });
};

GP.Game.prototype.drawCoins = function(ctx) {
  for (const coin of this.coins) {
    const bob = Math.sin((this.frame + coin.x) * 0.12) * 2;
    GP.Assets.drawSprite(ctx, "coin", 0, coin.x, coin.y + bob, {
      width: coin.r * 2.2,
      height: coin.r * 2.2,
      rotation: Math.sin((this.frame + coin.y) * 0.08) * 0.18
    });
  }
};

GP.Game.prototype.drawParticles = function(ctx) {
  const zoom = GP.CONFIG.camera.zoom || 1;
  const pad = 160;
  const left = this.camera.x - pad;
  const top = this.camera.y - pad;
  const right = this.camera.x + this.view.width / zoom + pad;
  const bottom = this.camera.y + this.view.height / zoom + pad;

  for (const p of this.particles) {
    if (p.x < left || p.x > right || p.y < top || p.y > bottom) continue;
    const progress = 1 - Math.max(0, p.vida) / (p.maxVida || 1);
    const alpha = Math.max(0, p.vida / (p.maxVida || 50));
    GP.Assets.drawEffect(ctx, p.effectId || "spark", progress, p.x, p.y, {
      width: p.size,
      height: p.size,
      alpha,
      rotation: p.rotation || 0
    });
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
  GP.UI.updateStatsPanel(this.player);
  GP.UI.updateMasteryPanel(this.player, this);
  if (GP.UI.isInventoryOpen && GP.UI.isInventoryOpen()) GP.UI.updateInventory(this.player, this);
  this.draw();

  requestAnimationFrame(() => this.loop());
};
