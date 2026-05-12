window.addEventListener("DOMContentLoaded", () => {
  GP.UI.init();
  const game = new GP.Game(document.getElementById("game"));
  window.GabrielPiece = game;
  let assetsReady = false;

  GP.Assets.load(
    () => {
      GP.GameMap.invalidateCache();
      assetsReady = true;
      const startButton = document.getElementById("startButton");
      if (startButton) {
        startButton.disabled = false;
        startButton.textContent = "Comecar Jornada";
      }
    },
    message => GP.UI.showToast(message)
  );

  window.iniciarJogo = () => {
    if (!assetsReady) {
      GP.UI.showToast("Carregando a ilha...");
      return;
    }
    game.start();
  };

  window.reiniciar = () => game.start();
  window.aceitarMissao = () => game.acceptQuest();
  window.fecharDialogo = () => GP.UI.closeDialog();
  window.fecharSpin = () => GP.UI.closeSpin();
  window.alternarMissao = () => GP.UI.toggleQuestMinimized();
  window.mostrarControles = () => {
    const info = document.getElementById("menuInfo");
    if (info) info.classList.toggle("visible");
  };
});
