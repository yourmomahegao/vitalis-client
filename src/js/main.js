$(function () {
  const $body = $("body");
  setTimeout(() => {
    $body[0].removeAttribute("no-transitions");
  }, 100);
});
