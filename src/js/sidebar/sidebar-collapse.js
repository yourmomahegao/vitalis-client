$(function () {
  const $sidebarContainer = $(".sidebar-container");
  const $sidebarTitle = $sidebarContainer.find(".sidebar-title");
  const $sidebarCollapseButton = $sidebarTitle.find(".sidebar-collapse-button");

  $sidebarCollapseButton.on("click", function () {
    const sidebarCollapsed = $sidebarContainer.hasClass("collapsed");
    sidebarCollapsed ? $sidebarContainer.removeClass("collapsed") : $sidebarContainer.addClass("collapsed");
  });
});
