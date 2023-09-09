((window) => {
  if (!window.welpodron) {
    window.welpodron = {};
  }

  window.welpodron.utils = {};

  const deferred = <T = unknown>(): Promise<T> & {
    resolve: (value?: T | PromiseLike<T>) => void;
  } => {
    let resolver, promise;
    promise = new Promise<T>((resolve, reject) => {
      resolver = resolve;
    });
    (
      promise as Promise<T> & { resolve: (value: T | PromiseLike<T>) => void }
    ).resolve = resolver as unknown as (value: T | PromiseLike<T>) => void;
    return promise as Promise<T> & {
      resolve: (value?: T | PromiseLike<T>) => void;
    };
  };

  const sleep = ({ ms }: { ms: number }) => {
    const promise = deferred();

    setTimeout(() => {
      promise.resolve();
    }, ms);

    return promise;
  };

  window.welpodron.utils.deferred = deferred;
  window.welpodron.utils.sleep = sleep;
})(window);
