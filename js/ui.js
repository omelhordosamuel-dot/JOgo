window.GP = window.GP || {};

GP.UI = {
  init() {
    this.menu = document.getElementById("menu");
    this.spinBox = document.getElementById("spinBox");
    this.spinCost = document.getElementById("spinCost");
    this.spinResultado = document.getElementById("spinResultado");
    this.gameOver = document.getElementById("gameOver");
    this.textoGameOver = document.getElementById("textoGameOver");
    this.dialogo = document.getElementById("dialogo");
    this.dialogoTexto = document.getElementById("dialogoTexto");
    this.toast = document.getElementById("toast");
    this.questPanel = document.getElementById("questPanel");
    this.questToggle = document.getElementById("questToggle");
    this.questCompleteNotice = document.getElementById("questCompleteNotice");
    this.questCompleteText = document.getElementById("questCompleteText");
    this.masteryPanel = document.getElementById("masteryPanel");
    this.statsPanel = document.getElementById("statsPanel");
    this.inventoryPanel = document.getElementById("inventoryPanel");
    this.inventoryGrid = document.getElementById("inventoryGrid");
    this.inventoryStats = document.getElementById("inventoryStats");
    this.statsHud = {
      points: document.getElementById("statPointsHud"),
      saude: document.getElementById("statSaudeHud"),
      corpo: document.getElementById("statCorpoHud"),
      espada: document.getElementById("statEspadaHud"),
      fruta: document.getElementById("statFrutaHud"),
      buttons: Array.from(document.querySelectorAll(".stat-plus"))
    };
    this.masteryHud = {
      style: document.querySelector(".mastery-style"),
      value: document.getElementById("fistMasteryHud"),
      xp: document.getElementById("fistMasteryXpHud"),
      max: document.getElementById("fistMasteryMaxHud"),
      bar: document.getElementById("fistMasteryBar"),
      zRow: document.getElementById("skillZRow"),
      xRow: document.getElementById("skillXRow"),
      zMeta: document.getElementById("skillZMeta"),
      xMeta: document.getElementById("skillXMeta"),
      zName: document.querySelector("#skillZRow .skill-name"),
      xName: document.querySelector("#skillXRow .skill-name"),
      zCooldown: document.getElementById("skillZCooldown"),
      xCooldown: document.getElementById("skillXCooldown"),
      zLock: document.getElementById("skillZLock"),
      xLock: document.getElementById("skillXLock")
    };
    this.hud = {
      vida: document.getElementById("vidaHud"),
      nivel: document.getElementById("nivelHud"),
      xp: document.getElementById("xpHud"),
      xpMax: document.getElementById("xpMaxHud"),
      moedas: document.getElementById("moedasHud"),
      fruta: document.getElementById("frutaHud"),
      missao: document.getElementById("missaoHud"),
      vidaBar: document.getElementById("vidaBar"),
      xpBar: document.getElementById("xpBar")
    };
    this.setQuestMinimized(true);
  },

  hideMenu() {
    this.menu.classList.add("hidden");
    this.gameOver.classList.add("hidden");
    document.body.classList.remove("menu-open");
  },

  showToast(message) {
    this.toast.innerHTML = message;
    this.toast.style.display = "block";
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.style.display = "none";
    }, 2600);
  },

  setQuestMinimized(minimized) {
    if (!this.questPanel || !this.questToggle) return;
    this.questPanel.classList.toggle("minimized", minimized);
    this.questToggle.textContent = minimized ? "+" : "-";
  },

  toggleQuestMinimized() {
    if (!this.questPanel) return;
    this.setQuestMinimized(!this.questPanel.classList.contains("minimized"));
  },

  showQuestComplete(title, rewardText) {
    if (!this.questCompleteNotice) return;
    if (this.questCompleteText) this.questCompleteText.textContent = rewardText || title || "";
    this.questCompleteNotice.classList.remove("hidden");
    this.questCompleteNotice.style.animation = "none";
    this.questCompleteNotice.offsetHeight;
    this.questCompleteNotice.style.animation = "";
    clearTimeout(this.questCompleteTimer);
    this.questCompleteTimer = setTimeout(() => {
      this.questCompleteNotice.classList.add("hidden");
    }, 2850);
  },

  updateMasteryPanel(player, game) {
    if (!this.masteryPanel || !player) return;
    const selectedItem = game && game.getSelectedHotbarItem ? game.getSelectedHotbarItem() : null;
    const visible = !!selectedItem && (selectedItem.id === "baseFighting" || selectedItem.id === "mihawkKogatana");
    this.masteryPanel.classList.toggle("visible", visible);
    if (!visible) return;

    const isSword = selectedItem.id === "mihawkKogatana";
    const mastery = isSword ? player.espadaMaestria || 0 : player.socoMaestria || 0;
    const masteryXp = isSword ? player.espadaMaestriaXp || 0 : player.socoMaestriaXp || 0;
    const masteryMax = isSword ? player.espadaMaestriaMax || 1 : player.socoMaestriaMax || 1;
    const zRequired = isSword ? 5 : 5;
    const xRequired = isSword ? 12 : 10;
    const zUnlocked = mastery >= zRequired;
    const xUnlocked = mastery >= xRequired;
    const zCooldown = Math.ceil((isSword ? player.cooldownEspadaZ || 0 : player.cooldownSocoZ || 0) / 60);
    const xCooldown = Math.ceil((isSword ? player.cooldownEspadaX || 0 : player.cooldownSocoX || 0) / 60);
    const masteryProgress = masteryMax ? masteryXp / masteryMax : 0;

    if (this.masteryHud.style) this.masteryHud.style.textContent = isSword ? "Kogatana do Mihawk" : "Estilo de Luta Base";
    if (this.masteryHud.zName) this.masteryHud.zName.textContent = isSword ? "Corte do Colar" : "Soco no Ar: Modelo Gabriel";
    if (this.masteryHud.xName) this.masteryHud.xName.textContent = isSword ? "Mini Yoru" : "Impacto do Corsario: Modelo Gabriel";

    this.masteryHud.value.textContent = mastery;
    this.masteryHud.xp.textContent = Math.floor(masteryXp);
    this.masteryHud.max.textContent = masteryMax;
    this.masteryHud.bar.style.width = Math.max(0, Math.min(100, masteryProgress * 100)) + "%";
    this.masteryHud.zRow.classList.toggle("locked", !zUnlocked);
    this.masteryHud.xRow.classList.toggle("locked", !xUnlocked);
    this.masteryHud.zMeta.textContent = zUnlocked ? (isSword ? "Corte projetil - 2.5s" : "Soco aereo - 3s") : "Desbloqueia com Mas. " + zRequired;
    this.masteryHud.xMeta.textContent = xUnlocked ? (isSword ? "Tres cortes - 4.7s" : "Dano em area - 5s") : "Desbloqueia com Mas. " + xRequired;
    this.masteryHud.zCooldown.textContent = zCooldown > 0 ? zCooldown + "s" : "";
    this.masteryHud.xCooldown.textContent = xCooldown > 0 ? xCooldown + "s" : "";
    if (this.masteryHud.zLock) this.masteryHud.zLock.classList.toggle("hidden", zUnlocked);
    if (this.masteryHud.xLock) this.masteryHud.xLock.classList.toggle("hidden", xUnlocked);
  },

  updateStatsPanel(player) {
    if (!player || !this.statsHud.points) return;
    const stats = player.stats || {};
    this.statsHud.points.textContent = player.statPoints || 0;
    this.statsHud.saude.textContent = stats.saude || 0;
    this.statsHud.corpo.textContent = stats.corpo || 0;
    this.statsHud.espada.textContent = stats.espada || 0;
    this.statsHud.fruta.textContent = stats.fruta || 0;
    this.statsHud.buttons.forEach(button => {
      button.disabled = (player.statPoints || 0) <= 0;
    });
  },

  playMasteryLevelUp() {
    if (!this.masteryPanel) return;
    this.masteryPanel.classList.remove("mastery-level-up");
    this.masteryPanel.offsetHeight;
    this.masteryPanel.classList.add("mastery-level-up");
    clearTimeout(this.masteryLevelTimer);
    this.masteryLevelTimer = setTimeout(() => {
      this.masteryPanel.classList.remove("mastery-level-up");
    }, 650);
  },

  showDialog(html) {
    this.dialogoTexto.innerHTML = html;
    this.dialogo.style.display = "block";
  },

  closeDialog() {
    this.dialogo.style.display = "none";
  },

  showSpin(fruit) {
    if (this.spinCost) this.spinCost.textContent = fruit.costText || "Custo: 25 moedas";
    this.spinResultado.innerHTML =
      "Voce pegou:<br><span style='color:" + fruit.cor + "'>" +
      fruit.nome + " - " + fruit.raridade +
      "</span><br><small>" + fruit.skill + " / " + fruit.especial + "</small>";
    this.spinBox.classList.remove("hidden");
  },

  closeSpin() {
    this.spinBox.classList.add("hidden");
  },

  isInventoryOpen() {
    return !!this.inventoryPanel && !this.inventoryPanel.classList.contains("hidden");
  },

  openInventory(player, game) {
    if (!this.inventoryPanel) return;
    this.updateInventory(player, game);
    this.inventoryPanel.classList.remove("hidden");
    this.inventoryPanel.setAttribute("aria-hidden", "false");
  },

  closeInventory() {
    if (!this.inventoryPanel) return;
    this.inventoryPanel.classList.add("hidden");
    this.inventoryPanel.setAttribute("aria-hidden", "true");
  },

  toggleInventory(player, game) {
    if (this.isInventoryOpen()) this.closeInventory();
    else this.openInventory(player, game);
  },

  updateInventory(player, game) {
    if (!this.inventoryGrid || !player) return;
    const items = game && Array.isArray(game.hotbarItems) ? game.hotbarItems : [];
    this.inventoryGrid.innerHTML = "";

    for (let i = 0; i < 24; i++) {
      const item = items[i] || null;
      const slot = document.createElement("div");
      slot.className = "inventory-slot" + (item ? " filled" : "");
      if (item) {
        const img = document.createElement("img");
        img.src = item.icon;
        img.alt = item.nome;
        slot.appendChild(img);

        const label = document.createElement("div");
        label.className = "inventory-slot-name";
        label.textContent = item.nome;
        slot.appendChild(label);
      }
      this.inventoryGrid.appendChild(slot);
    }

    if (this.inventoryStats) {
      this.inventoryStats.innerHTML = [
        ["Moedas", player.moedas || 0],
        ["Fruta", player.fruta ? player.fruta.nome : "Nenhuma"],
        ["Nivel", player.nivel || 1]
      ].map(([label, value]) => (
        "<div class=\"inventory-stat\">" + label + "<strong>" + value + "</strong></div>"
      )).join("");
    }
  },

  showGameOver(player) {
    this.textoGameOver.innerHTML =
      "Gabriel caiu em batalha.<br>" +
      "Nivel: " + player.nivel + "<br>" +
      "Fruta final: " + player.fruta.nome + "<br>" +
      "Moedas: " + player.moedas;
    this.gameOver.classList.remove("hidden");
  },

  updateHud(player, quest, questConfigs) {
    this.hud.vida.textContent = Math.max(0, Math.floor(player.vida)) + "/" + player.vidaMax;
    this.hud.nivel.textContent = player.nivel;
    this.hud.xp.textContent = player.xp;
    this.hud.xpMax.textContent = player.xpMax;
    this.hud.moedas.textContent = player.moedas;
    this.hud.fruta.textContent = player.fruta.nome + " (" + player.fruta.raridade + ")";
    this.hud.vidaBar.style.width = Math.max(0, Math.min(100, player.vida / player.vidaMax * 100)) + "%";
    this.hud.xpBar.style.width = Math.max(0, Math.min(100, player.xp / player.xpMax * 100)) + "%";

    if (!quest) {
      this.hud.missao.textContent = "Explore a ilha";
      return;
    }

    const config = quest && questConfigs ? questConfigs[quest.id] : null;
    if (!quest.ativa && !quest.completa) {
      this.hud.missao.textContent = config ? "Fale com " + config.npcName : "Fale com o NPC";
    } else if (quest.ativa) {
      this.hud.missao.textContent = (config ? config.title + " " : "Derrote inimigos ") + quest.progresso + "/" + quest.objetivo;
    } else {
      this.hud.missao.textContent = config ? config.title + " concluida" : "Missao concluida";
    }
  }
};
