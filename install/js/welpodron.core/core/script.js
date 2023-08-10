(function (window) {
  window.welpodron = {};
  window.welpodron.core = {};

  window.welpodron.core.uuid = (prefix = '') =>
    prefix + Math.random().toString(36).slice(3);

  window.welpodron.core.deferred = () => {
    let resolvement,
      promise = new Promise((innerResolve) => {
        resolvement = innerResolve;
      });
    promise.resolve = resolvement;
    return promise;
  };
})(window);
