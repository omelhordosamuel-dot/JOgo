window.GP = window.GP || {};

GP.CONFIG = {
  world: {
    width: 5200,
    height: 900,
    spawn: { x: 720, y: 624 },
    groundY: 624,
    blockSize: 48
  },
  camera: {
    zoom: 1.45
  },
  player: {
    radius: 12,
    speed: 3.55,
    hp: 130,
    damage: 9
  },
  mastery: {
    baseRequired: 8,
    growth: 2,
    levelGrowth: 1.1
  },
  quest: {
    objective: 5
  },
  quests: {
    noviceBandits: {
      id: "noviceBandits",
      title: "Bandidos do Campo Oeste",
      npcName: "Dario",
      npcTitle: "Treinador da Ilha",
      objective: 5,
      levelRequired: 1,
      rewardXp: 45,
      rewardCoins: 45,
      enemyName: "Bandido Fraco",
      intro: "Esses bandidos estao assustando os novatos. Derrote 5 deles para provar que sabe lutar.",
      activeText: "Ainda tem bandido de pe por aqui. Continue.",
      completeText: "Bom trabalho. Agora voce ja pode encarar desafios maiores na ilha."
    },
    eastBandits: {
      id: "eastBandits",
      title: "Bandidos do Campo Leste",
      npcName: "Mina",
      npcTitle: "Guarda da Ilha",
      objective: 5,
      levelRequired: 3,
      rewardXp: 90,
      rewardCoins: 80,
      enemyName: "Bandido Forte",
      intro: "O grupo do leste e mais perigoso. Volte no nivel 3 e derrote 5 deles.",
      activeText: "Eles batem mais forte, mas voce consegue. Faltam poucos.",
      completeText: "Excelente. A ilha inicial ja reconhece sua forca."
    }
  },
  questNpcs: [
    {
      id: "blacksmith",
      x: 980,
      y: 624,
      r: 18,
      name: "Ferreiro",
      title: "Mestre das Forjas",
      spriteId: "npcBlacksmith",
      dialog: "Traga minerios quando o sistema de crafting estiver pronto. Eu vou cuidar das armas."
    },
  ],
  campEnemies: {
    noviceBandits: {
      questId: "noviceBandits",
      count: 0,
      spawnPoints: [
        { x: 1280, y: 650 },
        { x: 1430, y: 650 },
        { x: 1580, y: 650 },
        { x: 1760, y: 650 },
        { x: 1960, y: 650 }
      ],
      type: { nome: "Bandido Fraco", vida: 32, dano: 5, velocidade: 1.15, cor: "#c94735", xp: 10, masteryXp: 6, moedas: 4, spriteId: "enemyWeak" }
    },
    eastBandits: {
      questId: "eastBandits",
      count: 0,
      spawnPoints: [
        { x: 3620, y: 650 },
        { x: 3790, y: 650 },
        { x: 3980, y: 650 },
        { x: 4170, y: 650 },
        { x: 4380, y: 650 }
      ],
      type: { nome: "Bandido Forte", vida: 68, dano: 11, velocidade: 1.25, cor: "#8f3bff", xp: 20, masteryXp: 10, moedas: 9, spriteId: "enemyStrong" }
    }
  },
  fruits: [
    { nome: "Nenhuma", raridade: "Sem fruta", chance: 0, cor: "#ffffff", skill: "Nenhuma", especial: "Nenhum" },
    { nome: "Bomba", raridade: "Comum", chance: 45, cor: "#a56cff", skill: "Mini Explosao", especial: "Campo Explosivo" },
    { nome: "Areia", raridade: "Comum", chance: 35, cor: "#d6b46a", skill: "Rajada de Areia", especial: "Tempestade" },
    { nome: "Fogo", raridade: "Rara", chance: 14, cor: "#ff4a1c", skill: "Bola de Fogo", especial: "Chuva Flamejante" },
    { nome: "Gelo", raridade: "Rara", chance: 5, cor: "#6be7ff", skill: "Espinho de Gelo", especial: "Era Congelante" },
    { nome: "Luz", raridade: "Lendaria", chance: 1, cor: "#fff27a", skill: "Raio de Luz", especial: "Julgamento Solar" }
  ],
  enemies: [
    { nome: "Bandido", vida: 45, dano: 8, velocidade: 1.45, cor: "#d83b3b", xp: 12, masteryXp: 7, moedas: 5, spriteId: "enemyWeak" },
    { nome: "Pirata Forte", vida: 80, dano: 13, velocidade: 1.12, cor: "#8f3bff", xp: 22, masteryXp: 11, moedas: 10, spriteId: "enemyStrong" },
    { nome: "Marinheiro Rebelde", vida: 62, dano: 10, velocidade: 1.28, cor: "#3b8cff", xp: 17, masteryXp: 9, moedas: 8, spriteId: "enemyStrong" }
  ]
};
