window.GP = window.GP || {};

GP.GameMap = {
  world: GP.CONFIG.world,
  utils: GP.Utils,
  baseCache: null,

  landShapes: [
    { x: 1600, y: 1560, rx: 1400, ry: 1280 }
  ],

  waterCuts: [],

  docks: [
    { x: 1320, y: 2040, w: 560, h: 430 },
    { x: 1552, y: 1920, w: 96, h: 600 }
  ],

  enemyZones: [
    { name: "west-flat-field", x: 500, y: 1220, w: 560, h: 620 },
    { name: "north-training-yard", x: 1190, y: 760, w: 800, h: 420 },
    { name: "east-flat-field", x: 2180, y: 1160, w: 570, h: 670 },
    { name: "south-camp-line", x: 820, y: 2150, w: 1620, h: 430 }
  ],

  groundProps: [],

  props: [
    { id: "central-inn", prop: "inn", x: 1600, y: 1428, w: 330, h: 255, sortY: 1524, collision: [{ type: "rect", x: 1504, y: 1510, w: 192, h: 46 }] },
    { id: "blue-house-west", prop: "blueHouse", x: 1210, y: 1510, w: 250, h: 216, sortY: 1598, collision: [{ type: "rect", x: 1138, y: 1582, w: 144, h: 42 }] },
    { id: "red-house-east", prop: "redHouse", x: 1995, y: 1512, w: 250, h: 216, sortY: 1600, collision: [{ type: "rect", x: 1923, y: 1584, w: 144, h: 42 }] },
    { id: "west-cottage", prop: "redHouse", x: 890, y: 1785, w: 238, h: 206, sortY: 1868, collision: [{ type: "rect", x: 822, y: 1852, w: 136, h: 40 }] },
    { id: "east-guild-house", prop: "blueHouse", x: 2330, y: 1788, w: 260, h: 224, sortY: 1880, collision: [{ type: "rect", x: 2255, y: 1862, w: 150, h: 42 }] },
    { id: "west-windmill", prop: "windmill", x: 610, y: 1340, w: 300, h: 300, sortY: 1450, collision: { type: "circle", x: 610, y: 1440, r: 34 } },
    { id: "east-windmill", prop: "windmill", x: 2590, y: 1340, w: 300, h: 300, sortY: 1450, collision: { type: "circle", x: 2590, y: 1440, r: 34 } },
    { id: "north-watchtower", prop: "watchtower", x: 1600, y: 710, w: 270, h: 316, sortY: 832, collision: [{ type: "rect", x: 1564, y: 818, w: 72, h: 34 }] },
    { id: "west-lighthouse", prop: "lighthouse", x: 430, y: 1950, w: 230, h: 276, sortY: 2056, collision: { type: "circle", x: 430, y: 2048, r: 34 } },
    { id: "southwest-camp", prop: "tent", x: 850, y: 2320, w: 310, h: 238, sortY: 2414, collision: [{ type: "rect", x: 780, y: 2398, w: 140, h: 32 }] },
    { id: "southeast-camp", prop: "tent", x: 2380, y: 2320, w: 310, h: 238, sortY: 2414, collision: [{ type: "rect", x: 2310, y: 2398, w: 140, h: 32 }] },
    { id: "barrels-market", prop: "trees", x: 1825, y: 1730, w: 118, h: 92, sortY: 1768, collision: [{ type: "rect", x: 1782, y: 1755, w: 86, h: 28 }] }
  ],

  interactables: [
    { id: "harbor-boat", prop: "boat", label: "Barco", x: 1248, y: 2362, w: 270, h: 186, sortY: 2428, r: 56, used: false, collision: [{ type: "rect", x: 1178, y: 2397, w: 140, h: 32 }], message: "O barco novo esta pronto no porto plano. Mais tarde ele leva para novas ilhas." },
    { id: "dock-crates", prop: "crates", label: "Caixas", x: 1438, y: 2112, w: 142, h: 104, sortY: 2154, r: 50, used: false, reward: 10, collision: [{ type: "rect", x: 1392, y: 2140, w: 92, h: 26 }], message: "Voce encontrou moedas nas caixas 3D do porto." },
    { id: "village-chest", prop: "chest", label: "Bau", x: 1878, y: 1710, w: 112, h: 88, sortY: 1750, r: 56, used: false, reward: 40, collision: [{ type: "rect", x: 1838, y: 1732, w: 80, h: 30 }], message: "Bau aberto! Voce pegou moedas de aventureiro." },
    { id: "tower-chest", prop: "chest", label: "Bau raro", x: 1748, y: 825, w: 112, h: 88, sortY: 865, r: 60, used: false, reward: 90, collision: [{ type: "rect", x: 1708, y: 847, w: 80, h: 30 }], message: "Um bau raro perto da torre. Voce achou uma recompensa escondida." }
  ],

  natureProps: [
    { id: "palm-harbor-left", nature: "palm", x: 1090, y: 2180, w: 166, h: 200, sortY: 2274, collision: { type: "circle", x: 1090, y: 2275, r: 17 } },
    { id: "palm-harbor-right", nature: "palm", x: 2110, y: 2185, w: 166, h: 200, sortY: 2279, collision: { type: "circle", x: 2110, y: 2280, r: 17 } },
    { id: "tree-west-village", nature: "leafyTree", x: 1060, y: 1680, w: 196, h: 182, sortY: 1763, collision: { type: "circle", x: 1060, y: 1768, r: 20 } },
    { id: "tree-east-village", nature: "roundTree", x: 2170, y: 1665, w: 182, h: 166, sortY: 1736, collision: { type: "circle", x: 2170, y: 1745, r: 18 } },
    { id: "tree-field-edge", nature: "leafyTree", x: 2800, y: 1460, w: 196, h: 182, sortY: 1543, collision: { type: "circle", x: 2800, y: 1548, r: 20 } },
    { id: "tree-north-path", nature: "pineTree", x: 1310, y: 960, w: 158, h: 210, sortY: 1055, collision: { type: "circle", x: 1310, y: 1060, r: 18 } },
    { id: "tree-west-shore", nature: "roundTree", x: 600, y: 1520, w: 182, h: 166, sortY: 1591, collision: { type: "circle", x: 600, y: 1600, r: 18 } },
    { id: "tree-south-1", nature: "leafyTree", x: 1880, y: 2460, w: 196, h: 182, sortY: 2543, collision: { type: "circle", x: 1880, y: 2548, r: 20 } },
    { id: "flower-plaza-1", nature: "flowerPatch", x: 1430, y: 1670, w: 98, h: 72, sortY: 1700, passable: true },
    { id: "flower-plaza-2", nature: "flowerPatch", x: 1740, y: 1625, w: 98, h: 72, sortY: 1655, passable: true },
    { id: "bush-plaza-1", nature: "bush", x: 1845, y: 1575, w: 116, h: 84, sortY: 1612, passable: true },
    { id: "bush-west-path", nature: "flowerBush", x: 1010, y: 1340, w: 124, h: 88, sortY: 1378, passable: true },
    { id: "grass-east-field", nature: "tallGrass", x: 2360, y: 1580, w: 118, h: 84, sortY: 1618, passable: true },
    { id: "grass-west-camp", nature: "tallGrass", x: 745, y: 2140, w: 118, h: 84, sortY: 2178, passable: true }
  ],

  isInShapes(x, y, shapes) {
    return shapes.some(shape => this.utils.pointInEllipse(x, y, shape.x, shape.y, shape.rx, shape.ry));
  },

  isLand(x, y) {
    return this.isInShapes(x, y, this.landShapes) && !this.isInShapes(x, y, this.waterCuts);
  },

  isDock(x, y) {
    return this.docks.some(rect => this.utils.pointInRect(x, y, rect));
  },

  isWalkableSurface(x, y) {
    return this.isLand(x, y) || this.isDock(x, y);
  },

  allProps() {
    return this.groundProps.concat(this.props, this.natureProps, this.interactables);
  },

  hitsBlocker(x, y, r) {
    for (const prop of this.allProps()) {
      if (prop.passable) continue;
      if (prop.collision && this.hitsCollision(x, y, r, prop.collision)) return true;
    }
    return false;
  },

  hitsCollision(x, y, r, collision) {
    if (Array.isArray(collision)) return collision.some(part => this.hitsCollision(x, y, r, part));
    if (collision.type === "circle") return this.utils.dist(x, y, collision.x, collision.y) < r + collision.r;
    if (collision.type === "rect") return this.utils.circleRectCollision(x, y, r, collision);
    return false;
  },

  canWalk(x, y, r) {
    if (x - r < 0 || y - r < 0 || x + r > this.world.width || y + r > this.world.height) return false;

    const samples = [
      [x, y],
      [x - r * 0.76, y],
      [x + r * 0.76, y],
      [x, y - r * 0.5],
      [x, y + r * 0.86]
    ];

    for (const sample of samples) {
      if (!this.isWalkableSurface(sample[0], sample[1])) return false;
    }
    return !this.hitsBlocker(x, y, r);
  },

  randomEnemyPoint() {
    for (let i = 0; i < 500; i++) {
      const zone = this.enemyZones[Math.floor(Math.random() * this.enemyZones.length)];
      const x = zone.x + Math.random() * zone.w;
      const y = zone.y + Math.random() * zone.h;
      if (this.canWalk(x, y, 17)) return { x, y };
    }
    return { x: 760, y: 1900 };
  },

  getNearbyInteractable(x, y) {
    for (const item of this.interactables) {
      if (this.utils.dist(x, y, item.x, item.y) <= item.r + 64) return item;
    }
    return null;
  },

  useInteractable(item, player) {
    if (!item) return null;
    if (item.used) return item.label + " ja foi usado.";
    item.used = true;
    if (item.reward) player.moedas += item.reward;
    return item.message + (item.reward ? " +" + item.reward + " moedas." : "");
  },

  resetInteractables() {
    this.interactables.forEach(item => {
      item.used = false;
    });
  },

  invalidateCache() {
    this.baseCache = null;
  },

  drawBase(ctx, camera, canvas, zoom = 1) {
    const oldSmoothing = ctx.imageSmoothingEnabled;
    const base = this.getBaseCache();

    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = "#075c85";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (base) {
      const viewW = canvas.width / zoom;
      const viewH = canvas.height / zoom;
      const sx = Math.max(0, Math.floor(camera.x));
      const sy = Math.max(0, Math.floor(camera.y));
      const sw = Math.min(viewW, this.world.width - sx);
      const sh = Math.min(viewH, this.world.height - sy);
      ctx.drawImage(base, sx, sy, sw, sh, 0, 0, sw * zoom, sh * zoom);
    }

    ctx.imageSmoothingEnabled = oldSmoothing;
  },

  getBaseCache() {
    if (this.baseCache) return this.baseCache;

    const canvas = document.createElement("canvas");
    canvas.width = this.world.width;
    canvas.height = this.world.height;
    this.drawBaseCache(canvas.getContext("2d"));
    this.baseCache = canvas;
    return this.baseCache;
  },

  drawBaseCache(ctx) {
    const terrain = GP.Assets.terrain || {};
    const pattern = (name, fallback) => {
      if (!terrain[name]) return fallback;
      return ctx.createPattern(terrain[name], "repeat") || fallback;
    };
    const ellipse = (x, y, rx, ry, fill, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    const pathStroke = (points, width, fill, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      ctx.strokeStyle = fill;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point[0], point[1]);
        else ctx.lineTo(point[0], point[1]);
      });
      ctx.stroke();
      ctx.restore();
    };
    const rect = (x, y, w, h, fill, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    };
    const rand = seed => {
      const value = Math.sin(seed * 9283.137) * 43758.5453;
      return value - Math.floor(value);
    };
    const scatterAlongPath = (points, count, width, colorA, colorB, seedOffset) => {
      for (let i = 0; i < count; i++) {
        const segment = Math.floor(rand(seedOffset + i * 2.31) * (points.length - 1));
        const a = points[segment];
        const b = points[segment + 1];
        const t = rand(seedOffset + i * 3.17);
        const side = rand(seedOffset + i * 5.71) > 0.5 ? 1 : -1;
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const length = Math.hypot(dx, dy) || 1;
        const nx = -dy / length;
        const ny = dx / length;
        const distance = width * (0.36 + rand(seedOffset + i * 7.43) * 0.24) * side;
        const x = a[0] + dx * t + nx * distance;
        const y = a[1] + dy * t + ny * distance;
        const rx = 10 + rand(seedOffset + i * 11.13) * 18;
        const ry = 4 + rand(seedOffset + i * 13.91) * 9;
        ellipse(x, y, rx, ry, rand(seedOffset + i * 17.37) > 0.35 ? colorA : colorB, 0.48);
      }
    };
    const grassTufts = (cx, cy, rx, ry, count, seedOffset) => {
      for (let i = 0; i < count; i++) {
        const angle = rand(seedOffset + i * 2.9) * Math.PI * 2;
        const radius = 0.78 + rand(seedOffset + i * 4.1) * 0.22;
        const x = cx + Math.cos(angle) * rx * radius;
        const y = cy + Math.sin(angle) * ry * radius;
        ellipse(x, y, 12 + rand(seedOffset + i * 6.2) * 20, 5 + rand(seedOffset + i * 8.4) * 11, "rgba(92,174,53,0.5)", 1);
      }
    };

    ctx.imageSmoothingEnabled = true;

    const water = pattern("water", "#0788a8");
    const sand = pattern("sand", "#f1d17b");
    const grass = pattern("grass", "#72c85a");
    const dirt = pattern("dirt", "#d9bd7e");
    const grassSoft = "rgba(101, 185, 63, 0.58)";
    const flowerSoft = "rgba(255, 244, 158, 0.36)";

    ctx.fillStyle = water;
    ctx.fillRect(0, 0, this.world.width, this.world.height);

    ellipse(1600, 1560, 1445, 1325, "rgba(255,255,255,0.2)", 0.45);
    ellipse(1600, 1560, 1420, 1300, sand);
    ellipse(1600, 1540, 1250, 1130, grass);
    ellipse(1600, 1580, 970, 850, grass, 0.88);

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.58)";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.ellipse(1600, 1560, 1450, 1320, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(1600, 1560, 1510, 1370, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const northSouth = [[1600, 820], [1605, 1160], [1600, 1510], [1600, 1980], [1600, 2440]];
    const westEast = [[690, 1280], [1080, 1315], [1500, 1530], [1700, 1530], [2110, 1320], [2520, 1280]];
    const westCamp = [[890, 990], [1170, 1160], [1410, 1390]];
    const eastCamp = [[2310, 990], [2040, 1160], [1790, 1390]];

    pathStroke(northSouth, 188, grassSoft, 0.5);
    pathStroke(westEast, 184, grassSoft, 0.5);
    pathStroke(westCamp, 132, grassSoft, 0.5);
    pathStroke(eastCamp, 132, grassSoft, 0.5);
    pathStroke(northSouth, 124, dirt);
    pathStroke(westEast, 120, dirt);
    pathStroke(westCamp, 78, dirt);
    pathStroke(eastCamp, 78, dirt);

    ellipse(820, 875, 365, 255, grassSoft, 0.55);
    ellipse(2380, 875, 365, 255, grassSoft, 0.55);
    ellipse(820, 875, 320, 220, dirt);
    ellipse(2380, 875, 320, 220, dirt);
    ellipse(1600, 1538, 295, 190, dirt);
    ellipse(1600, 2070, 280, 155, dirt);

    rect(1320, 2040, 560, 430, dirt);
    rect(1390, 2110, 420, 90, dirt);
    rect(1552, 1920, 96, 600, dirt);

    scatterAlongPath(northSouth, 95, 130, grassSoft, flowerSoft, 10);
    scatterAlongPath(westEast, 90, 128, grassSoft, flowerSoft, 200);
    scatterAlongPath(westCamp, 42, 84, grassSoft, flowerSoft, 400);
    scatterAlongPath(eastCamp, 42, 84, grassSoft, flowerSoft, 600);
    grassTufts(820, 875, 330, 230, 70, 800);
    grassTufts(2380, 875, 330, 230, 70, 1000);
    grassTufts(1600, 1538, 300, 200, 48, 1200);

    for (let i = 0; i < 70; i++) {
      const x = 340 + i * 37 % 2500;
      const y = 390 + i * 73 % 2240;
      if (this.isLand(x, y) && !this.isDock(x, y)) {
        ellipse(x, y, 10 + i % 8, 4 + i % 5, i % 3 === 0 ? "rgba(255,255,255,0.18)" : "rgba(32,105,45,0.18)", 1);
      }
    }
  },

  getVisibleProps(camera, canvas, zoom = 1) {
    const pad = 240;
    const viewW = canvas.width / zoom;
    const viewH = canvas.height / zoom;
    const left = camera.x - pad;
    const right = camera.x + viewW + pad;
    const top = camera.y - pad;
    const bottom = camera.y + viewH + pad;

    return this.props.concat(this.natureProps, this.interactables).filter(prop => (
      prop.x + prop.w / 2 >= left &&
      prop.x - prop.w / 2 <= right &&
      prop.y + prop.h / 2 >= top &&
      prop.y - prop.h / 2 <= bottom
    ));
  },

  getVisibleGroundProps(camera, canvas, zoom = 1) {
    const pad = 240;
    const viewW = canvas.width / zoom;
    const viewH = canvas.height / zoom;
    const left = camera.x - pad;
    const right = camera.x + viewW + pad;
    const top = camera.y - pad;
    const bottom = camera.y + viewH + pad;

    return this.groundProps.filter(prop => (
      prop.x + prop.w / 2 >= left &&
      prop.x - prop.w / 2 <= right &&
      prop.y + prop.h / 2 >= top &&
      prop.y - prop.h / 2 <= bottom
    ));
  },

  drawProp(ctx, prop) {
    if (prop.nature) {
      GP.Assets.drawNature(ctx, prop.nature, prop.x, prop.y, prop.w, prop.h);
      return;
    }

    const w = prop.used && prop.prop === "chest" ? prop.w * 0.74 : prop.w;
    const h = prop.used && prop.prop === "chest" ? prop.h * 0.74 : prop.h;
    GP.Assets.drawProp(ctx, prop.prop, prop.x, prop.y, w, h);
  }
};
