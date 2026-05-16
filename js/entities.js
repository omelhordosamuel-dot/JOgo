window.GP = window.GP || {};

GP.Entities = {
  createPlayer() {
    const cfg = GP.CONFIG;
    return {
      x: cfg.world.spawn.x,
      y: cfg.world.spawn.y,
      r: cfg.player.radius,
      vida: cfg.player.hp,
      vidaMax: cfg.player.hp,
      nivel: 1,
      xp: 0,
      xpMax: 50,
      moedas: 60,
      statPoints: 0,
      stats: {
        saude: 0,
        corpo: 0,
        espada: 0,
        fruta: 0
      },
      velocidade: cfg.player.speed,
      vx: 0,
      vy: 0,
      onGround: true,
      dano: cfg.player.damage,
      baseVidaMax: cfg.player.hp,
      baseDano: cfg.player.damage,
      espadaDano: 0,
      frutaDano: 0,
      dirX: 1,
      dirY: 0,
      facing: "right",
      walkTime: 0,
      actionDuration: 0,
      fruta: cfg.fruits[0],
      estado: "idle",
      estadoTempo: 0,
      cooldownAtaque: 0,
      cooldownSkill: 0,
      cooldownEspecial: 0,
      socoMaestria: 0,
      socoMaestriaXp: 0,
      socoMaestriaMax: cfg.mastery.baseRequired,
      espadaMaestria: 0,
      espadaMaestriaXp: 0,
      espadaMaestriaMax: cfg.mastery.baseRequired,
      cooldownSocoZ: 0,
      cooldownSocoX: 0,
      cooldownEspadaZ: 0,
      cooldownEspadaX: 0,
      invencivel: 0
    };
  },

  createNpc(data) {
    const quest = data && GP.CONFIG.quests[data.id];
    return {
      id: data ? data.id : null,
      x: data ? data.x : 1600,
      y: data ? data.y : 1582,
      r: data ? data.r : 18,
      nome: data && data.name ? data.name : quest ? quest.npcName : "Mestre Kairo",
      titulo: data && data.title ? data.title : quest ? quest.npcTitle : "",
      questId: quest && data ? data.id : null,
      dialog: data && data.dialog ? data.dialog : null,
      spriteId: data && data.spriteId ? data.spriteId : data && data.id === "eastBandits" ? "npcMina" : "npcDario",
      cor: data ? data.color : "#35d96f"
    };
  },

  createEnemy(campId, spawnIndex) {
    const camp = campId && GP.CONFIG.campEnemies[campId];
    const type = camp ? camp.type : GP.CONFIG.enemies[Math.floor(Math.random() * GP.CONFIG.enemies.length)];
    const pos = camp ? camp.spawnPoints[spawnIndex % camp.spawnPoints.length] : GP.GameMap.randomEnemyPoint();

    return {
      x: pos.x,
      y: pos.y,
      spawnX: pos.x,
      spawnY: pos.y,
      r: 15,
      nome: type.nome,
      vida: type.vida,
      vidaMax: type.vida,
      dano: type.dano,
      velocidade: type.velocidade,
      cor: type.cor,
      xp: type.xp,
      masteryXp: type.masteryXp || Math.max(1, Math.ceil(type.xp * 0.45)),
      moedas: type.moedas,
      spriteId: type.spriteId || (campId === "eastBandits" ? "enemyStrong" : "enemyWeak"),
      questId: camp ? camp.questId : null,
      campId: camp ? campId : null,
      spawnIndex: camp ? spawnIndex : null,
      aggro: camp ? false : true,
      passiveUntilHit: !!camp,
      hitCooldown: 0
    };
  }
};
