class Dashboard {
  constructor() {
    this.$DashboardChapter = $('.chapter-container[data-chapter-name="dashboard"]');
    this.$DashboardContainer = this.$DashboardChapter.find(".dashboard-container");
    this.$ServersNotSelectedContainer = this.$DashboardChapter.find(".server-not-selected-container");

    this.CpuChart = null;
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

  #GetCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  MapCpuMetricsToChartPoints(rawData) {
    return rawData
      .slice()
      .sort((a, b) => new Date(a.insertion_datetime) - new Date(b.insertion_datetime))
      .map((item) => {
        const date = new Date(item.insertion_datetime);

        return {
          label: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          timestamp: date.toLocaleString(),
          value: item.utilization,
          speedMhz: item.current_speed_mhz,
        };
      });
  }

  CreateCpuChart(container) {
    const chart = echarts.init(container, null, { renderer: "svg" });

    window.addEventListener("resize", () => chart.resize());

    return chart;
  }

  UpdateCpuChart({ points = [], highlightLast = true } = {}) {
    const chart = this.CpuChart;

    chart.resize();

    const red = this.#GetCssVar("--red");
    const yellow = this.#GetCssVar("--yellow");
    const green = this.#GetCssVar("--green");
    const textSub = this.#GetCssVar("--text-sub");
    const text = this.#GetCssVar("--text");
    const border = this.#GetCssVar("--border");
    const bgLight = this.#GetCssVar("--bg-light");
    const bgLighter = this.#GetCssVar("--bg-lighter");
    const fontXs = this.#GetCssVar("--font-xs");
    const fontS = this.#GetCssVar("--font-s");
    const fontFamily = "'Montserrat', sans-serif";

    const categories = points.map((p) => p.label);
    const values = points.map((p) => p.value);
    const lastValue = values[values.length - 1] ?? 0;

    const lineColor = lastValue >= 90 ? red : lastValue >= 70 ? yellow : green;
    const lineAlpha = lastValue >= 90 ? this.#GetCssVar("--red-alpha") : lastValue >= 70 ? this.#GetCssVar("--yellow-alpha") : this.#GetCssVar("--green-alpha");
    const lineFullAlpha = lastValue >= 90 ? this.#GetCssVar("--red-full-alpha") : lastValue >= 70 ? this.#GetCssVar("--yellow-full-alpha") : this.#GetCssVar("--green-full-alpha");

    const option = {
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: "category",
        data: categories,
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: textSub,
          fontSize: fontXs,
          fontFamily,
          margin: 28,
          formatter: (value) => value,
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        interval: 25,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: border, type: "dashed" } },
        axisLabel: { color: textSub, fontSize: fontXs, fontFamily, margin: 28, formatter: "{value}%" },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: border, type: "dashed" } },
        backgroundColor: bgLight,
        borderColor: border,
        borderWidth: 1,
        padding: 12,
        extraCssText: `border-radius: 12px; box-shadow: ${this.#GetCssVar("--shadow-light")}; font-family: ${fontFamily};`,
        formatter: (paramsList) => {
          const param = paramsList[0];
          const point = points[param.dataIndex];

          return `
          <div style="font-size: ${fontXs}; color: ${textSub}; margin-bottom: 4px;">
            ${point.timestamp}
          </div>
          <div style="font-size: ${fontS}; color: ${text}; font-weight: 600;">
            ${point.value.toFixed(1)}% CPU
          </div>
          <div style="font-size: ${fontXs}; color: ${textSub}; margin-top: 2px;">
            ${(point.speedMhz / 1000).toFixed(2)} GHz
          </div>
        `;
        },
      },
      series: [
        {
          name: "cpu",
          type: "line",
          data: values,
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          showSymbol: false,
          itemStyle: { color: lineColor, borderWidth: 2, borderColor: bgLight },
          lineStyle: { color: lineColor, width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: lineAlpha },
              { offset: 1, color: lineFullAlpha.replace(/[\d.]+\)$/, "0)") },
            ]),
          },
          markPoint: highlightLast
            ? {
                symbol: "circle",
                symbolSize: 8,
                itemStyle: { color: lineColor, borderColor: bgLight, borderWidth: 2 },
                label: { show: false },
                data: [{ coord: [categories.length - 1, lastValue] }],
              }
            : undefined,
          emphasis: { focus: "series", itemStyle: { borderWidth: 3 } },
          z: 2,
        },
      ],
    };

    chart.setOption(option, true);
  }

  DestroyCpuChart() {
    const chart = this.CpuChart;
    chart._resizeObserver?.disconnect();
    chart.dispose();
  }

  async UpdateDashboard() {
    const cpuMetrics = (await this.SelectedServer.GetSystemMetric("cpu", { limit_group: 1 })) || [];
    const ramMetrics = (await this.SelectedServer.GetSystemMetric("ram", { limit_group: 1 })) || [];
    const fileMetrics = (await this.SelectedServer.GetSystemMetric("file", { limit_group: 1 })) || [];

    // CPU metric card
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

    // RAM metric card
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

    // File metric card
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

    // File table
    try {
      const $fileTable = this.$DashboardContainer.find(`.dashboard-table.file-table`);
      const $fileTableTbody = $fileTable.find(".table-data tbody");
      $fileTableTbody.empty();

      for (const fileMetric of fileMetrics) {
        const [usedValue, usedValueUnits] = this.#FormatBytes(fileMetric.used);
        const [freeValue, freeValueUnits] = this.#FormatBytes(fileMetric.free);
        const [totalValue, totalValueUnits] = this.#FormatBytes(fileMetric.total);

        const $newRow = $(`<tr>
                             <td class="td-file-path"></td>
                             <td class="td-file-used"></td>
                             <td class="td-file-free"></td>
                             <td class="td-file-total"></td>
                           </tr>`);

        $newRow.find(".td-file-path").text(fileMetric.path);
        $newRow.find(".td-file-used").text(`${usedValue}${usedValueUnits}`);
        $newRow.find(".td-file-free").text(`${freeValue}${freeValueUnits}`);
        $newRow.find(".td-file-total").text(`${totalValue}${totalValueUnits}`);

        $fileTableTbody.append($newRow);
      }
    } catch (err) {
      console.error(`Error getting file metric: ${err}`);
    }

    // CPU utilization chart
    try {
      const lastCpuMetrics = (await this.SelectedServer.GetSystemMetric("cpu", { limit_group: 25 })) || [];
      const points = this.MapCpuMetricsToChartPoints(lastCpuMetrics);
      this.UpdateCpuChart({ points });
    } catch (err) {
      console.error(`Error updating CPU utilization chart: ${err}`);
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

    const cpuContainer = this.$DashboardContainer.find(`.dashboard-graph.graph-cpu .cpu-graph`)[0];
    const cpuCard = this.$DashboardContainer.find(`.dashboard-graph.graph-cpu`)[0];

    this.CpuChart = this.CreateCpuChart(cpuContainer);

    const resizeObserver = new ResizeObserver(() => {
      this.CpuChart.resize();
    });

    resizeObserver.observe(cpuCard);
    this.CpuChart._resizeObserver = resizeObserver;

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
    this.UpdateSelectedServer();
    await this.UpdateDashboard();
  }
}
