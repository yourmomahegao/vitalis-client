$(document).ready(function () {
  const $addServerButton = $(".chapter-container .chapter-sub-container .chapter-actions .chapter-action.add-server-button");
  const $addServerCustomWindow = $(".add-server-custom-window");
  const $addServerContainer = $(".add-server-container");
  const $addServerActions = $addServerContainer.find(".add-server-actions");
  const $addServerApplyButton = $addServerActions.find("#add-server-apply");

  const $addServerFields = $(".add-server-fields");
  const $addServerFieldAddress = $addServerFields.find("#address");
  const $addServerFieldPort = $addServerFields.find("#port");
  const $addServerFieldSecretKey = $addServerFields.find("#secret-key");
  const $addServerFieldSchema = $addServerFields.find("#schema");

  function ShowAddServerWindow() {
    $addServerCustomWindow.removeClass("hidden");
  }

  function HideAddServerWindow() {
    $addServerCustomWindow.addClass("hidden");
  }

  function ResetAddServerContainer() {
    $addServerFieldAddress.val("");
    $addServerFieldPort.val("");
    $addServerFieldSecretKey.val("");
    $addServerFieldSchema.find("option:first-child").prop("selected", true);
  }

  $addServerButton.on("click", function (event) {
    ResetAddServerContainer();
    ShowAddServerWindow();
  });

  $addServerApplyButton.on("click", function (event) {
    const address = $addServerFieldAddress.val();
    const port = $addServerFieldPort.val();
    const secretKey = $addServerFieldSecretKey.val();
    const schema = $addServerFieldSchema.find("option:selected").attr("value");

    console.log("%c  ~ address ", "padding:2px 4px; margin: 0px 2px; border-radius: 999px; background: #2474ff; color: #ffffff", address);
    console.log("%c  ~ port ", "padding:2px 4px; margin: 0px 2px; border-radius: 999px; background: #2474ff; color: #ffffff", port);
    console.log("%c  ~ secretKey ", "padding:2px 4px; margin: 0px 2px; border-radius: 999px; background: #2474ff; color: #ffffff", secretKey);
    console.log("%c  ~ schema ", "padding:2px 4px; margin: 0px 2px; border-radius: 999px; background: #2474ff; color: #ffffff", schema);

    HideAddServerWindow();
  });
});
