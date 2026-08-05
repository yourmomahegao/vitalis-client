$(function () {
  const $sidebarContainer = $(".sidebar-container");
  const $sidebarButtons = $sidebarContainer.find(".sidebar-buttons-container");
  const $chaptersContainer = $(".chapters-container");

  $sidebarButtons.on("click", ".chapter-button", function(event) {
    const $chapterButton = $(event.currentTarget);
    const chapterName = $chapterButton.data("chapterName");

    $sidebarButtons.find(".chapter-button").removeClass("active");
    $sidebarButtons.find(`.chapter-button[data-chapter-name="${chapterName}"]`).addClass("active");

    $chaptersContainer.find(".chapter-container").addClass("hidden");
    $chaptersContainer.find(`.chapter-container[data-chapter-name="${chapterName}"]`).removeClass("hidden");
  })
});