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
      velocidade: cfg.player.speed,
      dano: cfg.player.damage,
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
      invencivel: 0
    };
  },

  createNpc(data) {
    const quest = data && GP.CONFIG.quests[data.id];
    return {
      x: data ? data.x : 1600,
      y: data ? data.y : 1582,
      r: data ? data.r : 18,
      nome: quest ? quest.npcName : "Mestre Kairo",
      titulo: quest ? quest.npcTitle : "",
      questId: data ? data.id : null,
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
      moedas: type.moedas,
      questId: camp ? camp.questId : null,
      campId: camp ? campId : null,
      spawnIndex: camp ? spawnIndex : null,
      aggro: camp ? false : true,
      passiveUntilHit: !!camp,
      hitCooldown: 0
    };
  }
};
