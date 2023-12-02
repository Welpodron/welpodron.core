this.window = this.window || {};
(function (exports) {
    'use strict';

    const deferred = () => {
        let resolver, promise;
        promise = new Promise((resolve, reject) => {
            resolver = resolve;
        });
        promise.resolve = resolver;
        return promise;
    };
    const sleep = ({ ms }) => {
        const promise = deferred();
        setTimeout(() => {
            promise.resolve();
        }, ms);
        return promise;
    };
    const utils = {
        deferred,
        sleep,
    };

    exports.utils = utils;

})(this.window.welpodron = this.window.welpodron || {});
//# sourceMappingURL=index.iife.js.map
