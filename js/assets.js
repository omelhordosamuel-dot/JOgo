window.GP = window.GP || {};

GP.Assets = {
  manifest: GP.AssetManifest,
  images: {},
  terrain: {},
  spriteCache: {},
  effectCache: {},
  loaded: false,
  warnings: [],
  errors: [],
  visualReport: null,

  async load(onReady, onError) {
    this.loaded = false;
    this.warnings = [];
    this.errors = [];
    this.spriteCache = {};
    this.effectCache = {};

    try {
      const entries = Object.entries(this.manifest.images).filter(([, spec]) => spec.preload !== false);
      await Promise.all(entries.map(([id, spec]) => this.loadManifestImage(id, spec)));
      this.createTerrainPatterns();
      this.assignLegacyAliases();
      this.buildRenderCache();
      this.validateManifest();
      this.loaded = true;
      if (onReady) onReady();
    } catch (error) {
      if (onError) onError(error && error.message ? error.message : error);
    }
  },

  loadManifestImage(id, spec) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let finalImage = img;
        if (spec.transparent === "chroma-green") {
          finalImage = this.removeChromaKey(img, { r: 0, g: 255, b: 0 });
        } else if (spec.transparent === "edge-white") {
          finalImage = this.removeFakeBackground(img);
        }
        finalImage.assetId = id;
        this.images[id] = finalImage;
        resolve(finalImage);
      };
      img.onerror = () => reject(new Error("Erro ao carregar asset visual: " + spec.src));
      img.src = spec.src;
    });
  },

  assignLegacyAliases() {
    this.mapBase = this.get("mapIslandGround");
    this.propsAtlas = this.get("propsAtlas");
    this.natureAtlas = this.get("natureAtlas");
    this.cleanPlayerSheet = this.get("playerSheet");
    this.cleanPunchImpactSheet = this.get("punchImpact");
    this.cleanGroundCrackSheet = this.get("groundCrack");
    this.cleanGroundPunchSheet = null;
    this.cleanPunchSheet = null;
    this.cleanPunchFrontSheet = null;
    this.cleanPunchBackSheet = null;
    this.cleanKogatanaWeapon = this.get("kogatanaWeapon");
    this.cleanKogatanaHoldSheet = null;
  },

  validateManifest() {
    const errors = [];
    const warnings = [];
    const maxStretch = this.manifest.policy.maxDrawStretchRatio || 0.18;

    Object.entries(this.manifest.images).forEach(([id, spec]) => {
      if (spec.preload === false) {
        warnings.push(id + " esta marcado como legado e nao sera carregado em runtime.");
        return;
      }
      const img = this.get(id);
      if (!img) {
        errors.push("Asset ausente no manifesto: " + id);
        return;
      }
      if (spec.width && img.width !== spec.width) warnings.push(id + " largura esperada " + spec.width + ", atual " + img.width);
      if (spec.height && img.height !== spec.height) warnings.push(id + " altura esperada " + spec.height + ", atual " + img.height);
      if (spec.frames && img.width % spec.frames !== 0) {
        warnings.push(id + " nao divide perfeitamente em " + spec.frames + " frames; usando corte inteiro.");
      }
      if (spec.expectedBodyHeight && spec.bodyBox) {
        const drift = Math.abs(spec.bodyBox.h - spec.expectedBodyHeight);
        if (drift > (spec.bodyHeightTolerance || 0)) {
          errors.push(id + " tem corpo com altura " + spec.bodyBox.h + ", esperado " + spec.expectedBodyHeight + ".");
        }
      }
    });

    Object.entries(this.manifest.sprites).forEach(([id, spec]) => {
      this.validateDrawableSpec("sprite", id, spec, maxStretch, errors, warnings);
      this.validateCharacterIdentity(id, spec, errors, warnings);
    });

    Object.entries(this.manifest.effects).forEach(([id, spec]) => {
      this.validateDrawableSpec("effect", id, spec, maxStretch, errors, warnings);
      const image = this.get(spec.image);
      if (image && spec.frames && image.width % spec.frames !== 0) {
        warnings.push("effect " + id + " tem frames que nao dividem igualmente a largura da imagem.");
      }
    });

    this.errors = errors;
    this.warnings = warnings;
    this.visualReport = {
      ok: errors.length === 0,
      errors,
      warnings,
      loadedImages: Object.keys(this.images).length,
      cachedSprites: Object.keys(this.spriteCache).length,
      cachedEffects: Object.keys(this.effectCache).length
    };

    if (errors.length) console.error("Erros do sistema visual:", errors);
    if (warnings.length) console.warn("Avisos do sistema visual:", warnings);
    return this.visualReport;
  },

  validateCharacterIdentity(id, spec, errors, warnings) {
    const policy = this.manifest.policy || {};
    const imageSpec = this.manifest.images[spec.image] || {};
    const canonicalImage = policy.canonicalCharacterImage || "playerSheet";
    const canonicalGroup = "gabriel-canonical";
    const isGabrielSprite = id.indexOf("player") === 0 || spec.characterId === policy.canonicalCharacterId || spec.animationRole === "canonical-player";

    if (!isGabrielSprite) return;

    if (spec.characterId !== policy.canonicalCharacterId) {
      errors.push("sprite " + id + " parece ser animacao do Gabriel, mas nao declara characterId='" + policy.canonicalCharacterId + "'.");
    }

    if (spec.image !== canonicalImage && spec.identityGroup !== canonicalGroup) {
      errors.push("sprite " + id + " tenta animar Gabriel usando imagem separada (" + spec.image + "). Use a sheet canonica ou declare/valide identityGroup gabriel-canonical.");
    }

    if (imageSpec.characterId && imageSpec.characterId !== policy.canonicalCharacterId) {
      errors.push("sprite " + id + " aponta para imagem de outro personagem: " + imageSpec.characterId + ".");
    }

    if (spec.image !== canonicalImage && !imageSpec.identityLocked) {
      warnings.push("sprite " + id + " usa asset nao canonico para Gabriel; revisar identidade visual antes de aceitar.");
    }
  },

  validateDrawableSpec(kind, id, spec, maxStretch, errors, warnings) {
    const imageSpec = this.manifest.images[spec.image];
    const image = this.get(spec.image);
    if (!imageSpec) {
      errors.push(kind + " " + id + " referencia imagem inexistente: " + spec.image);
      return;
    }
    if (imageSpec.preload === false) {
      errors.push(kind + " " + id + " referencia imagem marcada como legado/desativada: " + spec.image);
      return;
    }
    if (!image) {
      errors.push(kind + " " + id + " nao tem imagem carregada: " + spec.image);
      return;
    }

    const sx = spec.sx || 0;
    const sy = spec.sy || 0;
    const sw = spec.sw || Math.floor(image.width / (spec.frames || 1));
    const sh = spec.sh || image.height;
    if (sx < 0 || sy < 0 || sx + sw > image.width || sy + sh > image.height) {
      errors.push(kind + " " + id + " tem recorte fora da imagem.");
    }
    if (spec.frames && sx + sw * spec.frames > image.width) {
      errors.push(kind + " " + id + " tem frames que ultrapassam a largura da imagem.");
    }
    if ((spec.expectedBodyHeight || spec.expectedRenderedBodyHeight) && spec.bodyBox) {
      const body = spec.bodyBox;
      if (body.x < 0 || body.y < 0 || body.x + body.w > sw || body.y + body.h > sh) {
        errors.push(kind + " " + id + " tem bodyBox fora do frame.");
      }
      if (spec.expectedBodyHeight) {
        const drift = Math.abs(body.h - spec.expectedBodyHeight);
        if (drift > (spec.bodyHeightTolerance || 0)) {
          errors.push(kind + " " + id + " encolhe/aumenta Gabriel: corpo " + body.h + "px, esperado " + spec.expectedBodyHeight + "px.");
        }
      }
      if (spec.expectedRenderedBodyHeight) {
        const renderedBodyHeight = body.h * (spec.drawHeight / sh);
        const drift = Math.abs(renderedBodyHeight - spec.expectedRenderedBodyHeight);
        if (drift > (spec.bodyHeightTolerance || 0)) {
          errors.push(kind + " " + id + " renderiza Gabriel com " + Math.round(renderedBodyHeight) + "px, esperado " + spec.expectedRenderedBodyHeight + "px.");
        }
      }
    }
    if (!spec.drawWidth || !spec.drawHeight) errors.push(kind + " " + id + " precisa de drawWidth e drawHeight.");
    if (spec.anchorX < 0 || spec.anchorX > 1 || spec.anchorY < 0 || spec.anchorY > 1) {
      warnings.push(kind + " " + id + " tem ancora fora do intervalo recomendado 0..1.");
    }

    if (!spec.allowAspectDrift && spec.drawWidth && spec.drawHeight && sw && sh) {
      const sourceRatio = sw / sh;
      const drawRatio = spec.drawWidth / spec.drawHeight;
      const drift = Math.abs(drawRatio - sourceRatio) / sourceRatio;
      if (drift > maxStretch) {
        warnings.push(kind + " " + id + " muda proporcao em " + Math.round(drift * 100) + "%; revisar drawWidth/drawHeight.");
      }
    }
  },

  getVisualReport() {
    return this.visualReport || this.validateManifest();
  },

  get(id) {
    return this.images[id] || null;
  },

  getImageSpec(id) {
    return this.manifest.images[id] || null;
  },

  getSpriteSpec(id) {
    return this.manifest.sprites[id] || null;
  },

  createCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  },

  createTerrainPatterns() {
    this.terrain = {
      water: this.createTerrainTile(this.get("terrainWater"), 512),
      sand: this.createTerrainTile(this.get("terrainSand"), 512),
      grass: this.createTerrainTile(this.get("terrainGrass"), 512),
      dirt: this.createTerrainTile(this.get("terrainDirt"), 512)
    };
  },

  createTerrainTile(img, size) {
    if (!img) return null;
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, size, size);
    return canvas;
  },

  fitSize(spec, options) {
    const width = options && options.width;
    const height = options && options.height;
    if (width && height && options.allowStretch) return { width, height };
    if (width && height) {
      const scale = Math.min(width / spec.drawWidth, height / spec.drawHeight);
      return { width: spec.drawWidth * scale, height: spec.drawHeight * scale };
    }
    if (width) return { width, height: width * spec.drawHeight / spec.drawWidth };
    if (height) return { width: height * spec.drawWidth / spec.drawHeight, height };
    return { width: spec.drawWidth, height: spec.drawHeight };
  },

  drawSprite(ctx, id, frame, x, y, options) {
    const spec = this.getSpriteSpec(id);
    if (!spec) return false;
    const cachedFrames = Array.isArray(this.spriteCache[id]) ? this.spriteCache[id] : null;
    const frameCount = spec.frames || 1;
    const frameIndex = Math.max(0, Math.min(frameCount - 1, Math.floor(frame || 0)));
    const image = cachedFrames ? cachedFrames[frameIndex] : this.spriteCache[id] || this.get(spec.image);
    if (!image) return false;
    const opts = options || {};
    const size = this.fitSize(spec, opts);
    const cached = !!this.spriteCache[id] && !opts.filter;
    const sourceFrameW = spec.sw || Math.floor(image.width / frameCount);
    const sx = cached ? 0 : (spec.sx || 0) + frameIndex * sourceFrameW;
    const sy = cached ? 0 : spec.sy || 0;
    const sw = cached ? image.width : sourceFrameW;
    const sh = cached ? image.height : spec.sh || image.height;
    const dx = -size.width * (spec.anchorX === undefined ? 0.5 : spec.anchorX);
    const dy = -size.height * (spec.anchorY === undefined ? 0.5 : spec.anchorY);

    ctx.save();
    ctx.translate(x, y);
    if (opts.rotation) ctx.rotate(opts.rotation);
    if (opts.flipX) ctx.scale(-1, 1);
    if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
    ctx.filter = opts.filter || (cached ? "none" : spec.filter) || "none";
    ctx.imageSmoothingEnabled = opts.smoothing === undefined ? true : !!opts.smoothing;
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, size.width, size.height);
    ctx.restore();
    return true;
  },

  drawEffect(ctx, id, progress, x, y, options) {
    const spec = this.manifest.effects[id];
    if (!spec) return false;
    const opts = options || {};
    const frames = opts.frames || spec.frames || 1;
    const frame = Math.max(0, Math.min(frames - 1, Math.floor(Math.max(0, Math.min(0.999, progress || 0)) * frames)));
    const cacheFrames = this.effectCache[id];
    const image = cacheFrames ? cacheFrames[frame] : this.get(spec.image);
    if (!image) return false;
    const frameW = cacheFrames ? image.width : Math.floor(image.width / frames);
    const frameH = cacheFrames ? image.height : image.height;
    const size = this.fitSize(spec, opts);
    const dx = -size.width * (spec.anchorX === undefined ? 0.5 : spec.anchorX);
    const dy = -size.height * (spec.anchorY === undefined ? 0.5 : spec.anchorY);

    ctx.save();
    ctx.translate(x, y);
    if (opts.rotation) ctx.rotate(opts.rotation);
    if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
    ctx.filter = opts.filter || (cacheFrames ? "none" : spec.filter) || "none";
    ctx.imageSmoothingEnabled = opts.smoothing === undefined ? true : !!opts.smoothing;
    ctx.drawImage(image, cacheFrames ? 0 : frame * frameW, 0, frameW, frameH, dx, dy, size.width, size.height);
    ctx.restore();
    return true;
  },

  buildRenderCache() {
    this.buildSpriteCache();
    this.buildEffectCache();
  },

  buildSpriteCache() {
    const cacheScale = Math.max(1, Math.ceil((this.manifest.policy && this.manifest.policy.spriteCacheScale) || 1));
    Object.entries(this.manifest.sprites).forEach(([id, spec]) => {
      const image = this.get(spec.image);
      if (!image) return;
      const frames = spec.frames || 1;
      const frameW = spec.sw || Math.floor(image.width / frames);
      const frameH = spec.sh || image.height;
      const makeFrame = frame => {
        const canvas = this.createCanvas(Math.ceil(spec.drawWidth * cacheScale), Math.ceil(spec.drawHeight * cacheScale));
        canvas.renderScale = cacheScale;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.filter = spec.filter || "none";
        const srcX = (spec.sx || 0) + frame * frameW;
        const srcY = spec.sy || 0;
        const srcW = frameW;
        const srcH = frameH;
        let destW = canvas.width;
        let destH = canvas.height;
        let destX = 0;
        let destY = 0;
        const sourceRatio = srcW / srcH;
        const destRatio = canvas.width / canvas.height;
        if (Math.abs(sourceRatio - destRatio) > 1e-6) {
          const scale = Math.min(canvas.width / srcW, canvas.height / srcH);
          destW = Math.max(1, Math.round(srcW * scale));
          destH = Math.max(1, Math.round(srcH * scale));
          destX = Math.round((canvas.width - destW) / 2);
          destY = Math.round((canvas.height - destH) / 2);
        }
        ctx.drawImage(image, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
        return canvas;
      };
      this.spriteCache[id] = frames > 1 ? Array.from({ length: frames }, (_, frame) => makeFrame(frame)) : makeFrame(0);
    });
  },

  buildEffectCache() {
    const cacheScale = Math.max(1, Math.ceil((this.manifest.policy && this.manifest.policy.effectCacheScale) || 1));
    Object.entries(this.manifest.effects).forEach(([id, spec]) => {
      const image = this.get(spec.image);
      if (!image) return;
      const frames = spec.frames || 1;
      const frameW = Math.floor(image.width / frames);
      const frameH = image.height;
      this.effectCache[id] = [];
      for (let frame = 0; frame < frames; frame++) {
        const canvas = this.createCanvas(Math.ceil(spec.drawWidth * cacheScale), Math.ceil(spec.drawHeight * cacheScale));
        canvas.renderScale = cacheScale;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.filter = spec.filter || "none";
        const srcX = frame * frameW;
        const srcY = 0;
        const srcW = frameW;
        const srcH = frameH;
        let destW = canvas.width;
        let destH = canvas.height;
        let destX = 0;
        let destY = 0;
        const sourceRatio = srcW / srcH;
        const destRatio = canvas.width / canvas.height;
        if (Math.abs(sourceRatio - destRatio) > 1e-6) {
          const scale = Math.min(canvas.width / srcW, canvas.height / srcH);
          destW = Math.max(1, Math.round(srcW * scale));
          destH = Math.max(1, Math.round(srcH * scale));
          destX = Math.round((canvas.width - destW) / 2);
          destY = Math.round((canvas.height - destH) / 2);
        }
        ctx.drawImage(image, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
        this.effectCache[id].push(canvas);
      }
    });
  },

  drawAtlasCell(ctx, atlasId, cell, cols, rows, x, y, w, h, options) {
    const atlas = this.get(atlasId);
    if (!atlas || !cell) return false;
    const opts = options || {};
    const cellW = Math.floor(atlas.width / cols);
    const cellH = Math.floor(atlas.height / rows);
    let drawW = w;
    let drawH = h;
    if (!opts.allowStretch) {
      const scale = Math.min(w / cellW, h / cellH);
      drawW = cellW * scale;
      drawH = cellH * scale;
    }
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(atlas, cell[0] * cellW, cell[1] * cellH, cellW, cellH, x - drawW / 2, y - drawH / 2, drawW, drawH);
    ctx.restore();
    return true;
  },

  drawProp(ctx, name, x, y, w, h) {
    const cell = this.manifest.propCells[name];
    return this.drawAtlasCell(ctx, "propsAtlas", cell, 4, 3, x, y, w, h);
  },

  drawNature(ctx, name, x, y, w, h) {
    const cell = this.manifest.natureCells[name];
    return this.drawAtlasCell(ctx, "natureAtlas", cell, 4, 2, x, y, w, h);
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
      if ((dr < 90 && dg < 90 && db < 90) || (greenDominance > 70 && data[i + 1] > 130)) {
        const strength = Math.max(0, Math.min(1, (greenDominance - 35) / 95));
        data[i + 3] = Math.round(data[i + 3] * (1 - strength));
        data[i] = Math.max(data[i] - Math.round(18 * strength), 0);
        data[i + 1] = Math.max(data[i + 1] - Math.round(110 * strength), 0);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  },

  removeFakeBackground(img) {
    const canvas = this.createCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
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

    const isBackground = (r, g, b, a) => {
      if (a < 20) return true;
      const veryLight = r >= 218 && g >= 218 && b >= 218;
      const grayish = Math.abs(r - g) <= 24 && Math.abs(g - b) <= 24 && Math.abs(r - b) <= 24;
      return veryLight && grayish;
    };

    const tryPixel = (x, y) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const pos = y * width + x;
      if (visited[pos]) return;
      const i = pos * 4;
      if (isBackground(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        visited[pos] = 1;
        data[i + 3] = 0;
        stack.push(pos);
      }
    };

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
