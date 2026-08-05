$(async function () {
  const $encryptionContainer = $(".encryption-container");
  const $encryptionSubContainer = $encryptionContainer.find(".encryption-sub-container");
  const $encryptionKey = $encryptionSubContainer.find(".encryption-key");
  const $encryptionError = $encryptionSubContainer.find(".encryption-error");
  const $encryptionActions = $encryptionSubContainer.find(".encryption-actions");
  const $encryptionSignButton = $encryptionActions.find(".encryption-action.sign-encryption-key");
  const $encryptionResetButton = $encryptionActions.find(".encryption-action.reset-encryption-key");

  const $newEncryptionContainer = $(".new-encryption-container");
  const $newEncryptionSubContainer = $newEncryptionContainer.find(".new-encryption-sub-container");
  const $newEncryptionKey = $newEncryptionSubContainer.find(".new-encryption-key");
  const $newEncryptionError = $newEncryptionSubContainer.find(".new-encryption-error");
  const $newEncryptionActions = $newEncryptionSubContainer.find(".new-encryption-actions");
  const $newEncryptionCreateButton = $newEncryptionActions.find(".new-encryption-action.create-encryption-key");

  // Is encryption key exists
  const keyExists = await Encrypt.isEncryptionKeyExists();

  function ShowEncryptionContainer() {
    $encryptionContainer.removeClass("hidden");
  }

  function HideEncryptionContainer() {
    $encryptionContainer.addClass("hidden");
  }

  function ShowNewEncryptionContainer() {
    $newEncryptionContainer.removeClass("hidden");
  }

  function HideNewEncryptionContainer() {
    $newEncryptionContainer.addClass("hidden");
  }

  // Showing container for new key or sign in with key
  if (keyExists) {
    ShowEncryptionContainer();
  } else {
    ShowNewEncryptionContainer();
  }

  // Triggering sign in
  $encryptionKey.on("keyup", async function (event) {
    event.key === "Enter" ? $encryptionSignButton.trigger("click") : null;
  });

  // Sign in using encryption key
  $encryptionSignButton.on("click", async function (event) {
    const userKey = $encryptionKey.val();
    $encryptionKey.val("");

    const keyCheckResult = await Encrypt.checkEncryptionKey(userKey);

    if (keyCheckResult.status === false) {
      $encryptionError.text(keyCheckResult.message);
      $encryptionError.removeClass("hidden");
      return;
    }

    Encrypt.SavedKey = userKey;
    HideEncryptionContainer();
  });

  // Triggering create encryption key
  $newEncryptionKey.on("keyup", async function (event) {
    event.key === "Enter" ? $newEncryptionCreateButton.trigger("click") : null;
  });

  // Creating new encryption key
  $newEncryptionCreateButton.on("click", async function (event) {
    const newKey = $newEncryptionKey.val();
    $newEncryptionKey.val("");

    const keySaveResult = await Encrypt.saveEncryptionKey(newKey);

    if (keySaveResult.status === false) {
      $newEncryptionError.text(keySaveResult.message);
      $newEncryptionError.removeClass("hidden");
      return;
    }

    Encrypt.SavedKey = newKey;
    HideNewEncryptionContainer();
  });

  // TODO: Implement reset key logic here
});
