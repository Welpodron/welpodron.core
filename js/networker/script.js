(function (window) {
  if (window.welpodron || window.welpodron.core) {
    window.welpodron.request = function (path, config = { get: 'json' }) {
      this.path = path;
      this.required = config.get || config.required;
      this.accept =
        this.required === 'json'
          ? { Accept: 'application/json; charset=UTF-8' }
          : { Accept: 'text/html; charset=UTF-8' };

      this.before = config.before || (() => void 0);
      this.onResponse = config.onResponse || (() => void 0);
      this.after = config.after || (() => void 0);

      this.finished = window.welpodron.core.deferred();
    };

    window.welpodron.request.prototype.post = function (config = {}) {
      return this.send({ ...config, method: 'POST' });
    };

    window.welpodron.request.prototype.get = function (config = {}) {
      return this.send({ ...config, method: 'GET' });
    };

    window.welpodron.request.prototype.send = function (config = {}) {
      // TODO: Убрать из GET body!
      let options = {
        method: config.method,
        headers: { ...config.headers, ...this.accept },
        body: config.body
      };

      options = { ...config, ...options };

      this.before(this.path, options);

      const request = fetch(this.path, options);

      return new Promise((resolve, reject) => {
        request
          .then((response) => {
            this.onResponse(response);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            return this.required === 'json' ? response.json() : response.text();
          })
          .then((data) => {
            this.after(data);

            this.finished.resolve();

            resolve(data);
          })
          .catch((err) => {
            this.after(err);

            this.finished.resolve();

            reject(err);
          });
      });
    };
  }
})(window);
