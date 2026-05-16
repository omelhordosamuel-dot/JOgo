window.GP = window.GP || {};

GP.GameMap = {
  world: GP.CONFIG.world,
  utils: GP.Utils,
  baseCache: null,
  blocks: null,
  backgroundBlocks: null,
  customMap: null,
  customMapKey: "gabrielPieceCustomMapV1",
  currentInterior: null,
  interiorBlocks: null,
  interiorBackgroundBlocks: null,
  interiorExit: { col: 6, row: 10 },
  interiorRightExit: { col: 25, row: 10 },
  interiorNpcMarker: { col: 17, row: 12 },
  interiorShopMarker: { col: 9, row: 11 },
  shanksHouseDoor: { col: 77, row: 10 },
  shanksHouseRightDoor: { col: 85, row: 10 },

  blockSize: GP.CONFIG.world.blockSize || 48,
  blockCells: {
    grass: { atlas: "terrainBlockAtlas", cell: [0, 0], cols: 2, rows: 2 },
    dirt: { atlas: "terrainBlockAtlas", cell: [1, 0], cols: 2, rows: 2 },
    stone: { atlas: "terrainBlockAtlas", cell: [0, 1], cols: 2, rows: 2 },
    sand: { atlas: "terrainBlockAtlas", cell: [1, 1], cols: 2, rows: 2 },
    wood: { atlas: "constructionBlockAtlas", cell: [0, 0], cols: 3, rows: 2 },
    plank: { atlas: "constructionBlockAtlas", cell: [1, 0], cols: 3, rows: 2 },
    roof: { atlas: "constructionBlockAtlas", cell: [2, 0], cols: 3, rows: 2 },
    brick: { atlas: "constructionBlockAtlas", cell: [0, 1], cols: 3, rows: 2 },
    water: { atlas: "constructionBlockAtlas", cell: [1, 1], cols: 3, rows: 2 },
    leaves: { atlas: "constructionBlockAtlas", cell: [2, 1], cols: 3, rows: 2 },
    palmWood: { atlas: "extraBlockAtlas", cell: [0, 0], cols: 4, rows: 2 },
    palmLeaves: { atlas: "extraBlockAtlas", cell: [1, 0], cols: 4, rows: 2 },
    darkStone: { atlas: "extraBlockAtlas", cell: [2, 0], cols: 4, rows: 2 },
    ironOre: { atlas: "extraBlockAtlas", cell: [3, 0], cols: 4, rows: 2 },
    goldOre: { atlas: "extraBlockAtlas", cell: [0, 1], cols: 4, rows: 2 },
    plaster: { atlas: "extraBlockAtlas", cell: [1, 1], cols: 4, rows: 2 },
    ropeNet: { atlas: "extraBlockAtlas", cell: [2, 1], cols: 4, rows: 2 },
    coral: { atlas: "extraBlockAtlas", cell: [3, 1], cols: 4, rows: 2 },
    doorClosedTop: { atlas: "doorBlockAtlas", cell: [0, 0], cols: 2, rows: 2 },
    doorClosedBottom: { atlas: "doorBlockAtlas", cell: [0, 1], cols: 2, rows: 2 },
    doorOpenTop: { atlas: "doorBlockAtlas", cell: [1, 0], cols: 2, rows: 2 },
    doorOpenBottom: { atlas: "doorBlockAtlas", cell: [1, 1], cols: 2, rows: 2 }
  },

  props: [],

  groundProps: [],

  interactables: [],

  invalidateCache() {
    this.baseCache = null;
  },

  getActiveBlocks() {
    if (this.currentInterior === "shanksHouse") {
      this.ensureInteriorBlocks();
      return this.interiorBlocks;
    }
    this.ensureBlocks();
    return this.blocks;
  },

  enterInterior(id) {
    this.currentInterior = id;
    this.invalidateCache();
  },

  exitInterior() {
    this.currentInterior = null;
    this.invalidateCache();
  },

  ensureInteriorBlocks() {
    if (this.interiorBlocks) return;
    const cols = Math.ceil(this.world.width / this.blockSize);
    const rows = Math.ceil(this.world.height / this.blockSize);
    this.interiorBlocks = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
    this.interiorBackgroundBlocks = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

    const left = 5;
    const right = 25;
    const top = 5;
    const floor = 13;
    for (let col = left; col <= right; col++) {
      this.interiorBlocks[floor][col] = "darkStone";
      this.interiorBlocks[top][col] = "palmWood";
      for (let row = top + 1; row < floor; row++) {
        this.interiorBackgroundBlocks[row][col] = "plank";
      }
    }
    for (let row = top; row <= floor; row++) {
      this.interiorBlocks[row][left] = "darkStone";
      this.interiorBlocks[row][right] = "darkStone";
    }

    this.interiorBlocks[10][left] = "doorClosedTop";
    this.interiorBlocks[11][left] = "doorClosedBottom";
    this.interiorBlocks[10][right] = "doorClosedTop";
    this.interiorBlocks[11][right] = "doorClosedBottom";
    this.interiorBlocks[12][8] = "brick";
    this.interiorBlocks[12][9] = "brick";
    this.interiorBlocks[12][18] = "wood";
    this.interiorBlocks[12][19] = "wood";
  },

  ensureBlocks() {
    if (this.blocks) return;

    const cols = Math.ceil(this.world.width / this.blockSize);
    const rows = Math.ceil(this.world.height / this.blockSize);
    const seaRow = Math.floor((this.world.groundY || 624) / this.blockSize);
    const leftWaterEnd = 8;
    const leftBeachEnd = 20;
    const rightBeachStart = cols - 21;
    const rightWaterStart = cols - 9;

    this.blocks = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

    for (let col = 0; col < cols; col++) {
      const center = Math.abs(col - cols / 2) / (cols / 2);
      const hill = center < 0.46 ? Math.round(Math.sin(col * 0.18) * 0.7 + Math.sin(col * 0.05) * 0.9) : 0;
      const surfaceRow = (col <= leftBeachEnd || col >= rightBeachStart) ? seaRow : seaRow - 1 - hill;
      const isWater = col < leftWaterEnd || col >= rightWaterStart;
      const isBeach = !isWater && (col <= leftBeachEnd || col >= rightBeachStart);

      for (let row = 0; row < rows; row++) {
        if (isWater) {
          if (row >= seaRow) this.blocks[row][col] = "water";
          continue;
        }

        if (row < surfaceRow) continue;
        if (isBeach) {
          this.blocks[row][col] = row <= surfaceRow + 2 ? "sand" : "stone";
        } else if (row === surfaceRow) {
          this.blocks[row][col] = "grass";
        } else if (row < surfaceRow + 4) {
          this.blocks[row][col] = "dirt";
        } else {
          this.blocks[row][col] = row % 5 === 0 && col % 7 < 3 ? "stone" : "dirt";
        }
      }
    }

    this.createBackgroundScenery();
    this.loadCustomMap();
    this.applyCustomMap();
  },

  createBackgroundScenery() {
    this.backgroundBlocks = [];

    [520, 1120, 1880, 2620, 3420, 4300, 4860].forEach((x, index) => {
      this.addTreeBlocks(x, 4 + (index % 2), index % 3);
    });
  },

  addTreeBlocks(x, trunkHeight, variant) {
    const col = Math.floor(x / this.blockSize);
    const groundRow = Math.floor(this.getGroundY(x) / this.blockSize);
    const put = (c, r, type) => this.backgroundBlocks.push({ col: c, row: r, type });

    for (let i = 1; i <= trunkHeight; i++) {
      const lean = i > 2 && variant === 1 ? -1 : i > 3 && variant === 2 ? 1 : 0;
      put(col + lean, groundRow - i, "palmWood");
    }

    const topCol = col + (variant === 1 ? -1 : variant === 2 ? 1 : 0);
    const topRow = groundRow - trunkHeight - 1;
    const canopy = [
      [0, 0], [-1, 0], [1, 0],
      [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1],
      [-2, 2], [-1, 2], [1, 2], [2, 2],
      [-1, -1], [0, -1], [1, -1]
    ];

    canopy.forEach(([dx, dy]) => put(topCol + dx, topRow + dy, "palmLeaves"));
  },

  worldToCol(x) {
    const blocks = this.getActiveBlocks();
    const cols = blocks[0].length;
    return Math.max(0, Math.min(cols - 1, Math.floor(x / this.blockSize)));
  },

  getBlock(col, row) {
    const blocks = this.getActiveBlocks();
    if (row < 0 || row >= blocks.length || col < 0 || col >= blocks[0].length) return null;
    return blocks[row][col];
  },

  inBounds(col, row) {
    const blocks = this.getActiveBlocks();
    return row >= 0 && row < blocks.length && col >= 0 && col < blocks[0].length;
  },

  setBlock(col, row, type) {
    this.ensureBlocks();
    if (!this.inBounds(col, row)) return false;
    this.blocks[row][col] = type || null;
    this.invalidateCache();
    return true;
  },

  isDoorBlock(type) {
    return type === "doorClosedTop" || type === "doorClosedBottom" || type === "doorOpenTop" || type === "doorOpenBottom";
  },

  isOpenDoorBlock(type) {
    return type === "doorOpenTop" || type === "doorOpenBottom";
  },

  getDoorTopRow(col, row) {
    const type = this.getBlock(col, row);
    if (type === "doorClosedBottom" || type === "doorOpenBottom") return row - 1;
    if (type === "doorClosedTop" || type === "doorOpenTop") return row;
    return null;
  },

  isSolidBlock(type) {
    return !!type && type !== "water" && !this.isOpenDoorBlock(type);
  },

  isPassableInInterior(type) {
    const passableTypes = ["palmWood", "palmLeaves", "brick", "plank", "wood", "leaves", "plaster", "ropeNet", "coral"];
    return passableTypes.includes(type);
  },

  isSolidBlockForCollision(type) {
    if (this.currentInterior && this.isPassableInInterior(type)) {
      return false;
    }
    return this.isSolidBlock(type);
  },

  isDrawableBlock(type) {
    return !!type;
  },

  isWaterBlock(type) {
    return type === "water";
  },

  getSurfaceBlock(x) {
    const blocks = this.getActiveBlocks();
    const col = this.worldToCol(x);
    for (let row = 0; row < blocks.length; row++) {
      if (blocks[row][col]) return blocks[row][col];
    }
    return null;
  },

  mapKey(col, row) {
    return col + "," + row;
  },

  parseMapKey(key) {
    const parts = String(key).split(",");
    return { col: Number(parts[0]), row: Number(parts[1]) };
  },

  createEmptyCustomMap() {
    return {
      version: 1,
      foreground: {},
      background: {},
      invisible: {},
      markers: {}
    };
  },

  ensureCustomMap() {
    if (!this.customMap) this.customMap = this.createEmptyCustomMap();
    this.customMap.foreground = this.customMap.foreground || {};
    this.customMap.background = this.customMap.background || {};
    this.customMap.invisible = this.customMap.invisible || {};
    this.customMap.markers = this.customMap.markers || {};
    return this.customMap;
  },

  loadCustomMap() {
    if (this.customMap) return this.ensureCustomMap();
    let data = null;

    if (window.GP && GP.CUSTOM_MAP_DATA) data = GP.CUSTOM_MAP_DATA;
    if (typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem(this.customMapKey);
        if (raw) data = JSON.parse(raw);
      } catch (error) {}
    }

    this.customMap = Object.assign(this.createEmptyCustomMap(), data || {});
    return this.ensureCustomMap();
  },

  saveCustomMap() {
    const data = this.ensureCustomMap();
    if (typeof localStorage === "undefined") return false;
    try {
      localStorage.setItem(this.customMapKey, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  },

  clearCustomMap() {
    this.customMap = this.createEmptyCustomMap();
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(this.customMapKey);
      } catch (error) {}
    }
    this.blocks = null;
    this.invalidateCache();
  },

  applyCustomMap() {
    const data = this.ensureCustomMap();
    Object.keys(data.foreground).forEach(key => {
      const pos = this.parseMapKey(key);
      if (!this.inBounds(pos.col, pos.row)) return;
      this.blocks[pos.row][pos.col] = data.foreground[key] || null;
    });
  },

  setEditorBlock(col, row, type, layer, tool) {
    this.ensureBlocks();
    const data = this.ensureCustomMap();
    if (!this.inBounds(col, row)) return false;
    const key = this.mapKey(col, row);
    const selectedLayer = layer || "solid";
    const selectedTool = tool || "paint";

    if (type === "door" && selectedLayer !== "npcMarker" && selectedLayer !== "imageMarker") {
      return this.setEditorDoor(col, row, selectedTool);
    }

    if (selectedTool === "erase") {
      const doorTop = this.getDoorTopRow(col, row);
      if (doorTop !== null) return this.setEditorDoor(col, doorTop, "erase");
      if (selectedLayer === "background") {
        delete data.background[key];
      } else if (selectedLayer === "invisible") {
        delete data.invisible[key];
      } else if (selectedLayer === "npcMarker" || selectedLayer === "imageMarker") {
        delete data.markers[key];
      } else {
        this.blocks[row][col] = null;
        data.foreground[key] = null;
      }
      this.invalidateCache();
      return true;
    }

    if (selectedLayer === "background") {
      data.background[key] = type;
    } else if (selectedLayer === "invisible") {
      data.invisible[key] = true;
    } else if (selectedLayer === "npcMarker" || selectedLayer === "imageMarker") {
      data.markers[key] = {
        type: selectedLayer === "npcMarker" ? "npc" : "image",
        block: type || "marker",
        x: col * this.blockSize + this.blockSize / 2,
        y: row * this.blockSize + this.blockSize / 2
      };
    } else {
      this.blocks[row][col] = type;
      data.foreground[key] = type;
    }

    this.invalidateCache();
    return true;
  },

  setEditorDoor(col, row, tool) {
    this.ensureBlocks();
    const data = this.ensureCustomMap();
    if (!this.inBounds(col, row) || !this.inBounds(col, row + 1)) return false;
    const topKey = this.mapKey(col, row);
    const bottomKey = this.mapKey(col, row + 1);

    if (tool === "erase") {
      this.blocks[row][col] = null;
      this.blocks[row + 1][col] = null;
      data.foreground[topKey] = null;
      data.foreground[bottomKey] = null;
      this.invalidateCache();
      return true;
    }

    this.blocks[row][col] = "doorClosedTop";
    this.blocks[row + 1][col] = "doorClosedBottom";
    data.foreground[topKey] = "doorClosedTop";
    data.foreground[bottomKey] = "doorClosedBottom";
    this.invalidateCache();
    return true;
  },

  toggleDoorAt(col, row) {
    const blocks = this.getActiveBlocks();
    const topRow = this.getDoorTopRow(col, row);
    if (topRow === null || !this.inBounds(col, topRow + 1)) return false;
    const top = blocks[topRow][col];
    const open = top === "doorOpenTop";
    const nextTop = open ? "doorClosedTop" : "doorOpenTop";
    const nextBottom = open ? "doorClosedBottom" : "doorOpenBottom";
    blocks[topRow][col] = nextTop;
    blocks[topRow + 1][col] = nextBottom;
    if (!this.currentInterior) {
      const data = this.ensureCustomMap();
      data.foreground[this.mapKey(col, topRow)] = nextTop;
      data.foreground[this.mapKey(col, topRow + 1)] = nextBottom;
    }
    this.invalidateCache();
    return true;
  },

  toggleDoorNear(x, y, maxDistance = 82) {
    const blocks = this.getActiveBlocks();
    const centerCol = this.worldToCol(x);
    const centerRow = Math.max(0, Math.min(blocks.length - 1, Math.floor(y / this.blockSize)));
    const range = Math.ceil(maxDistance / this.blockSize);

    for (let row = centerRow - range; row <= centerRow + range; row++) {
      for (let col = centerCol - range; col <= centerCol + range; col++) {
        if (!this.inBounds(col, row) || !this.isDoorBlock(blocks[row][col])) continue;
        const doorX = col * this.blockSize + this.blockSize / 2;
        const doorY = (this.getDoorTopRow(col, row) || row) * this.blockSize + this.blockSize;
        if (this.utils.dist(x, y, doorX, doorY) <= maxDistance) return this.toggleDoorAt(col, row);
      }
    }
    return false;
  },

  hasInvisibleBlock(col, row) {
    const data = this.loadCustomMap();
    return !!(data.invisible && data.invisible[this.mapKey(col, row)]);
  },

  hasSolidAtWorld(x, y) {
    const blocks = this.getActiveBlocks();
    const col = Math.floor(x / this.blockSize);
    const row = Math.floor(y / this.blockSize);
    if (!this.inBounds(col, row)) return true;
    return this.isSolidBlockForCollision(blocks[row][col]) || (!this.currentInterior && this.hasInvisibleBlock(col, row));
  },

  actorOverlapsSolid(x, footY, radius, height) {
    const left = x - radius;
    const right = x + radius;
    const shoulderY = footY - Math.min(height * 0.55, this.blockSize * 0.95);
    const footSampleY = footY - 12;
    const sampleYs = [shoulderY, footSampleY];
    for (const sy of sampleYs) {
      if (this.hasSolidAtWorld(left, sy) || this.hasSolidAtWorld(right, sy)) return true;
    }
    return false;
  },

  exportCustomMapCode() {
    return "window.GP = window.GP || {};\nGP.CUSTOM_MAP_DATA = " + JSON.stringify(this.ensureCustomMap(), null, 2) + ";\n";
  },

  resetInteractables() {
    this.interactables.forEach(item => {
      item.used = false;
    });
  },

  allProps() {
    return this.groundProps.concat(this.props, this.interactables);
  },

  getGroundY(x) {
    const blocks = this.getActiveBlocks();
    const col = this.worldToCol(x);
    for (let row = 0; row < blocks.length; row++) {
      if (this.isSolidBlockForCollision(blocks[row][col]) || (!this.currentInterior && this.hasInvisibleBlock(col, row))) return row * this.blockSize;
    }
    return this.world.height;
  },

  getGroundYBelow(x, footY) {
    const blocks = this.getActiveBlocks();
    const col = this.worldToCol(x);
    const startRow = Math.max(0, Math.min(blocks.length - 1, Math.floor(footY / this.blockSize)));
    for (let row = startRow; row < blocks.length; row++) {
      if (this.isSolidBlockForCollision(blocks[row][col]) || (!this.currentInterior && this.hasInvisibleBlock(col, row))) return row * this.blockSize;
    }
    return this.world.height;
  },

  canWalk(x, y, r) {
    if (x - r < 0 || x + r > this.world.width || y > this.world.height) return false;
    return !this.isWaterBlock(this.getSurfaceBlock(x));
  },

  randomEnemyPoint() {
    const x = 1100 + Math.random() * 3300;
    return { x, y: this.getGroundY(x) };
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

  drawBase(ctx, camera, canvas, zoom = 1) {
    const base = this.getBaseCache();
    const viewW = canvas.width / zoom;
    const viewH = canvas.height / zoom;
    const sx = Math.max(0, Math.floor(camera.x));
    const sy = Math.max(0, Math.floor(camera.y));
    const sw = Math.min(viewW, this.world.width - sx);
    const sh = Math.min(viewH, this.world.height - sy);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(base, sx, sy, sw, sh, 0, 0, sw * zoom, sh * zoom);
    ctx.restore();
  },

  getBaseCache() {
    if (this.baseCache) return this.baseCache;
    this.ensureBlocks();
    const canvas = document.createElement("canvas");
    canvas.width = this.world.width;
    canvas.height = this.world.height;
    this.drawBaseCache(canvas.getContext("2d"));
    this.baseCache = canvas;
    return canvas;
  },

  drawBaseCache(ctx) {
    if (this.currentInterior === "shanksHouse") {
      this.drawInterior(ctx);
      return;
    }
    this.drawSky(ctx);

    this.drawBackgroundBlocks(ctx);
    this.drawBlocks(ctx);
  },

  drawSky(ctx) {
    const sky = GP.Assets.get && GP.Assets.get("skyTexture");
    if (!sky) {
      const fallback = ctx.createLinearGradient(0, 0, 0, this.world.height);
      fallback.addColorStop(0, "#6fb7d7");
      fallback.addColorStop(0.55, "#b8d7d6");
      fallback.addColorStop(1, "#e8d2a3");
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, this.world.width, this.world.height);
      return;
    }

    const drawH = this.world.height;
    const drawW = sky.width * (drawH / sky.height);
    for (let x = 0; x < this.world.width; x += drawW) {
      ctx.drawImage(sky, x, 0, drawW + 1, drawH);
    }
  },

  drawBackgroundBlocks(ctx) {
    this.ensureBlocks();
    const data = this.ensureCustomMap();
    const size = this.blockSize;
    ctx.save();
    ctx.globalAlpha = 0.72;
    for (const block of this.backgroundBlocks || []) {
      this.drawBlockCell(ctx, block.type, block.col * size, block.row * size, size, true);
    }
    Object.keys(data.background).forEach(key => {
      const pos = this.parseMapKey(key);
      if (!this.inBounds(pos.col, pos.row)) return;
      this.drawBlockCell(ctx, data.background[key], pos.col * size, pos.row * size, size, true);
    });
    ctx.restore();
  },

  drawBlocks(ctx) {
    const blocks = this.getActiveBlocks();
    const size = this.blockSize;

    for (let row = 0; row < blocks.length; row++) {
      for (let col = 0; col < blocks[row].length; col++) {
        const type = blocks[row][col];
        if (!this.isDrawableBlock(type)) continue;

        const x = col * size;
        const y = row * size;
        this.drawBlockCell(ctx, type, x, y, size, false);
      }
    }
  },

  drawInterior(ctx) {
    ctx.fillStyle = "#15100d";
    ctx.fillRect(0, 0, this.world.width, this.world.height);
    const wall = ctx.createLinearGradient(0, 0, 0, this.world.height);
    wall.addColorStop(0, "#33251d");
    wall.addColorStop(1, "#18110d");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, this.world.width, this.world.height);
    this.drawInteriorBackgroundBlocks(ctx);
    this.drawBlocks(ctx);
  },

  drawInteriorBackgroundBlocks(ctx) {
    this.ensureInteriorBlocks();
    const size = this.blockSize;
    ctx.save();
    ctx.globalAlpha = 0.78;
    for (let row = 0; row < this.interiorBackgroundBlocks.length; row++) {
      for (let col = 0; col < this.interiorBackgroundBlocks[row].length; col++) {
        const type = this.interiorBackgroundBlocks[row][col];
        if (!type) continue;
        this.drawBlockCell(ctx, type, col * size, row * size, size, true);
      }
    }
    ctx.restore();
  },

  drawBlockCell(ctx, type, x, y, size, background) {
    const spec = this.blockCells[type];
    const fallback = {
      grass: "#6bbf45",
      dirt: "#8b5c34",
      sand: "#d7b566",
      stone: "#777777",
      wood: "#8d5a2b",
      plank: "#b87332",
      roof: "#b74324",
      brick: "#777777",
      water: "#169bd7",
      leaves: "#4fa83d",
      palmWood: "#8a5a29",
      palmLeaves: "#2f8f35",
      darkStone: "#303033",
      ironOre: "#aab6c4",
      goldOre: "#d6a32d",
      plaster: "#e8dfcf",
      ropeNet: "#a8793a",
      coral: "#d6536c",
      doorClosedTop: "#764822",
      doorClosedBottom: "#764822",
      doorOpenTop: "#9a602d",
      doorOpenBottom: "#9a602d"
    };
    const atlas = spec && GP.Assets.get && GP.Assets.get(spec.atlas);

    if (atlas && spec) {
      const cellW = Math.floor(atlas.width / spec.cols);
      const cellH = Math.floor(atlas.height / spec.rows);
      ctx.drawImage(atlas, spec.cell[0] * cellW, spec.cell[1] * cellH, cellW, cellH, x, y, size, size);
    } else {
      ctx.fillStyle = fallback[type] || "#7d6a43";
      ctx.fillRect(x, y, size, size);
    }

    ctx.strokeStyle = background ? "rgba(18, 30, 28, 0.12)" : "rgba(12, 28, 22, 0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  },

  getVisibleProps(camera, canvas, zoom = 1) {
    const pad = 260;
    const viewW = canvas.width / zoom;
    const viewH = canvas.height / zoom;
    const left = camera.x - pad;
    const right = camera.x + viewW + pad;
    const top = camera.y - pad;
    const bottom = camera.y + viewH + pad;
    return this.props.concat(this.natureProps || [], this.interactables).filter(prop => (
      prop.x + prop.w / 2 >= left &&
      prop.x - prop.w / 2 <= right &&
      prop.y + prop.h / 2 >= top &&
      prop.y - prop.h / 2 <= bottom
    ));
  },

  getVisibleGroundProps(camera, canvas, zoom = 1) {
    const pad = 260;
    const viewW = canvas.width / zoom;
    const left = camera.x - pad;
    const right = camera.x + viewW + pad;
    return this.groundProps.filter(prop => prop.x + prop.w / 2 >= left && prop.x - prop.w / 2 <= right);
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
