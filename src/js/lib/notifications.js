class Notification {

  static Type = { SUCCESS: 0, ERROR: 1, WARNING: 2, INFO: 3 };
  static Styles = `<style id="notifications-styles">.notification-container {
        width: 100vw;

        position: absolute;
        top: 0;
        left: 0;
        right: 0;

        display: flex;
        align-items: center;
        justify-self: center;
        flex-direction: column;

        pointer-events: none;

        z-index: 9999;
    }

    .notification-container .notification {
        max-width: calc(100% - 80px);
        pointer-events: all;

        cursor: pointer;
        /* position: absolute; */

        margin-top: 20px;
        padding: var(--padding-l);

        user-select: none;

        display: flex;
        align-items: center;
        justify-self: center;
        flex-direction: row;
        flex-wrap: nowrap;
        gap: var(--gap-s);

        border-radius: var(--border-radius-l);
        box-shadow: var(--shadow-light);

        color: var(--text);
        background-color: var(--bg-lightest);
        transform: translate(0, calc(-100% - 20px));
        transition: all 0.5s cubic-bezier(0.13, 0.03, 0.13, 0.99);
    }

    .notification-container .notification.hidden {
        transform: translate(0, -120%);
        transition: all 0.5s cubic-bezier(0.75, 0.07, 1, 0.54);
    }

    .notification-container .notification .notification-content {
        display: flex;
        align-items: center;
        justify-self: center;
        flex-direction: row;
        gap: var(--gap-xs);

        font-size: var(--font-m);
        font-weight: var(--font-weight-normal);
        white-space: wrap;
    }

    .notification-container .notification .notification-content .notification-title {
        font-size: var(--font-m);
        font-weight: var(--font-weight-semibold);
        white-space: nowrap;
    }

    .notification-container .notification .notification-content .notification-delimeter {
        font-size: var(--font-m);
        font-weight: var(--font-weight-semibold);
        white-space: wrap;
    }

    .notification-container .notification .notification-content .notification-text {
        font-size: var(--font-m);
        font-weight: var(--font-weight-normal);
        white-space: wrap;
    }

    .notification-container .notification #icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }

    .notification-container .notification.success-notification #icon {
        fill: var(--green);
    }

    .notification-container .notification.error-notification #icon {
        fill: var(--red);
    }

    .notification-container .notification.warning-notification #icon {
        fill: var(--yellow);
    }

    .notification-container .notification.info-notification #icon {
        fill: var(--light-blue);
    }</style>`;

  static StylesCreated = false;
  static Container = null;

  static uuidv4() {
    // Generate a random UUID (version 4)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  constructor(text, type = 0, time = 2500) {
    this.Id = Notification.uuidv4();
    this.Text = text;
    this.Type = type;
    this.Time = time;
    this.Element;

    if (Notification.Container === null) {
      const $newContainer = $(`<div class="notification-container"></div>`);
      $("body").prepend($newContainer);
      Notification.Container = $newContainer;
    }

    if (Notification.StylesCreated === false) {
      this.#CreateStyles();
    }
  }

  #CreateStyles() {
    $("head").append(Notification.Styles);
  }

  Show() {
    const self = this;

    // Constructing HTML of the notification
    let notificationHTML;
    if (self.Type == Notification.Type.SUCCESS) {
      notificationHTML = `<div id="${this.Id}" class="notification success-notification">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="icon" x="0px" y="0px" viewBox="0 0 507.506 507.506" style="enable-background:new 0 0 507.506 507.506;" xml:space="preserve" width="512" height="512"><g><path d="M163.865,436.934c-14.406,0.006-28.222-5.72-38.4-15.915L9.369,304.966c-12.492-12.496-12.492-32.752,0-45.248l0,0   c12.496-12.492,32.752-12.492,45.248,0l109.248,109.248L452.889,79.942c12.496-12.492,32.752-12.492,45.248,0l0,0   c12.492,12.496,12.492,32.752,0,45.248L202.265,421.019C192.087,431.214,178.271,436.94,163.865,436.934z"/></g></svg>
        <div class="notification-content">
          <div class="notification-title">Success</div>
          <div class="notification-delimeter">•</div>
          <div class="notification-text">${this.Text}</div>
        </div>
      </div>`;
    } else if (self.Type == Notification.Type.ERROR) {
      notificationHTML = `<div id="${this.Id}" class="notification error-notification">
      <svg xmlns="http://www.w3.org/2000/svg" id="icon" viewBox="0 0 24 24" width="512" height="512"><path d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm0,22A10,10,0,1,1,22,12,10.011,10.011,0,0,1,12,22Z"/><path d="M12,5a1,1,0,0,0-1,1v8a1,1,0,0,0,2,0V6A1,1,0,0,0,12,5Z"/><rect x="11" y="17" width="2" height="2" rx="1"/></svg>
      <div class="notification-content">
        <div class="notification-title">Error</div>
        <div class="notification-delimeter">•</div>
        <div class="notification-text">${this.Text}</div>
      </div>
    </div>`;
    } else if (self.Type == Notification.Type.WARNING) {
      notificationHTML = `<div id="${this.Id}" class="notification warning-notification">
      <svg xmlns="http://www.w3.org/2000/svg" id="icon" data-name="Layer 1" viewBox="0 0 24 24" width="512" height="512"><path d="M11,13V7c0-.55,.45-1,1-1s1,.45,1,1v6c0,.55-.45,1-1,1s-1-.45-1-1Zm1,2c-.83,0-1.5,.67-1.5,1.5s.67,1.5,1.5,1.5,1.5-.67,1.5-1.5-.67-1.5-1.5-1.5Zm11.58,4.88c-.7,1.35-2.17,2.12-4.01,2.12H4.44c-1.85,0-3.31-.77-4.01-2.12-.71-1.36-.51-3.1,.5-4.56L8.97,2.6c.71-1.02,1.83-1.6,3.03-1.6s2.32,.58,3,1.57l8.08,12.77c1.01,1.46,1.2,3.19,.49,4.54Zm-2.15-3.42s-.02-.02-.02-.04L13.34,3.67c-.29-.41-.79-.67-1.34-.67s-1.05,.26-1.36,.71L2.59,16.42c-.62,.88-.76,1.84-.4,2.53,.35,.68,1.15,1.05,2.24,1.05h15.12c1.09,0,1.89-.37,2.24-1.05,.36-.69,.22-1.65-.37-2.49Z"/></svg>
      <div class="notification-content">
        <div class="notification-title">Warning</div>
        <div class="notification-delimeter">•</div>
        <div class="notification-text">${this.Text}</div>
      </div>
    </div>`;
    } else if (self.Type == Notification.Type.INFO) {
      notificationHTML = `<div id="${this.Id}" class="notification info-notification">
      <svg xmlns="http://www.w3.org/2000/svg" id="icon" viewBox="0 0 24 24" width="512" height="512"><path d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm0,22A10,10,0,1,1,22,12,10.011,10.011,0,0,1,12,22Z"/><path d="M12,10H11a1,1,0,0,0,0,2h1v6a1,1,0,0,0,2,0V12A2,2,0,0,0,12,10Z"/><circle cx="12" cy="6.5" r="1.5"/></svg>
      <div class="notification-content">
        <div class="notification-title">Info</div>
        <div class="notification-delimeter">•</div>
        <div class="notification-text">${this.Text}</div>
      </div>
    </div>`;
    }

    // Adding notification to the page
    Notification.Container.append(notificationHTML);
    this.Element = Notification.Container.find(`.notification[id="${this.Id}"]`);

    // Animating notification start
    setTimeout(() => {
      const notifications = Notification.Container.find(".notification");
      notifications.each((index, notification) => {
        const notificationElement = $(notification);
        notificationElement.css("transform", `translate(0, 0px)`);
      });
    }, 100);

    // Adding click hide
    this.Element.click(() => {
      self.Hide();
    });

    // Adding hide time
    if (self.Time > 0) {
      setTimeout(() => {
        self.Hide();
      }, self.Time);
    }
  }

  Hide() {
    const self = this;

    // Hiding notification
    this.Element.css("transform", `translate(0, calc(-${100 * ($(".notification").length + 1)}% - 20px))`);
    this.Element.css("opacity", `0`);
    // this.Element.addClass("hidden");

    // Removing notification
    setTimeout(() => {
      self.Element.remove();
    }, 500);
  }
}

$(function () {
  // Example
  // new Notification("Example", Notification.Type.SUCCESS, 3000).Show();
});
