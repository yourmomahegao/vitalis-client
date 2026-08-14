class Dashboard {
  constructor() {
    this.$DashboardChapter = $('.chapter-container[data-chapter-name="dashboard"]');
    this.$DashboardContainer = this.$DashboardChapter.find(".dashboard-container");
    this.$ServersNotSelectedContainer = this.$DashboardChapter.find(".server-not-selected-container");

    this.SelectedServer = null;
  }

  SetDashboadCardValues(cardName, valuePercent, value, valueUnits, maxValue, maxValueUnits) {
    const $card = this.$DashboardContainer.find(`.dashboard-card[data-card-name="${cardName}"]`);
    const $cardSliderInner = $card.find(".value-slider .value-slider-inner");
    const $cardValue = $card.find(".value .value-value");
    const $cardMaxValue = $card.find(".value .value-max-value");

    let load = "low";
    if (valuePercent >= 50 && valuePercent < 80) {
      load = "medium";
    } else if (valuePercent >= 80) {
      load = "high";
    }

    $card.attr("data-load", load);
    $cardSliderInner.css("width", `${valuePercent}%`);
    $cardValue.text(`${value}${valueUnits}`);
    $cardMaxValue.text(`${maxValue}${maxValueUnits}`);
  }

  #FormatBytes(bytes, decimals = 2) {
    const units = ["b", "Kb", "Mb", "Gb", "Tb", "Pb"];

    if (!bytes || bytes === 0) {
      return [0, units[0]];
    }

    const isNegative = bytes < 0;
    const absoluteBytes = Math.abs(bytes);

    const unitIndex = Math.min(Math.floor(Math.log(absoluteBytes) / Math.log(1024)), units.length - 1);

    const value = absoluteBytes / Math.pow(1024, unitIndex);
    const roundedValue = Number(value.toFixed(decimals));

    return [isNegative ? -roundedValue : roundedValue, units[unitIndex]];
  }

  async UpdateDashboardCards() {
    const cpuMetrics = (await this.SelectedServer.GetSystemMetric("cpu", { limit_group: 1 })) || [];
    const ramMetrics = (await this.SelectedServer.GetSystemMetric("ram", { limit_group: 1 })) || [];
    const fileMetrics = (await this.SelectedServer.GetSystemMetric("file", { limit_group: 1 })) || [];

    try {
      let cpuValuePercent = 0;
      let cpuValue = 0;
      let cpuValueUnits = "%";
      let cpuMaxValue = 100;
      let cpuMaxValueUnits = "%";

      for (const cpuMetric of cpuMetrics) {
        cpuValue += cpuMetric.utilization;
      }

      cpuValue = Math.round(cpuValue / cpuMetrics.length);
      cpuValuePercent = cpuValue;

      this.SetDashboadCardValues("cpu", cpuValuePercent, cpuValue, cpuValueUnits, cpuMaxValue, cpuMaxValueUnits);
    } catch {
      console.error(`Error getting CPU metric: ${err}`);
    }

    try {
      let ramValuePercent = 0;
      let ramValue = 0;
      let ramValueUnits = "";
      let ramMaxValue = 0;
      let ramMaxValueUnits = "";

      for (const ramMetric of ramMetrics) {
        ramValue += ramMetric.used;
        ramMaxValue += ramMetric.total;
      }

      [ramValue, ramValueUnits] = this.#FormatBytes(ramValue);
      [ramMaxValue, ramMaxValueUnits] = this.#FormatBytes(ramMaxValue);
      ramValuePercent = Math.round((ramValue / ramMaxValue) * 100);

      this.SetDashboadCardValues("ram", ramValuePercent, ramValue, ramValueUnits, ramMaxValue, ramMaxValueUnits);
    } catch (err) {
      console.error(`Error getting RAM metric: ${err}`);
    }

    try {
      let fileValuePercent = 0;
      let fileValue = 0;
      let fileValueUnits = "";
      let fileMaxValue = 0;
      let fileMaxValueUnits = "";

      for (const fileMetric of fileMetrics) {
        fileValue += fileMetric.used;
        fileMaxValue += fileMetric.total;
      }

      [fileValue, fileValueUnits] = this.#FormatBytes(fileValue);
      [fileMaxValue, fileMaxValueUnits] = this.#FormatBytes(fileMaxValue);
      fileValuePercent = Math.round((fileValue / fileMaxValue) * 100);

      this.SetDashboadCardValues("file", fileValuePercent, fileValue, fileValueUnits, fileMaxValue, fileMaxValueUnits);
    } catch (err) {
      console.error(`Error getting file metric: ${err}`);
    }
  }

  ShowContainer() {
    this.$DashboardContainer.removeClass("hidden");
  }

  HideContainer() {
    this.$DashboardContainer.addClass("hidden");
  }

  ShowServersNotSelected() {
    this.$ServersNotSelectedContainer.removeClass("hidden");
  }

  HideServersNotSelected() {
    this.$ServersNotSelectedContainer.addClass("hidden");
  }

  GetSelectedServer() {
    let selectedServer = null;

    try {
      const serverIdRaw = localStorage.getItem("VITALIS_SELECTED_SERVER_ID");
      const serverId = serverIdRaw ? parseInt(serverIdRaw) || null : null;
      selectedServer = Servers.find((server) => server.Id === serverId);
    } catch {}

    return selectedServer ?? null;
  }

  UpdateSelectedServer() {
    this.SelectedServer = this.GetSelectedServer();
  }

  MoveToServers() {
    $('.sidebar-container .sidebar-buttons-container .chapter-button[data-chapter-name="servers"]').trigger("click");
  }

  async Preload() {
    this.UpdateSelectedServer();

    if (!this.SelectedServer) {
      this.HideContainer();
      this.ShowServersNotSelected();
      this.MoveToServers();
      return;
    }

    this.ShowContainer();
    this.HideServersNotSelected();
    await this.Update();
  }

  async Update() {
    await this.UpdateDashboardCards();
  }
}
