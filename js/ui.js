window.GP = window.GP || {};

GP.UI = {
  init() {
    this.menu = document.getElementById("menu");
    this.spinBox = document.getElementById("spinBox");
    this.spinResultado = document.getElementById("spinResultado");
    this.gameOver = document.getElementById("gameOver");
    this.textoGameOver = document.getElementById("textoGameOver");
    this.dialogo = document.getElementById("dialogo");
    this.dialogoTexto = document.getElementById("dialogoTexto");
    this.toast = document.getElementById("toast");
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

  showDialog(html) {
    this.dialogoTexto.innerHTML = html;
    this.dialogo.style.display = "block";
  },

  closeDialog() {
    this.dialogo.style.display = "none";
  },

  showSpin(fruit) {
    this.spinResultado.innerHTML =
      "Voce pegou:<br><span style='color:" + fruit.cor + "'>" +
      fruit.nome + " - " + fruit.raridade +
      "</span><br><small>" + fruit.skill + " / " + fruit.especial + "</small>";
    this.spinBox.classList.remove("hidden");
  },

  closeSpin() {
    this.spinBox.classList.add("hidden");
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
