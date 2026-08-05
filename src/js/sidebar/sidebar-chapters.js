$(function () {
  const $sidebarContainer = $(".sidebar-container");
  const $chapterButtons = $sidebarContainer.find(".chapter-buttons-container");
  const $chaptersContainer = $(".chapters-container");

  $chapterButtons.on("click", ".chapter-button", function(event) {
    const $chapterButton = $(event.currentTarget);
    const chapterName = $chapterButton.data("chapterName");

    $chapterButtons.find(".chapter-button").removeClass("active");
    $chapterButtons.find(`.chapter-button[data-chapter-name="${chapterName}"]`).addClass("active");

    $chaptersContainer.find(".chapter-container").addClass("hidden");
    $chaptersContainer.find(`.chapter-container[data-chapter-name="${chapterName}"]`).removeClass("hidden");
  })
});