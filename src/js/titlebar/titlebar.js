$(function () {
  const $main = $("body > .main");
  const $titlebarContainer = $main.find(".titlebar-container");
  const $titlebarDragArea = $titlebarContainer.find(".titlebar-drag-area");
  const $minimize = $titlebarContainer.find("#minimize");
  const $maximize = $titlebarContainer.find("#maximize");
  const $close = $titlebarContainer.find("#close");

  try {
    $titlebarDragArea[0].style.webkitAppRegion = "drag";
    $minimize[0].style.webkitAppRegion = "no-drag";
    $maximize[0].style.webkitAppRegion = "no-drag";
    $close[0].style.webkitAppRegion = "no-drag";
  } catch {}

  $minimize.on("click", (event) => {
    ipcRenderer.send("minimize-window");
  });

  $maximize.on("click", (event) => {
    ipcRenderer.send("maximize-window");
  });

  $close.on("click", (event) => {
    ipcRenderer.send("close-window");
  });
});
