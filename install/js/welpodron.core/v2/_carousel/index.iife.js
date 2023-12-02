this.window = this.window || {};
(function (exports) {
    'use strict';

    //! TODO: v3 Добавить поддержку событий
    //! TODO: v3 Добавить поддержку стрелок
    const MODULE_BASE = 'carousel';
    const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
    const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
    const ATTRIBUTE_ITEM = `${ATTRIBUTE_BASE}-item`;
    const ATTRIBUTE_ITEM_ACTIVE = `${ATTRIBUTE_ITEM}-active`;
    const ATTRIBUTE_ITEM_TRANSLATING_FROM_LEFT = `${ATTRIBUTE_ITEM}-translating-from-left`;
    const ATTRIBUTE_ITEM_TRANSLATING_FROM_RIGHT = `${ATTRIBUTE_ITEM}-translating-from-right`;
    const ATTRIBUTE_ITEM_TRANSLATING_TO_LEFT = `${ATTRIBUTE_ITEM}-translating-to-left`;
    const ATTRIBUTE_ITEM_TRANSLATING_TO_RIGHT = `${ATTRIBUTE_ITEM}-translating-to-right`;
    const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
    const ATTRIBUTE_CONTROL_ACTIVE = `${ATTRIBUTE_CONTROL}-active`;
    const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
    const ATTRIBUTE_ACTION_ARGS = `${ATTRIBUTE_ACTION}-args`;
    const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;
    // FOR MINIFICATION PURPOSES
    const DEFAULT_EVENT_TOUCHSTART = 'touchstart';
    const DEFAULT_EVENT_TOUCHMOVE = 'touchmove';
    const DEFAULT_EVENT_TOUCHEND = 'touchend';
    const DEFAULT_EVENT_CLICK = 'click';
    // data-carousel-id
    // data-carousel-item-id
    // data-carousel-item-active
    class CarouselItem {
        supportedActions = ['hide', 'show'];
        carousel;
        element;
        constructor({ element, carousel, config = {} }) {
            this.element = element;
            this.carousel = carousel;
        }
        clearAttributes = () => {
            this.element.removeAttribute(ATTRIBUTE_ITEM_TRANSLATING_FROM_LEFT);
            this.element.removeAttribute(ATTRIBUTE_ITEM_TRANSLATING_FROM_RIGHT);
            this.element.removeAttribute(ATTRIBUTE_ITEM_TRANSLATING_TO_RIGHT);
            this.element.removeAttribute(ATTRIBUTE_ITEM_TRANSLATING_TO_LEFT);
        };
        show = ({ args, event }) => {
            // args is direction
            if (this.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) != null) {
                return;
            }
            this.element.setAttribute(ATTRIBUTE_ITEM_ACTIVE, '');
            this.clearAttributes();
            document
                .querySelectorAll(`[${ATTRIBUTE_ACTION_ARGS}="${this.element.getAttribute(`${ATTRIBUTE_ITEM}`)}"][${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(`${ATTRIBUTE_BASE_ID}`)}"][${ATTRIBUTE_CONTROL}]`)
                .forEach((control) => {
                control.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, '');
            });
            if (args === 'right') {
                this.element.setAttribute(ATTRIBUTE_ITEM_TRANSLATING_FROM_LEFT, '');
                this.element.offsetTop;
                this.element.removeAttribute(ATTRIBUTE_ITEM_TRANSLATING_FROM_LEFT);
            }
            else if (args === 'left') {
                this.element.setAttribute(ATTRIBUTE_ITEM_TRANSLATING_FROM_RIGHT, '');
                this.element.offsetTop;
                this.element.removeAttribute(ATTRIBUTE_ITEM_TRANSLATING_FROM_RIGHT);
            }
        };
        hide = ({ args, event }) => {
            if (this.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) == null) {
                return;
            }
            this.element.removeAttribute(ATTRIBUTE_ITEM_ACTIVE);
            this.clearAttributes();
            document
                .querySelectorAll(`[${ATTRIBUTE_ACTION_ARGS}="${this.element.getAttribute(`${ATTRIBUTE_ITEM}`)}"][${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(`${ATTRIBUTE_BASE_ID}`)}"][${ATTRIBUTE_CONTROL}]`)
                .forEach((control) => {
                control.removeAttribute(ATTRIBUTE_CONTROL_ACTIVE);
            });
            if (args === 'right') {
                this.element.setAttribute(ATTRIBUTE_ITEM_TRANSLATING_TO_RIGHT, '');
            }
            else if (args === 'left') {
                this.element.setAttribute(ATTRIBUTE_ITEM_TRANSLATING_TO_LEFT, '');
            }
        };
    }
    class Carousel {
        supportedActions = ['show'];
        element;
        touchStartX = 0;
        touchDeltaX = 0;
        swipeThreshold = 45;
        items = [];
        currentItemIndex = -1;
        nextItemIndex = -1;
        constructor({ element, config = {} }) {
            this.element = element;
            document.addEventListener(DEFAULT_EVENT_CLICK, this.handleDocumentClick);
            this.element.addEventListener(DEFAULT_EVENT_TOUCHSTART, this.handleElementTouchStart, {
                passive: true,
            });
        }
        handleDocumentClick = (event) => {
            let { target } = event;
            if (!target) {
                return;
            }
            target = target.closest(`[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(`${ATTRIBUTE_BASE_ID}`)}"][${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}]`);
            if (!target) {
                return;
            }
            const action = target.getAttribute(ATTRIBUTE_ACTION);
            const actionArgs = target.getAttribute(ATTRIBUTE_ACTION_ARGS);
            const actionFlush = target.getAttribute(ATTRIBUTE_ACTION_FLUSH);
            if (!actionFlush) {
                event.preventDefault();
            }
            if (!action || !this.supportedActions.includes(action)) {
                return;
            }
            const actionFunc = this[action];
            if (actionFunc instanceof Function) {
                return actionFunc({
                    args: actionArgs,
                    event,
                });
            }
        };
        handleElementTouchStart = (event) => {
            this.element.addEventListener(DEFAULT_EVENT_TOUCHEND, this.handleElementTouchEnd, {
                once: true,
            });
            this.element.addEventListener(DEFAULT_EVENT_TOUCHMOVE, this.handleElementTouchMove, {
                passive: true,
            });
            this.touchStartX = event.touches[0].clientX;
        };
        handleElementTouchMove = (event) => {
            this.touchDeltaX =
                event.touches && event.touches.length > 1
                    ? 0
                    : event.touches[0].clientX - this.touchStartX;
        };
        handleElementTouchEnd = (event) => {
            this.element.removeEventListener(DEFAULT_EVENT_TOUCHMOVE, this.handleElementTouchMove);
            const absDeltaX = Math.abs(this.touchDeltaX);
            if (absDeltaX > this.swipeThreshold) {
                // if absDeltaX / this.touchDeltaX < 0 slide to left
                // if absDeltaX / this.touchDeltaY > 0 slide to right
                this.show({
                    args: absDeltaX / this.touchDeltaX < 0 ? 'next' : 'prev',
                    event,
                });
            }
            this.touchDeltaX = 0;
        };
        getNextItem = ({ index }) => {
            // next to left
            // prev to right
            // get next and prev are cycled
            // before and after is not
            if (!this.items) {
                return;
            }
            if (this.currentItemIndex === -1) {
                this.currentItemIndex = this.items.findIndex((item) => {
                    return item.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) != null;
                });
            }
            if (this.currentItemIndex === -1) {
                return;
            }
            if (index === 'next') {
                this.nextItemIndex = (this.currentItemIndex + 1) % this.items.length;
                return;
            }
            if (index === 'prev') {
                this.nextItemIndex =
                    (this.currentItemIndex + this.items.length - 1) % this.items.length;
                return;
            }
            this.nextItemIndex = this.items.findIndex((item) => {
                return item.element.getAttribute(ATTRIBUTE_ITEM) === index;
            });
        };
        getNextDirection = () => {
            if (this.nextItemIndex === -1 || this.currentItemIndex === -1) {
                return;
            }
            if (this.nextItemIndex === this.currentItemIndex) {
                return;
            }
            const firstIndex = 0;
            const lastIndex = this.items.length - 1;
            if (this.nextItemIndex === lastIndex &&
                this.currentItemIndex === firstIndex) {
                return 'right';
            }
            if (this.nextItemIndex === firstIndex &&
                this.currentItemIndex === lastIndex) {
                return 'left';
            }
            return this.nextItemIndex > this.currentItemIndex ? 'left' : 'right';
        };
        show = ({ args, event }) => {
            if (!args) {
                return;
            }
            const carouselId = this.element.getAttribute(ATTRIBUTE_BASE_ID);
            if (!carouselId) {
                return;
            }
            const items = this.element.querySelectorAll(`[${ATTRIBUTE_BASE_ID}="${carouselId}"][${ATTRIBUTE_ITEM}]`);
            if (!items) {
                return;
            }
            this.items = [...items].map((element) => {
                return new CarouselItem({
                    element: element,
                    carousel: this,
                });
            });
            this.getNextItem({ index: args });
            if (this.nextItemIndex === -1 || this.currentItemIndex === -1) {
                return;
            }
            const direction = this.getNextDirection();
            if (!direction) {
                return;
            }
            this.items[this.currentItemIndex].hide({ args: direction, event });
            this.items[this.nextItemIndex].show({ args: direction, event });
            this.currentItemIndex = this.nextItemIndex;
        };
    }

    exports.carousel = Carousel;
    exports.carouselItem = CarouselItem;

})(this.window.welpodron = this.window.welpodron || {});
//# sourceMappingURL=index.iife.js.map
