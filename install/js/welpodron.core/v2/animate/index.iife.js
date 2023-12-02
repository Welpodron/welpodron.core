this.window = this.window || {};
(function (exports, utils) {
    'use strict';

    const animate = ({ element, callback, }) => {
        const promise = utils.utils.deferred();
        callback();
        const timer = setTimeout(() => {
            element.addEventListener('transitionend', () => {
                promise.resolve();
            }, { once: true });
            element.dispatchEvent(new TransitionEvent('transitionend'));
        }, parseFloat(getComputedStyle(element).transitionDuration) * 1000);
        return {
            promise,
            timer,
        };
    };

    exports.animate = animate;

})(this.window.welpodron = this.window.welpodron || {}, window.welpodron);
//# sourceMappingURL=index.iife.js.map
