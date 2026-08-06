$(document).ready(function () {
  const $addServerButton = $(".chapter-container .chapter-sub-container .chapter-actions .chapter-action.add-server-button");
  const $addServerCustomWindow = $(".add-server-custom-window");
  const $addServerContainer = $(".add-server-container");
  const $addServerActions = $addServerContainer.find(".add-server-actions");
  const $addServerMessage = $addServerContainer.find(".add-server-message");
  const $addServerApplyButton = $addServerActions.find("#add-server-apply");
  const $addServerTestConnection = $addServerActions.find("#add-server-test-connection");

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
    $addServerMessage.text("");
    $addServerMessage.attr("data-test-status", true);
    $addServerMessage.addClass("hidden");
  }

  function ResetTestServerConnectionMessage() {}

  function UpdateAddServerMessage(status, message) {
    $addServerMessage.text(message);
    $addServerMessage.attr("data-test-status", status);
    $addServerMessage.removeClass("hidden");
  }

  async function TestServerConnection(address, port, secretKey, schema) {
    const path = `/worker/status/`;
    const url = `${schema}${address}:${port}${path}`;

    let response = null;
    try {
      response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(1000),
      });
    } catch {}

    if (response == null) {
      return result;
    }

    let data = null;
    try {
      data = await response.json();
    } catch {}

    if (data == null) {
      return { status: false, message: "Failed to receive response data from the server" };
    }

    if (data.status != true) {
      return { status: false, message: "Server responded, but reported it isn't ready" };
    }

    const keyCheckPath = `/auth/secret/check/`;
    const keyCheckUrl = `${schema}${address}:${port}${keyCheckPath}`;

    response = null;
    try {
      const requestData = new FormData();
      requestData.append("secret_key", secretKey);

      response = await fetch(keyCheckUrl, {
        method: "POST",
        body: requestData,
        signal: AbortSignal.timeout(1000),
      });
    } catch {}

    if (response == null) {
      return { status: false, message: "The server cannot identify the secret key" };
    }

    data = null;
    try {
      data = await response.json();
    } catch {}

    if (data.status != true) {
      return { status: false, message: "Secret key is invalid" };
    }

    return { status: true, message: "The server is ready to work" };
  }

  async function SaveServer(address, port, secretKey, schema) {}

  async function AddServer(address, port, secretKey, schema) {}

  $addServerButton.on("click", function (event) {
    ResetAddServerContainer();
    ShowAddServerWindow();
  });

  $addServerTestConnection.on("click", async function () {
    const address = $addServerFieldAddress.val();
    const port = $addServerFieldPort.val();
    const secretKey = $addServerFieldSecretKey.val();
    const schema = $addServerFieldSchema.find("option:selected").attr("value");

    const testResult = await TestServerConnection(address, port, secretKey, schema);

    if (testResult.status == false) {
      UpdateAddServerMessage(testResult.status, testResult.message);
      return;
    }
  });

  $addServerApplyButton.on("click", async function (event) {
    const address = $addServerFieldAddress.val();
    const port = $addServerFieldPort.val();
    const secretKey = $addServerFieldSecretKey.val();
    const schema = $addServerFieldSchema.find("option:selected").attr("value");

    console.log("%c  ~ address ", "padding:2px 4px; margin: 0px 2px; border-radius: 999px; background: #2474ff; color: #ffffff", address);
    console.log("%c  ~ port ", "padding:2px 4px; margin: 0px 2px; border-radius: 999px; background: #2474ff; color: #ffffff", port);
    console.log("%c  ~ secretKey ", "padding:2px 4px; margin: 0px 2px; border-radius: 999px; background: #2474ff; color: #ffffff", secretKey);
    console.log("%c  ~ schema ", "padding:2px 4px; margin: 0px 2px; border-radius: 999px; background: #2474ff; color: #ffffff", schema);

    const testResult = await TestServerConnection(address, port, secretKey, schema);
    console.log("%c  ~ testResult ", "padding:2px 4px; margin: 0px 2px; border-radius: 999px; background: #2474ff; color: #ffffff", testResult);

    if (testResult.status == false) {
      UpdateAddServerMessage(testResult.status, testResult.message);
      return;
    }

    const addResult = await AddServer(address, port, secretKey, schema);

    if (addResult.status == false) {
      UpdateAddServerMessage(addResult.status, addResult.message);
      return;
    }

    HideAddServerWindow();
  });
});
