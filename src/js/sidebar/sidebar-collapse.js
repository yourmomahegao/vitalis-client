$(function () {
  const $sidebarContainer = $(".sidebar-container");
  const $sidebarTitle = $sidebarContainer.find(".sidebar-title");
  const $sidebarCollapseButton = $sidebarTitle.find(".sidebar-collapse-button");

  function applySidebarCollapsed(sidebarCollapsed) {
    sidebarCollapsed ? $sidebarContainer.removeClass("collapsed") : $sidebarContainer.addClass("collapsed");
  }

  const sidebarCollapsed = localStorage.getItem("VITALIS_SIDEBAR_COLLAPSED") === "true";
  applySidebarCollapsed(sidebarCollapsed);

  $sidebarCollapseButton.on("click", function () {
    const sidebarCollapsed = $sidebarContainer.hasClass("collapsed");
    applySidebarCollapsed(sidebarCollapsed);
    localStorage.setItem("VITALIS_SIDEBAR_COLLAPSED", sidebarCollapsed);
  });
});
