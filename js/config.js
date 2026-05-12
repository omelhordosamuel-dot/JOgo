window.GP = window.GP || {};

GP.CONFIG = {
  world: {
    width: 3200,
    height: 3200,
    spawn: { x: 1600, y: 2070 }
  },
  camera: {
    zoom: 1.95
  },
  player: {
    radius: 12,
    speed: 3.55,
    hp: 130,
    damage: 16
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
    { id: "noviceBandits", x: 1015, y: 1115, r: 18, color: "#35d96f" },
    { id: "eastBandits", x: 2185, y: 1115, r: 18, color: "#52b7ff" }
  ],
  campEnemies: {
    noviceBandits: {
      questId: "noviceBandits",
      count: 5,
      spawnPoints: [
        { x: 690, y: 795 },
        { x: 820, y: 750 },
        { x: 955, y: 805 },
        { x: 735, y: 930 },
        { x: 910, y: 965 }
      ],
      type: { nome: "Bandido Fraco", vida: 32, dano: 5, velocidade: 1.15, cor: "#c94735", xp: 10, moedas: 4 }
    },
    eastBandits: {
      questId: "eastBandits",
      count: 5,
      spawnPoints: [
        { x: 2235, y: 795 },
        { x: 2380, y: 760 },
        { x: 2525, y: 820 },
        { x: 2275, y: 955 },
        { x: 2470, y: 965 }
      ],
      type: { nome: "Bandido Forte", vida: 68, dano: 11, velocidade: 1.25, cor: "#8f3bff", xp: 20, moedas: 9 }
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
    { nome: "Bandido", vida: 45, dano: 8, velocidade: 1.45, cor: "#d83b3b", xp: 12, moedas: 5 },
    { nome: "Pirata Forte", vida: 80, dano: 13, velocidade: 1.12, cor: "#8f3bff", xp: 22, moedas: 10 },
    { nome: "Marinheiro Rebelde", vida: 62, dano: 10, velocidade: 1.28, cor: "#3b8cff", xp: 17, moedas: 8 }
  ]
};
