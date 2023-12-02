import { utils } from '../utils/index.js';

const animate = ({ element, callback, }) => {
    const promise = utils.deferred();
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

export { animate };
