function ApplyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("THEME", theme);

  $.each($("link"), function (_, value) {
    const $element = $(value);
    const href = $element.attr("href");
    if (!href) return;

    if (theme === "dark" && href.includes("prism-light.css")) {
      $element.attr("href", href.replace("prism-light.css", "prism.css"));
      return false;
    }
    if (theme === "light" && /prism\.css/.test(href) && !href.includes("prism-light.css")) {
      $element.attr("href", href.replace("prism.css", "prism-light.css"));
      return false;
    }
  });

  $(".title-bar-option#theme")
    .toggleClass("dark-mode", theme === "dark")
    .toggleClass("light-mode", theme === "light");
}

ApplyTheme(localStorage.getItem("THEME") ?? "dark");

$(".title-bar .title-bar-option[id='theme']").on("click", function () {
  ApplyTheme(localStorage.getItem("THEME") === "light" ? "dark" : "light");
});
