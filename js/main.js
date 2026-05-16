window.addEventListener("DOMContentLoaded", () => {
  GP.UI.init();
  const game = new GP.Game(document.getElementById("game"));
  window.GabrielPiece = game;
  let assetsReady = false;
  const worldMetaKey = "gabrielPieceWorldMeta";

  GP.Assets.load(
    () => {
      GP.GameMap.invalidateCache();
      assetsReady = true;
      const visualReport = GP.Assets.getVisualReport();
      window.visualReport = visualReport;
      if (!visualReport.ok) {
        GP.UI.showToast("Sistema visual encontrou " + visualReport.errors.length + " erro(s). Veja window.visualReport.");
      } else if (visualReport.warnings.length) {
        console.warn("Sistema visual carregado com avisos:", visualReport.warnings);
      }
      const startButton = document.getElementById("startButton");
      if (startButton) {
        startButton.disabled = false;
        startButton.textContent = "Jogar";
      }
      updateWorldMenuState();
    },
    message => GP.UI.showToast(message)
  );

  const hasWorld = () => {
    try {
      return !!localStorage.getItem(worldMetaKey);
    } catch (error) {
      return false;
    }
  };

  const updateWorldMenuState = () => {
    const openWorldButton = document.getElementById("openWorldButton");
    if (openWorldButton) {
      openWorldButton.disabled = !hasWorld();
      openWorldButton.textContent = hasWorld() ? "Abrir mundo" : "Nenhum mundo criado";
    }
  };

  const markWorldCreated = () => {
    try {
      localStorage.setItem(worldMetaKey, JSON.stringify({ createdAt: Date.now(), name: "Ilha Inicial" }));
    } catch (error) {}
  };

  window.mostrarMenuMundos = () => {
    const worldMenu = document.getElementById("worldMenu");
    if (worldMenu) worldMenu.classList.toggle("hidden");
    updateWorldMenuState();
  };

  window.iniciarJogo = () => {
    if (!assetsReady) {
      GP.UI.showToast("Carregando a ilha...");
      return;
    }
    game.start();
  };

  window.criarNovoMundo = () => {
    if (!assetsReady) {
      GP.UI.showToast("Carregando a ilha...");
      return;
    }
    try {
      localStorage.removeItem(game.storageKey);
    } catch (error) {}
    game.savedProgress = null;
    markWorldCreated();
    window.iniciarJogo();
  };

  window.abrirMundo = () => {
    if (!hasWorld()) {
      GP.UI.showToast("Voce ainda precisa criar um mundo.");
      updateWorldMenuState();
      return;
    }
    window.iniciarJogo();
  };

  window.verificarVisual = () => {
    const report = GP.Assets.getVisualReport();
    window.visualReport = report;
    const summary = report.ok ? "Visual OK" : "Visual com " + report.errors.length + " erro(s)";
    GP.UI.showToast(summary + " | " + report.warnings.length + " aviso(s). Detalhes em window.visualReport.");
    console.table([{
      ok: report.ok,
      imagens: report.loadedImages,
      spritesCache: report.cachedSprites,
      efeitosCache: report.cachedEffects,
      erros: report.errors.length,
      avisos: report.warnings.length
    }]);
    return report;
  };

  window.reiniciar = () => game.start();
  window.aceitarMissao = () => game.acceptQuest();
  window.uparStat = stat => game.upgradeStat(stat);
  window.resetarProgresso = () => {
    const button = document.getElementById("resetProgressButton");
    if (!button.classList.contains("confirm")) {
      button.classList.add("confirm");
      button.textContent = "Confirmar reset";
      clearTimeout(window.resetProgressTimer);
      window.resetProgressTimer = setTimeout(() => {
        button.classList.remove("confirm");
        button.textContent = "Resetar progresso";
      }, 3000);
      return;
    }

    localStorage.removeItem(game.storageKey);
    localStorage.removeItem(worldMetaKey);
    game.savedProgress = null;
    window.location.reload();
  };
  window.fecharDialogo = () => GP.UI.closeDialog();
  window.fecharSpin = () => GP.UI.closeSpin();
  window.fecharInventario = () => GP.UI.closeInventory();
  window.alternarInventario = () => {
    if (!game.player) return;
    GP.UI.toggleInventory(game.player, game);
  };
  window.alternarMissao = () => GP.UI.toggleQuestMinimized();
  window.mostrarControles = () => {
    const info = document.getElementById("menuInfo");
    if (info) info.classList.toggle("visible");
  };

  const adminPanel = document.getElementById("adminPanel");
  const adminLogin = document.getElementById("adminLogin");
  const adminControls = document.getElementById("adminControls");
  const adminPassword = document.getElementById("adminPassword");
  const adminItemSelect = document.getElementById("adminItemSelect");
  const adminMapBlockSelect = document.getElementById("adminMapBlockSelect");
  const adminMapLayerSelect = document.getElementById("adminMapLayerSelect");
  const adminMapToolSelect = document.getElementById("adminMapToolSelect");
  const adminMapToggleButton = document.getElementById("adminMapToggleButton");
  const adminMapExport = document.getElementById("adminMapExport");
  let adminUnlocked = false;

  const requireAdminPlayer = () => {
    if (!game.player) {
      GP.UI.showToast("Comece a jornada antes de usar o admin.");
      return false;
    }
    return true;
  };

  const setAdminValues = () => {
    if (!game.player) return;
    const p = game.player;
    const stats = p.stats || {};
    document.getElementById("adminLevelInput").value = p.nivel || 1;
    document.getElementById("adminFistMasteryInput").value = p.socoMaestria || 0;
    document.getElementById("adminSwordMasteryInput").value = p.espadaMaestria || 0;
    document.getElementById("adminStatSaudeInput").value = stats.saude || 0;
    document.getElementById("adminStatCorpoInput").value = stats.corpo || 0;
    document.getElementById("adminStatEspadaInput").value = stats.espada || 0;
    document.getElementById("adminStatFrutaInput").value = stats.fruta || 0;
  };

  const populateAdminItems = () => {
    if (!adminItemSelect || adminItemSelect.children.length) return;
    Object.keys(game.itemCatalog).forEach(id => {
      const option = document.createElement("option");
      option.value = "item:" + id;
      option.textContent = game.itemCatalog[id].nome;
      adminItemSelect.appendChild(option);
    });
    GP.CONFIG.fruits.forEach(fruit => {
      if (fruit.nome === "Nenhuma") return;
      const option = document.createElement("option");
      option.value = "fruit:" + fruit.nome;
      option.textContent = "Fruta - " + fruit.nome;
      adminItemSelect.appendChild(option);
    });
  };

  const populateAdminMapBlocks = () => {
    if (!adminMapBlockSelect || adminMapBlockSelect.children.length) return;
    const doorOption = document.createElement("option");
    doorOption.value = "door";
    doorOption.textContent = "door 1x2";
    adminMapBlockSelect.appendChild(doorOption);
    Object.keys(GP.GameMap.blockCells).forEach(id => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = id;
      adminMapBlockSelect.appendChild(option);
    });
  };

  const syncAdminMapOptions = () => {
    if (!game.mapEditor) return;
    game.setMapEditorOptions({
      block: adminMapBlockSelect ? adminMapBlockSelect.value : "grass",
      layer: adminMapLayerSelect ? adminMapLayerSelect.value : "solid",
      tool: adminMapToolSelect ? adminMapToolSelect.value : "paint"
    });
    if (adminMapToggleButton) {
      adminMapToggleButton.textContent = game.mapEditor.active ? "Desativar editor" : "Ativar editor";
    }
  };

  window.abrirAdmin = () => {
    populateAdminItems();
    populateAdminMapBlocks();
    syncAdminMapOptions();
    setAdminValues();
    adminPanel.classList.remove("hidden");
    if (!adminUnlocked) {
      adminLogin.classList.remove("hidden");
      adminControls.classList.add("hidden");
      setTimeout(() => adminPassword.focus(), 0);
    }
  };

  window.fecharAdmin = () => {
    adminPanel.classList.add("hidden");
  };

  window.entrarAdmin = () => {
    if (adminPassword.value !== "04041111") {
      GP.UI.showToast("Senha admin incorreta.");
      adminPassword.select();
      return;
    }
    adminUnlocked = true;
    adminLogin.classList.add("hidden");
    adminControls.classList.remove("hidden");
    populateAdminMapBlocks();
    syncAdminMapOptions();
    setAdminValues();
    GP.UI.showToast("Admin liberado.");
  };

  window.adminPegarItem = () => {
    if (!requireAdminPlayer()) return;
    const value = adminItemSelect.value;
    if (value.startsWith("item:")) game.giveItem(value.replace("item:", ""), value.includes("baseFighting") ? 0 : 1);
    if (value.startsWith("fruit:")) game.setAdminFruit(value.replace("fruit:", ""));
    setAdminValues();
  };

  window.adminAplicarBuild = () => {
    if (!requireAdminPlayer()) return;
    game.applyAdminStats({
      level: document.getElementById("adminLevelInput").value,
      fistMastery: document.getElementById("adminFistMasteryInput").value,
      swordMastery: document.getElementById("adminSwordMasteryInput").value,
      saude: document.getElementById("adminStatSaudeInput").value,
      corpo: document.getElementById("adminStatCorpoInput").value,
      espada: document.getElementById("adminStatEspadaInput").value,
      fruta: document.getElementById("adminStatFrutaInput").value,
      statPoints: game.player.statPoints || 0
    });
    setAdminValues();
  };

  window.adminCurar = () => {
    if (!requireAdminPlayer()) return;
    game.player.vida = game.player.vidaMax;
    game.saveProgress();
    GP.UI.showToast("Vida restaurada.");
  };

  window.adminToggleMapEditor = () => {
    syncAdminMapOptions();
    const active = game.toggleMapEditor();
    if (active) adminPanel.classList.add("hidden");
    syncAdminMapOptions();
  };

  window.adminSalvarMapa = async () => {
    const ok = GP.GameMap.saveCustomMap();
    const code = GP.GameMap.exportCustomMapCode();
    if (adminMapExport) adminMapExport.value = code;

    let codeSaved = false;
    try {
      const response = await fetch("/__save-map", {
        method: "POST",
        headers: { "Content-Type": "text/javascript; charset=utf-8" },
        body: code
      });
      codeSaved = response.ok;
    } catch (error) {}

    if (codeSaved) {
      GP.UI.showToast("Mapa salvo em js/customMapData.js e no navegador.");
    } else {
      GP.UI.showToast(ok ? "Mapa salvo no navegador. Rode pelo dev-server para gravar no codigo." : "Nao consegui salvar o mapa.");
    }
  };

  window.adminExportarMapa = () => {
    const code = GP.GameMap.exportCustomMapCode();
    if (adminMapExport) {
      adminMapExport.value = code;
      adminMapExport.focus();
      adminMapExport.select();
    }
    GP.UI.showToast("Codigo do mapa exportado no campo do Admin.");
    return code;
  };

  window.adminLimparMapa = () => {
    GP.GameMap.clearCustomMap();
    if (adminMapExport) adminMapExport.value = "";
    GP.UI.showToast("Edits do mapa removidos. O mapa base voltou.");
  };

  [adminMapBlockSelect, adminMapLayerSelect, adminMapToolSelect].forEach(input => {
    if (input) input.addEventListener("change", syncAdminMapOptions);
  });

  if (adminPassword) {
    adminPassword.addEventListener("keydown", event => {
      if (event.key === "Enter") window.entrarAdmin();
    });
  }
});
