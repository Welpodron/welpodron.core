"use strict";
((window) => {
    if (!window.welpodron) {
        window.welpodron = {};
    }
    window.welpodron.utils = {};
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
    window.welpodron.utils.deferred = deferred;
    window.welpodron.utils.sleep = sleep;
})(window);
//# sourceMappingURL=script.js.map