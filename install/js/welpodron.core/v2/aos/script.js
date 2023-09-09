"use strict";
((window) => {
    //!Original: https://github.com/michalsnik/aos
    if (!window.welpodron) {
        window.welpodron = {};
    }
    if (!window.welpodron.aos) {
        window.welpodron.aos = {};
    }
    const MODULE_BASE = "aos";
    const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
    const ATTRIBUTE_BASE_DELAY = `${ATTRIBUTE_BASE}-delay`;
    const ATTRIBUTE_BASE_ANIMATED = `${ATTRIBUTE_BASE}-animated`;
    const ATTRIBUTE_BASE_ANIMATING = `${ATTRIBUTE_BASE}-animating`;
    const animate = (element) => {
        const delay = parseInt(element.getAttribute(ATTRIBUTE_BASE_DELAY) ?? "0");
        if (!isNaN(delay) &&
            delay > 0 &&
            !element.hasAttribute(ATTRIBUTE_BASE_ANIMATED) &&
            !element.hasAttribute(ATTRIBUTE_BASE_ANIMATING)) {
            element.setAttribute(ATTRIBUTE_BASE_ANIMATING, "");
            setTimeout(() => {
                element.removeAttribute(ATTRIBUTE_BASE_ANIMATING);
                element.setAttribute(ATTRIBUTE_BASE_ANIMATED, "");
            }, delay);
        }
        else {
            element.removeAttribute(ATTRIBUTE_BASE_ANIMATING);
            element.setAttribute(ATTRIBUTE_BASE_ANIMATED, "");
        }
    };
    const OBSERVER = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.intersectionRatio >= 0.5) {
                observer.unobserve(entry.target);
                animate(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: "0% 50%",
        threshold: 0.5,
    });
    const update = () => {
        OBSERVER.disconnect();
        document
            .querySelectorAll(`[${ATTRIBUTE_BASE}]:not([${ATTRIBUTE_BASE_ANIMATED}]):not([${ATTRIBUTE_BASE_ANIMATING}])`)
            .forEach((element) => {
            OBSERVER.observe(element);
        });
    };
    window.welpodron.aos.observer = OBSERVER;
    window.welpodron.aos.update = update;
    window.welpodron.aos.animate = animate;
})(window);
//# sourceMappingURL=script.js.map