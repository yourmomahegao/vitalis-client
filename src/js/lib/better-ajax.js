class BetterAjax {
  constructor(url = "", data = {}, method = "POST", headers = {}, dataType = "json", timeout = 5000) {
    this.url = url;
    this.data = data;
    this.method = method;
    this.headers = headers;
    this.dataType = dataType;
    this.timeout = timeout;
  }

  /**
   *Runs async query
   *
   * @memberof BetterAjax
   */
  async Run() {
    const self = this;
    const currentDate = Date.now();

    let promise = new Promise(function (resolve, reject) {
      $.ajax({
        type: self.method,
        url: self.url,
        data: self.data,
        headers: self.headers,
        dataType: self.dataType,
        timeout: self.timeout,
        success: function (response) {
          resolve([true, response]);
        },
        error: function (response) {
          resolve([false, response]);
        },
      });
    });

    return promise;
  }
}

/* -------------------------------------

$(async function () {
    const betterAjax = new BetterAjax("/api/database/get_customers/", {});
    const [ajaxStatus, response] = await betterAjax.Run();
});

------------------------------------- */
