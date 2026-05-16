window.GP = window.GP || {};

GP.AssetManifest = {
  version: 1,
  policy: {
    artDirection: "anime pirate adventure, original characters and symbols",
    playerIdentity: "canonical-single-sheet",
    canonicalCharacterId: "gabriel",
    canonicalCharacterImage: "playerSheet",
    characterAnimationRule: "player animation sprites must use the canonical Gabriel sheet or explicitly share identityGroup gabriel-canonical; never replace Gabriel with separate AI animation character sheets",
    proceduralAllowed: ["text", "simple-bars", "technical-shadows"],
    generatedRoot: "assets/generated/runtime",
    maxDrawStretchRatio: 0.18,
    maxLiveParticles: 120,
    particleBudgetScale: 0.42,
    spriteCacheScale: 3,
    effectCacheScale: 2,
    preferTexturedProceduralMap: true
  },

  images: {
    skyTexture: {
      src: "assets/generated/backgrounds/sky-ai-pixel.png",
      width: 1774,
      height: 887,
      role: "background"
    },
    inventoryUiAtlas: {
      src: "assets/generated/ui/inventory-ui-atlas.png",
      width: 1254,
      height: 1254,
      role: "ui-atlas",
      cols: 2,
      rows: 2
    },
    terrainWater: {
      src: "assets/generated/terrain/water.png",
      width: 1254,
      height: 1254,
      role: "terrain-tile"
    },
    terrainSand: {
      src: "assets/generated/terrain/sand.png",
      width: 1254,
      height: 1254,
      role: "terrain-tile"
    },
    terrainGrass: {
      src: "assets/generated/terrain/grass.png",
      width: 1254,
      height: 1254,
      role: "terrain-tile"
    },
    terrainDirt: {
      src: "assets/generated/terrain/dirt.png",
      width: 1254,
      height: 1254,
      role: "terrain-tile"
    },
    terrainBlockAtlas: {
      src: "assets/generated/blocks/terrain-blocks-ai-atlas.png",
      width: 1254,
      height: 1254,
      role: "block-atlas",
      cols: 2,
      rows: 2
    },
    constructionBlockAtlas: {
      src: "assets/generated/blocks/construction-blocks-ai-atlas.png",
      width: 1536,
      height: 1024,
      role: "construction-block-atlas",
      cols: 3,
      rows: 2
    },
    extraBlockAtlas: {
      src: "assets/generated/blocks/extra-blocks-ai-atlas.png",
      width: 1774,
      height: 887,
      role: "extra-block-atlas",
      cols: 4,
      rows: 2
    },
    doorBlockAtlas: {
      src: "assets/generated/blocks/door-block-atlas.png",
      width: 96,
      height: 96,
      role: "door-block-atlas",
      cols: 2,
      rows: 2
    },
    propsAtlas: {
      src: "assets/generated/runtime/map-props-atlas.png",
      width: 1448,
      height: 1086,
      role: "prop-atlas",
      cols: 4,
      rows: 3
    },
    natureAtlas: {
      src: "assets/generated/runtime/map-nature-atlas.png",
      width: 1672,
      height: 941,
      role: "nature-atlas",
      cols: 4,
      rows: 2
    },
    playerSheet: {
      src: "assets/generated/characters/gabriel-terraria-side.png",
      width: 1254,
      height: 1254,
      role: "canonical-player",
      characterId: "gabriel",
      identityGroup: "gabriel-canonical",
      identityLocked: true,
      transparent: "chroma-green"
    },
    npcBlacksmithSheet: {
      src: "assets/generated/characters/npc-blacksmith-ai.png",
      width: 1402,
      height: 1122,
      role: "npc-sprite",
      transparent: "chroma-green"
    },
    npcRedhairMentorSheet: {
      src: "assets/generated/characters/npc-redhair-mentor-ai.png",
      width: 1122,
      height: 1402,
      role: "npc-sprite",
      transparent: "chroma-green"
    },
    punchImpact: {
      src: "assets/generated/runtime/effect-punch-impact-sheet.png",
      width: 2172,
      height: 724,
      role: "effect-sheet",
      transparent: "chroma-green",
      frames: 12
    },
    groundCrack: {
      src: "assets/generated/runtime/effect-ground-crack-sheet.png",
      width: 2172,
      height: 724,
      role: "effect-sheet",
      transparent: "chroma-green",
      frames: 12
    },
    kogatanaWeapon: {
      src: "assets/generated/runtime/weapon-kogatana-runtime.png",
      width: 256,
      height: 256,
      role: "weapon",
      transparent: "chroma-green"
    },
    basePunchIcon: {
      src: "assets/generated/runtime/ui-icon-base-punch.png",
      width: 256,
      height: 256,
      role: "ui-icon"
    },
    kogatanaIcon: {
      src: "assets/generated/runtime/ui-icon-kogatana.png",
      width: 256,
      height: 256,
      role: "ui-icon",
      transparent: "chroma-green"
    }
  },

  sprites: {
    playerSide: { image: "playerSheet", characterId: "gabriel", identityGroup: "gabriel-canonical", animationRole: "canonical-player", sx: 468, sy: 344, sw: 390, sh: 570, drawWidth: 54, drawHeight: 80, anchorX: 0.5, anchorY: 0.96, allowAspectDrift: true },
    playerAction: { image: "playerSheet", characterId: "gabriel", identityGroup: "gabriel-canonical", animationRole: "canonical-player", sx: 468, sy: 344, sw: 390, sh: 570, drawWidth: 58, drawHeight: 80, anchorX: 0.5, anchorY: 0.96, allowAspectDrift: true },
    coin: { image: "basePunchIcon", sx: 0, sy: 0, sw: 256, sh: 256, drawWidth: 24, drawHeight: 24, anchorX: 0.5, anchorY: 0.5 },
    kogatanaWeapon: { image: "kogatanaWeapon", sx: 0, sy: 0, sw: 256, sh: 256, drawWidth: 22, drawHeight: 34, anchorX: 0.5, anchorY: 0.5, allowAspectDrift: true },
    npcDario: { image: "playerSheet", sx: 468, sy: 344, sw: 390, sh: 570, drawWidth: 54, drawHeight: 80, anchorX: 0.5, anchorY: 0.96, filter: "hue-rotate(82deg) saturate(1.1)", allowAspectDrift: true },
    npcMina: { image: "playerSheet", sx: 468, sy: 344, sw: 390, sh: 570, drawWidth: 54, drawHeight: 80, anchorX: 0.5, anchorY: 0.96, filter: "hue-rotate(190deg) saturate(1.15)", allowAspectDrift: true },
    enemyWeak: { image: "playerSheet", sx: 468, sy: 344, sw: 390, sh: 570, drawWidth: 50, drawHeight: 74, anchorX: 0.5, anchorY: 0.96, filter: "hue-rotate(318deg) saturate(1.35) brightness(0.9)", allowAspectDrift: true },
    enemyStrong: { image: "playerSheet", sx: 468, sy: 344, sw: 390, sh: 570, drawWidth: 56, drawHeight: 82, anchorX: 0.5, anchorY: 0.96, filter: "hue-rotate(258deg) saturate(1.25) brightness(0.9)", allowAspectDrift: true },
    npcBlacksmith: { image: "npcBlacksmithSheet", sx: 270, sy: 90, sw: 720, sh: 930, drawWidth: 66, drawHeight: 86, anchorX: 0.5, anchorY: 0.96, allowAspectDrift: true },
    npcRedhairMentor: { image: "npcRedhairMentorSheet", sx: 120, sy: 90, sw: 930, sh: 1210, drawWidth: 66, drawHeight: 92, anchorX: 0.5, anchorY: 0.96, allowAspectDrift: true }
  },

  effects: {
    punchImpact: { image: "punchImpact", frames: 12, drawWidth: 168, drawHeight: 96, anchorX: 0.08, anchorY: 0.5, allowAspectDrift: true },
    airPunch: { image: "punchImpact", frames: 12, drawWidth: 72, drawHeight: 72, anchorX: 0.5, anchorY: 0.5, allowAspectDrift: true },
    spark: { image: "punchImpact", frames: 12, drawWidth: 22, drawHeight: 22, anchorX: 0.5, anchorY: 0.5, allowAspectDrift: true },
    fruitBurst: { image: "punchImpact", frames: 12, drawWidth: 76, drawHeight: 76, anchorX: 0.5, anchorY: 0.5, allowAspectDrift: true },
    swordSlash: { image: "punchImpact", frames: 12, drawWidth: 96, drawHeight: 46, anchorX: 0.5, anchorY: 0.5, filter: "hue-rotate(38deg) saturate(1.25)", allowAspectDrift: true },
    groundCrack: { image: "groundCrack", frames: 12, drawWidth: 245, drawHeight: 245, anchorX: 0.5, anchorY: 0.5, allowAspectDrift: true }
  },

  propCells: {
    blueHouse: [0, 0],
    redHouse: [1, 0],
    inn: [2, 0],
    windmill: [3, 0],
    dock: [0, 1],
    boat: [1, 1],
    lighthouse: [2, 1],
    tent: [3, 1],
    watchtower: [0, 2],
    trees: [1, 2],
    crates: [2, 2],
    chest: [3, 2]
  },

  natureCells: {
    palm: [0, 0],
    leafyTree: [1, 0],
    roundTree: [2, 0],
    pineTree: [3, 0],
    bush: [0, 1],
    flowerBush: [1, 1],
    flowerPatch: [2, 1],
    tallGrass: [3, 1]
  }
};
