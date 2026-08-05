class CustomWindow {
  static Preload() {
    this.#CreateStyles();
    this.#CreateFromHtml();
  }

  static #CreateStyles() {
    $("head").append(`<style>
        .custom-window {
          position: absolute;

          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          flex-direction: column;

          border-radius: var(--border-radius-l);
          background: var(--bg-lighter);

          transition: opacity 0.2s cubic-bezier(.22,0,.02,1.01);
        }

        .custom-window.hidden {
          opacity: 0;
          user-select: none;
          pointer-events: none;
        }

        .custom-window .custom-window-title-bar-spacer {
          width: 100%;
          height: 1px;
        }

        .custom-window .custom-window-body {
          width: 100%;
          height: 100%;
          min-height: 20px;

          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          flex-direction: column;

          overflow: auto;
        }

        .custom-window .custom-window-title-bar {
          width: calc(100% - var(--padding-m) * 2);
          user-select: none;

          padding: var(--padding-m);

          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-direction: row;
          gap: var(--gap-xs);
        }

        .custom-window .custom-window-title-bar .custom-window-icon {
          margin-left: var(--margin-xxs);
        }

        .custom-window .custom-window-title-bar .custom-window-icon img {
          width: 18px;
          height: 18px;
          border-radius: var(--border-radius-xxl);
          object-fit: cover;
        }

        .custom-window .custom-window-title-bar .custom-window-icon svg {
          width: 18px;
          height: 18px;
          color: var(--text);
        }

        .custom-window .custom-window-title-bar .custom-window-title {
          font-size: var(--font-s);
          font-weight: var(--font-weight-semibold);
        }

        .custom-window .custom-window-title-bar .custom-window-exit {
          cursor: pointer;

          padding: var(--padding-xs);
          margin: 0;
          margin-left: auto;

          background: transparent;
          border: none;
          outline: none;
          box-shadow: none;

          border-radius: var(--border-radius-s);

          transition: background 0.2s cubic-bezier(0.34, 0.05, 0.13, 0.99);

          svg {
            width: 16px;
            height: 16px;
          }
        }

        .custom-window .custom-window-title-bar .custom-window-exit:hover {
          background: var(--bg-alpha);
        }
      </style>`);
  }

  static #CreateFromHtml() {
    const $windows = $(".custom-window");
    for (const _window of $windows) {
      const $window = $(_window);

      const icon = $window.attr("icon") || undefined;
      const title = $window.attr("title") || undefined;
      const width = $window.attr("width") || undefined;
      const height = $window.attr("height") || undefined;
      const padding = $window.attr("padding") || undefined;
      const margin = $window.attr("margin") || undefined;
      const background = $window.attr("background") || undefined;
      const hidden = $window.prop("hidden") || undefined;
      const zIndex = $window.attr("zIndex") || undefined;
      const position = $window.attr("position") || undefined;

      CustomWindow.Create($window, icon, title, width, height, padding, margin, background, zIndex, position, hidden);
    }
  }

  static Create($container, icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panels-top-left-icon lucide-panels-top-left"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`, title = "Окно", width = "auto", height = "auto", padding = "0px 0px", margin = "0px 0px", background = "var(--bg-light)", zIndex = 999, position = "left left", hidden) {
    const $newWindow = $(`
      <div class="custom-window ${hidden ? "hidden" : ""}">
        <div class="custom-window-title-bar">
          <div class="custom-window-icon">${icon}</div> 
          <div class="custom-window-title">${title}</div> 
          <button class="custom-window-exit"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button> 
        </div>

        <div class="custom-window-title-bar-spacer"></div>

        <div class="custom-window-body">${$container.html()}</div>
      </div>`);

    position = position.split(" ");
    const positionX = position[0];
    const positionY = position[1];

    const positionMap = {
      left: { left: "0px" },
      right: { right: "0px" },
      center: { left: "50%" },
    };

    const positionYMap = {
      top: { top: "0px" },
      bottom: { bottom: "0px" },
      center: { top: "50%" },
    };

    const styles = { ...positionMap[positionX], ...positionYMap[positionY] };

    // Build combined transform
    const transforms = [];
    if (positionX === "center") transforms.push("translateX(-50%)");
    if (positionY === "center") transforms.push("translateY(-50%)");
    if (transforms.length > 0) {
      styles.transform = transforms.join(" ");
    }

    $newWindow.css(styles);

    $newWindow.find("custom-window-title").text(title);
    $newWindow.css("width", width);
    $newWindow.css("height", height);
    $newWindow.css("padding", padding);
    $newWindow.css("margin", margin);
    $newWindow.css("background", background);
    $newWindow.css("z-index", zIndex);

    $newWindow.on("click", ".custom-window-exit", function () {
      $newWindow.addClass("hidden");
      // Reset to default position
      setTimeout(() => {
        $newWindow.css({
          left: styles.left || "auto",
          top: styles.top || "auto",
          right: styles.right || "auto",
          bottom: styles.bottom || "auto",
          transform: transforms.length > 0 ? transforms.join(" ") : "none",
        });
      }, 200);
    });

    let isMoving = false;
    let offsetX = 0;
    let offsetY = 0;

    $newWindow.on("mousedown", ".custom-window-title-bar", function (e) {
      isMoving = true;
      const rect = $newWindow[0].getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      $newWindow.css("cursor", "grabbing");
      $newWindow.trigger("close");
    });

    $(document).on("mousemove", function (e) {
      if (isMoving) {
        // Bound movement to the closest positioned ancestor instead of the viewport
        const $boundsContainer = $newWindow.offsetParent();
        const containerRect = $boundsContainer[0].getBoundingClientRect();
        const rect = $newWindow[0].getBoundingClientRect();
        const windowElemWidth = rect.width;
        const windowElemHeight = rect.height;

        let newX = e.clientX - containerRect.left - offsetX;
        let newY = e.clientY - containerRect.top - offsetY;

        // Constrain X position
        newX = Math.max(0, Math.min(newX, containerRect.width - windowElemWidth));

        // Constrain Y position
        newY = Math.max(0, Math.min(newY, containerRect.height - windowElemHeight));

        $newWindow.css({
          left: newX + "px",
          top: newY + "px",
          transform: "none",
        });
      }
    });

    $(document).on("mouseup", function () {
      if (isMoving) {
        isMoving = false;
        $newWindow.css("cursor", "default");
      }
    });

    $container.replaceWith($newWindow);
    return $newWindow;
  }
}

$(function () {
  CustomWindow.Preload();
});
