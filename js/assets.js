window.GP = window.GP || {};

GP.Assets = {
  playerSheet: new Image(),
  mapBase: null,
  propsAtlas: null,
  aiHouseAtlas: null,
  natureAtlas: null,
  terrain: {},
  cleanPlayerSheet: null,
  loaded: false,

  load(onReady, onError) {
    this.mapBase = null;
    this.propsAtlas = this.createPropsAtlas(1024, 768);
    this.natureAtlas = this.createNatureAtlas(1024, 512);
    let pending = 6;
    let failed = false;

    const done = () => {
      pending--;
      if (pending === 0 && !failed) {
        this.loaded = true;
        if (onReady) onReady();
      }
    };

    const fail = message => {
      failed = true;
      if (onError) onError(message);
    };

    const aiProps = new Image();
    aiProps.onload = () => {
      this.aiHouseAtlas = this.removeChromaKey(aiProps, { r: 0, g: 255, b: 0 });
      done();
    };
    aiProps.onerror = done;
    aiProps.src = "assets/ai-map/props-atlas-ai-raw.png";

    ["water", "sand", "grass", "dirt"].forEach(name => {
      const img = new Image();
      img.onload = () => {
        this.terrain[name] = this.createTerrainTile(img, 512);
        done();
      };
      img.onerror = done;
      img.src = "assets/terrain/" + name + ".png";
    });

    this.playerSheet.onload = () => {
      this.cleanPlayerSheet = this.removeFakeBackground(this.playerSheet);
      done();
    };

    this.playerSheet.onerror = () => {
      fail("Nao achei personagem.png na pasta principal.");
    };

    this.playerSheet.src = "personagem.png";
  },

  createCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  },

  createTerrainTile(img, size) {
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, size, size);
    return canvas;
  },

  createMapBase(width, height) {
    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const sx = width / 3200;
    const sy = height / 3200;
    const rect = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * sx, y * sy, w * sx, h * sy);
    };
    const ellipse = (x, y, rx, ry, color, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x * sx, y * sy, rx * sx, ry * sy, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    const path = (points, color, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p[0] * sx, p[1] * sy);
        else ctx.lineTo(p[0] * sx, p[1] * sy);
      });
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const sea = ctx.createLinearGradient(0, 0, width, height);
    sea.addColorStop(0, "#087aa5");
    sea.addColorStop(0.55, "#0aa6b5");
    sea.addColorStop(1, "#075d8b");
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, width, height);

    ellipse(1600, 1600, 1430, 1310, "#f1d17b");
    ellipse(1600, 1540, 1300, 1180, "#74bd59");
    ellipse(1600, 1580, 1050, 950, "#7fcb65", 0.88);
    ellipse(1600, 1620, 760, 650, "#8bd36f", 0.9);

    path([[1510, 2600], [1690, 2600], [1760, 2050], [1440, 2050]], "#c59c56", 0.92);
    rect(1320, 2040, 560, 430, "#8b653c");
    rect(1390, 2110, 420, 90, "#a87a45");
    rect(1552, 1920, 96, 600, "#b88b4e");
    rect(1040, 1535, 1120, 110, "#d9bd7e");
    rect(1545, 870, 110, 1390, "#d9bd7e");
    rect(1030, 1200, 320, 90, "#d9bd7e");
    rect(2150, 1110, 360, 90, "#d9bd7e");
    ellipse(1600, 1560, 250, 170, "#d9bd7e");

    for (let i = 0; i < 95; i++) {
      const x = 280 + Math.random() * 2640;
      const y = 300 + Math.random() * 2480;
      const inside = Math.pow((x - 1600) / 1340, 2) + Math.pow((y - 1560) / 1220, 2) <= 1;
      if (inside) ellipse(x, y, 5 + Math.random() * 12, 2 + Math.random() * 6, Math.random() > 0.5 ? "#5dab50" : "#a5d975", 0.25);
    }

    rect(1240, 1450, 720, 360, "rgba(255,255,255,0.035)");
    rect(1260, 1470, 680, 320, "rgba(29,77,63,0.06)");

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 4 * sx;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(1600 * sx, 1600 * sy, (1450 + i * 32) * sx, 0.12, 2.9);
      ctx.stroke();
    }

    return canvas;
  },

  createPropsAtlas(width, height) {
    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const cw = width / 4;
    const ch = height / 3;
    const draw = (col, row, fn) => {
      ctx.save();
      ctx.translate(col * cw, row * ch);
      fn(ctx, cw, ch);
      ctx.restore();
    };

    draw(0, 0, (c, w, h) => this.drawHouse(c, w, h, "#3b8cff"));
    draw(1, 0, (c, w, h) => this.drawHouse(c, w, h, "#d94a3a"));
    draw(2, 0, (c, w, h) => this.drawInn(c, w, h));
    draw(3, 0, (c, w, h) => this.drawWindmill(c, w, h));
    draw(0, 1, (c, w, h) => this.drawDock(c, w, h));
    draw(1, 1, (c, w, h) => this.drawBoat(c, w, h));
    draw(2, 1, (c, w, h) => this.drawLighthouse(c, w, h));
    draw(3, 1, (c, w, h) => this.drawTent(c, w, h));
    draw(0, 2, (c, w, h) => this.drawWatchtower(c, w, h));
    draw(1, 2, (c, w, h) => this.drawBarrels(c, w, h));
    draw(2, 2, (c, w, h) => this.drawCrates(c, w, h));
    draw(3, 2, (c, w, h) => this.drawChest(c, w, h));

    return canvas;
  },

  createNatureAtlas(width, height) {
    const canvas = this.createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const cw = width / 4;
    const ch = height / 2;
    const draw = (col, row, fn) => {
      ctx.save();
      ctx.translate(col * cw, row * ch);
      fn(ctx, cw, ch);
      ctx.restore();
    };

    draw(0, 0, (c, w, h) => this.drawPalm(c, w, h));
    draw(1, 0, (c, w, h) => this.drawLeafyTree(c, w, h, "#47a447"));
    draw(2, 0, (c, w, h) => this.drawLeafyTree(c, w, h, "#5ecf5b"));
    draw(3, 0, (c, w, h) => this.drawPine(c, w, h));
    draw(0, 1, (c, w, h) => this.drawBush(c, w, h, "#4ca84d"));
    draw(1, 1, (c, w, h) => this.drawBush(c, w, h, "#54b354", true));
    draw(2, 1, (c, w, h) => this.drawFlowers(c, w, h));
    draw(3, 1, (c, w, h) => this.drawTallGrass(c, w, h));

    return canvas;
  },

  shadow(ctx, x, y, w, h) {
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  poly(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
    ctx.fill();
  },

  drawHouse(ctx, w, h, roof) {
    this.shadow(ctx, w / 2, h * 0.78, w * 0.33, h * 0.08);
    this.poly(ctx, [[55, 110], [128, 72], [202, 110], [128, 150]], "#f5d9a1");
    this.poly(ctx, [[55, 110], [128, 150], [128, 206], [55, 166]], "#d9b177");
    this.poly(ctx, [[202, 110], [128, 150], [128, 206], [202, 166]], "#c69a62");
    this.poly(ctx, [[42, 105], [128, 48], [214, 105], [128, 154]], roof);
    this.poly(ctx, [[42, 105], [128, 154], [128, 170], [42, 122]], "#2d2d42");
    this.poly(ctx, [[214, 105], [128, 154], [128, 170], [214, 122]], "#202033");
    ctx.fillStyle = "#4b2d24";
    ctx.fillRect(113, 158, 30, 44);
    ctx.fillStyle = "#ffd879";
    ctx.fillRect(76, 137, 24, 22);
    ctx.fillRect(158, 137, 24, 22);
  },

  drawInn(ctx, w, h) {
    this.drawHouse(ctx, w, h, "#b94830");
    ctx.fillStyle = "#ffe66d";
    ctx.fillRect(97, 108, 62, 18);
    ctx.fillStyle = "#5d2b1d";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("INN", 128, 122);
  },

  drawWindmill(ctx, w, h) {
    this.shadow(ctx, 128, 198, 42, 12);
    this.poly(ctx, [[96, 112], [160, 112], [174, 206], [82, 206]], "#d8bd87");
    this.poly(ctx, [[104, 80], [128, 52], [152, 80], [160, 112], [96, 112]], "#b94a37");
    ctx.fillStyle = "#6b4a30";
    ctx.fillRect(119, 162, 18, 44);
    ctx.strokeStyle = "#f7ead4";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(128, 105);
    ctx.lineTo(128, 24);
    ctx.moveTo(128, 105);
    ctx.lineTo(202, 105);
    ctx.moveTo(128, 105);
    ctx.lineTo(128, 186);
    ctx.moveTo(128, 105);
    ctx.lineTo(54, 105);
    ctx.stroke();
    ctx.fillStyle = "#704424";
    ctx.beginPath();
    ctx.arc(128, 105, 10, 0, Math.PI * 2);
    ctx.fill();
  },

  drawDock(ctx, w, h) {
    this.shadow(ctx, 128, 142, 80, 35);
    ctx.fillStyle = "#93663a";
    for (let i = 0; i < 6; i++) ctx.fillRect(38 + i * 30, 56, 22, 152);
    ctx.fillStyle = "#c18b50";
    ctx.fillRect(34, 80, 188, 30);
    ctx.fillRect(34, 150, 188, 30);
    ctx.fillStyle = "#5b371e";
    for (let i = 0; i < 5; i++) ctx.fillRect(46 + i * 38, 48, 14, 172);
  },

  drawBoat(ctx, w, h) {
    this.shadow(ctx, 128, 160, 68, 18);
    this.poly(ctx, [[54, 138], [202, 138], [176, 178], [82, 178]], "#8a4f28");
    this.poly(ctx, [[72, 128], [184, 128], [202, 138], [54, 138]], "#b26b36");
    ctx.fillStyle = "#61351e";
    ctx.fillRect(124, 62, 8, 74);
    this.poly(ctx, [[132, 66], [182, 112], [132, 124]], "#fff5c4");
  },

  drawLighthouse(ctx, w, h) {
    this.shadow(ctx, 128, 211, 36, 10);
    this.poly(ctx, [[104, 74], [152, 74], [168, 210], [88, 210]], "#f5f1dd");
    this.poly(ctx, [[104, 74], [152, 74], [148, 110], [108, 110]], "#cf3434");
    this.poly(ctx, [[96, 46], [160, 46], [152, 74], [104, 74]], "#253045");
    ctx.fillStyle = "#ffe66d";
    ctx.fillRect(114, 54, 28, 14);
    ctx.fillStyle = "#cf3434";
    ctx.fillRect(100, 142, 56, 20);
  },

  drawTent(ctx, w, h) {
    this.shadow(ctx, 128, 180, 70, 18);
    this.poly(ctx, [[55, 174], [128, 72], [201, 174]], "#e65e43");
    this.poly(ctx, [[128, 72], [201, 174], [128, 194]], "#b8402d");
    this.poly(ctx, [[55, 174], [128, 194], [128, 72]], "#f47a4f");
    ctx.fillStyle = "#3d241c";
    ctx.beginPath();
    ctx.moveTo(114, 188);
    ctx.lineTo(128, 138);
    ctx.lineTo(142, 188);
    ctx.fill();
  },

  drawWatchtower(ctx, w, h) {
    this.shadow(ctx, 128, 218, 52, 12);
    ctx.strokeStyle = "#7b522e";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(92, 218);
    ctx.lineTo(112, 96);
    ctx.moveTo(164, 218);
    ctx.lineTo(144, 96);
    ctx.moveTo(96, 162);
    ctx.lineTo(160, 112);
    ctx.moveTo(160, 162);
    ctx.lineTo(96, 112);
    ctx.stroke();
    this.poly(ctx, [[82, 76], [128, 48], [174, 76], [158, 112], [98, 112]], "#8a5b32");
    this.poly(ctx, [[78, 72], [128, 34], [178, 72], [128, 100]], "#345f8f");
  },

  drawBarrels(ctx, w, h) {
    this.shadow(ctx, 128, 170, 48, 12);
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 34;
      ctx.fillStyle = "#8b552e";
      ctx.fillRect(x, 112, 28, 56);
      ctx.fillStyle = "#b8783f";
      ctx.beginPath();
      ctx.ellipse(x + 14, 112, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#4a2b1b";
      ctx.strokeRect(x, 128, 28, 8);
    }
  },

  drawCrates(ctx, w, h) {
    this.shadow(ctx, 128, 176, 50, 12);
    [[82, 120], [126, 120], [104, 78]].forEach(p => {
      ctx.fillStyle = "#b8793d";
      ctx.fillRect(p[0], p[1], 48, 48);
      ctx.strokeStyle = "#6f3f20";
      ctx.lineWidth = 5;
      ctx.strokeRect(p[0], p[1], 48, 48);
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(p[0] + 48, p[1] + 48);
      ctx.moveTo(p[0] + 48, p[1]);
      ctx.lineTo(p[0], p[1] + 48);
      ctx.stroke();
    });
  },

  drawChest(ctx, w, h) {
    this.shadow(ctx, 128, 166, 45, 10);
    ctx.fillStyle = "#7c4625";
    ctx.fillRect(78, 116, 100, 52);
    ctx.fillStyle = "#a8642f";
    ctx.beginPath();
    ctx.ellipse(128, 116, 50, 28, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = "#ffd76a";
    ctx.lineWidth = 6;
    ctx.strokeRect(78, 116, 100, 52);
    ctx.fillStyle = "#ffe66d";
    ctx.fillRect(119, 133, 18, 18);
  },

  drawPalm(ctx, w, h) {
    this.shadow(ctx, 128, 214, 26, 8);
    ctx.strokeStyle = "#8a5b32";
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(128, 216);
    ctx.quadraticCurveTo(144, 144, 126, 82);
    ctx.stroke();
    ctx.fillStyle = "#2f9b50";
    [[126, 78, -70], [126, 78, -35], [126, 78, 0], [126, 78, 35], [126, 78, 70]].forEach(v => {
      ctx.save();
      ctx.translate(v[0], v[1]);
      ctx.rotate(v[2] * Math.PI / 180);
      ctx.beginPath();
      ctx.ellipse(0, -28, 18, 62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  },

  drawLeafyTree(ctx, w, h, color) {
    this.shadow(ctx, 128, 210, 34, 9);
    ctx.fillStyle = "#80502d";
    ctx.fillRect(116, 130, 24, 82);
    ctx.fillStyle = color;
    [[107, 112, 42], [145, 108, 45], [128, 72, 52], [96, 82, 36], [160, 82, 36]].forEach(p => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(112, 72, 23, 0, Math.PI * 2);
    ctx.fill();
  },

  drawPine(ctx, w, h) {
    this.shadow(ctx, 128, 216, 30, 8);
    ctx.fillStyle = "#704424";
    ctx.fillRect(118, 150, 20, 66);
    ["#1f7d44", "#259253", "#32a962"].forEach((color, i) => {
      this.poly(ctx, [[128, 38 + i * 38], [68 + i * 14, 150 + i * 16], [188 - i * 14, 150 + i * 16]], color);
    });
  },

  drawBush(ctx, w, h, color, flowers) {
    this.shadow(ctx, 128, 166, 45, 9);
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(82 + i * 24, 138 - Math.sin(i) * 14, 28, 0, Math.PI * 2);
      ctx.fill();
    }
    if (flowers) {
      ctx.fillStyle = "#ffda6b";
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(78 + i * 17, 126 + (i % 2) * 18, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  drawFlowers(ctx, w, h) {
    this.shadow(ctx, 128, 160, 48, 8);
    for (let i = 0; i < 18; i++) {
      const x = 72 + Math.random() * 112;
      const y = 116 + Math.random() * 56;
      ctx.fillStyle = i % 3 === 0 ? "#ff6b9a" : i % 3 === 1 ? "#ffe66d" : "#7be0ff";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawTallGrass(ctx, w, h) {
    this.shadow(ctx, 128, 168, 48, 8);
    ctx.strokeStyle = "#399a42";
    ctx.lineWidth = 5;
    for (let i = 0; i < 20; i++) {
      const x = 68 + Math.random() * 120;
      const y = 170;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.random() * 18 - 9, 128 + Math.random() * 28, x + Math.random() * 20 - 10, 102 + Math.random() * 45);
      ctx.stroke();
    }
  },

  removeChromaKey(img, key) {
    const canvas = this.createCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const dr = Math.abs(data[i] - key.r);
      const dg = Math.abs(data[i + 1] - key.g);
      const db = Math.abs(data[i + 2] - key.b);
      const greenDominance = data[i + 1] - Math.max(data[i], data[i + 2]);
      if (dr < 90 && dg < 90 && db < 90 || greenDominance > 70 && data[i + 1] > 130) {
        const strength = Math.max(0, Math.min(1, (greenDominance - 35) / 95));
        data[i + 3] = Math.round(data[i + 3] * (1 - strength));
        data[i] = Math.max(data[i] - Math.round(18 * strength), 0);
        data[i + 1] = Math.max(data[i + 1] - Math.round(110 * strength), 0);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  },

  propCell(name) {
    const cells = {
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
    };

    return cells[name];
  },

  drawProp(ctx, name, x, y, w, h) {
    const aiCell = this.aiHouseCell(name);
    if (aiCell && this.aiHouseAtlas) {
      this.drawAtlasCell(ctx, this.aiHouseAtlas, aiCell, 4, 3, x, y, w, h);
      return true;
    }

    const cell = this.propCell(name);
    if (!cell || !this.propsAtlas) return false;
    this.drawAtlasCell(ctx, this.propsAtlas, cell, 4, 3, x, y, w, h);
    return true;
  },

  aiHouseCell(name) {
    const cells = {
      blueHouse: [0, 0],
      redHouse: [1, 0],
      inn: [2, 0]
    };

    return cells[name];
  },

  drawAtlasCell(ctx, atlas, cell, cols, rows, x, y, w, h) {
    const cellW = Math.floor(atlas.width / cols);
    const cellH = Math.floor(atlas.height / rows);
    ctx.drawImage(atlas, cell[0] * cellW, cell[1] * cellH, cellW, cellH, x - w / 2, y - h / 2, w, h);
  },

  natureCell(name) {
    const cells = {
      palm: [0, 0],
      leafyTree: [1, 0],
      roundTree: [2, 0],
      pineTree: [3, 0],
      bush: [0, 1],
      flowerBush: [1, 1],
      flowerPatch: [2, 1],
      tallGrass: [3, 1]
    };

    return cells[name];
  },

  drawNature(ctx, name, x, y, w, h) {
    const cell = this.natureCell(name);
    if (!cell || !this.natureAtlas) return false;
    const cols = 4;
    const rows = 2;
    const cellW = Math.floor(this.natureAtlas.width / cols);
    const cellH = Math.floor(this.natureAtlas.height / rows);
    ctx.drawImage(this.natureAtlas, cell[0] * cellW, cell[1] * cellH, cellW, cellH, x - w / 2, y - h / 2, w, h);
    return true;
  },

  removeFakeBackground(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx.drawImage(img, 0, 0);

    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      return img;
    }

    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const visited = new Uint8Array(width * height);
    const stack = [];

    function isBackground(r, g, b, a) {
      if (a < 20) return true;
      const veryLight = r >= 218 && g >= 218 && b >= 218;
      const grayish = Math.abs(r - g) <= 24 && Math.abs(g - b) <= 24 && Math.abs(r - b) <= 24;
      return veryLight && grayish;
    }

    function tryPixel(x, y) {
      if (x < 0 || y < 0 || x >= width || y >= height) return;

      const pos = y * width + x;
      if (visited[pos]) return;

      const i = pos * 4;
      if (isBackground(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        visited[pos] = 1;
        data[i + 3] = 0;
        stack.push(pos);
      }
    }

    for (let x = 0; x < width; x++) {
      tryPixel(x, 0);
      tryPixel(x, height - 1);
    }

    for (let y = 0; y < height; y++) {
      tryPixel(0, y);
      tryPixel(width - 1, y);
    }

    while (stack.length) {
      const pos = stack.pop();
      const x = pos % width;
      const y = Math.floor(pos / width);
      tryPixel(x + 1, y);
      tryPixel(x - 1, y);
      tryPixel(x, y + 1);
      tryPixel(x, y - 1);
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
};
