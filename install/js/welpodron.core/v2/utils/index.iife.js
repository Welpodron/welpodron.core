this.window = this.window || {};
this.window.welpodron = this.window.welpodron || {};
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

    exports.deferred = deferred;
    exports.sleep = sleep;

})(this.window.welpodron.utils = this.window.welpodron.utils || {});
