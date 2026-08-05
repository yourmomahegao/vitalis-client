$(function () {
  const $sidebarContainer = $(".sidebar-container");
  const $sidebarButtons = $sidebarContainer.find(".sidebar-buttons-container");

  function GetCurrentTheme() {
    const currentTheme = localStorage.getItem("THEME");
    return currentTheme;
  }

  function UpdateThemeIcon(currentTheme) {
    const $themeActionButton = $sidebarButtons.find('.action-button[data-action-name="theme"]');

    if (currentTheme == "light") {
      $themeActionButton.find("svg.dark-theme-icon").addClass("hidden");
      $themeActionButton.find("svg.light-theme-icon").removeClass("hidden");
    } else {
      $themeActionButton.find("svg.dark-theme-icon").removeClass("hidden");
      $themeActionButton.find("svg.light-theme-icon").addClass("hidden");
    }
  }

  function ChangeTheme(currentTheme) {
    if (currentTheme == "light") {
      ApplyTheme("dark");
    } else {
      ApplyTheme("light");
    }
  }

  // Updating theme button on startup
  const currentTheme = GetCurrentTheme();
  UpdateThemeIcon(currentTheme);

  // Updating theme on action click
  function Handler__ActionTheme($actionButton) {
    let currentTheme = GetCurrentTheme();
    ChangeTheme(currentTheme);

    currentTheme = GetCurrentTheme();
    UpdateThemeIcon(currentTheme);
  }

  // Action buttons handlers
  $sidebarButtons.on("click", ".action-button", function (event) {
    const $actionButton = $(event.currentTarget);
    const actionName = $actionButton.data("actionName");

    if (actionName == "theme") {
      Handler__ActionTheme($actionButton);
    }
  });
});
