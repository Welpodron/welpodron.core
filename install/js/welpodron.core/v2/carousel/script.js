"use strict";
((window) => {
    if (window.welpodron && window.welpodron.animate) {
        //! TODO: v3 Добавить поддержку событий
        //! TODO: v3 Добавить поддержку стрелок
        if (window.welpodron.carousel) {
            return;
        }
        const MODULE_BASE = "carousel";
        const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
        const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
        const ATTRIBUTE_ITEM = `${ATTRIBUTE_BASE}-item`;
        const ATTRIBUTE_ITEM_ID = `${ATTRIBUTE_ITEM}-id`;
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
        // data-carousel-id
        // data-carousel-item-id
        // data-carousel-item-active
        class CarouselItem {
            supportedActions = ["hide", "show"];
            carousel;
            element;
            animation = null;
            constructor({ element, carousel, config = {} }) {
                this.element = element;
                this.carousel = carousel;
            }
            show = async ({ args, event }) => {
                if (this.animation) {
                    window.clearTimeout(this.animation.timer);
                }
                // args is direction
                if (this.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) != null) {
                    return;
                }
                if (args === "right") {
                    this.element.setAttribute(ATTRIBUTE_ITEM_TRANSLATING_FROM_LEFT, "");
                }
                else if (args === "left") {
                    this.element.setAttribute(ATTRIBUTE_ITEM_TRANSLATING_FROM_RIGHT, "");
                }
                this.element.setAttribute(ATTRIBUTE_ITEM_ACTIVE, "");
                const controls = document.querySelectorAll(`[${ATTRIBUTE_ACTION_ARGS}="${this.element.getAttribute(`${ATTRIBUTE_ITEM_ID}`)}"]`);
                controls.forEach((control) => {
                    control.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, "");
                });
                // Магичесий хак
                this.element.scrollHeight;
                this.animation = window.welpodron.animate({
                    element: this.element,
                    callback: () => {
                        if (args === "right") {
                            this.element.removeAttribute(ATTRIBUTE_ITEM_TRANSLATING_FROM_LEFT);
                        }
                        else if (args === "left") {
                            this.element.removeAttribute(ATTRIBUTE_ITEM_TRANSLATING_FROM_RIGHT);
                        }
                    },
                });
                await this.animation?.promise;
                this.animation = null;
            };
            hide = async ({ args, event }) => {
                if (this.animation) {
                    window.clearTimeout(this.animation.timer);
                }
                if (this.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) == null) {
                    return;
                }
                this.element.style.display = `block`;
                this.animation = window.welpodron.animate({
                    element: this.element,
                    callback: () => {
                        if (args === "right") {
                            this.element.setAttribute(ATTRIBUTE_ITEM_TRANSLATING_TO_RIGHT, "");
                        }
                        else if (args === "left") {
                            this.element.setAttribute(ATTRIBUTE_ITEM_TRANSLATING_TO_LEFT, "");
                        }
                        this.element.removeAttribute(ATTRIBUTE_ITEM_ACTIVE);
                        const controls = document.querySelectorAll(`[${ATTRIBUTE_ACTION_ARGS}="${this.element.getAttribute(`${ATTRIBUTE_ITEM_ID}`)}"]`);
                        controls.forEach((control) => {
                            control.removeAttribute(ATTRIBUTE_CONTROL_ACTIVE);
                        });
                    },
                });
                await this.animation?.promise;
                this.element.style.removeProperty("display");
                if (args === "right") {
                    this.element.removeAttribute(ATTRIBUTE_ITEM_TRANSLATING_TO_RIGHT);
                }
                else if (args === "left") {
                    this.element.removeAttribute(ATTRIBUTE_ITEM_TRANSLATING_TO_LEFT);
                }
                this.animation = null;
            };
        }
        class Carousel {
            supportedActions = ["show"];
            element;
            touchStartX = 0;
            touchDeltaX = 0;
            swipeThreshold = 45;
            items = [];
            currentItemIndex = -1;
            nextItemIndex = -1;
            constructor({ element, config = {} }) {
                this.element = element;
                document.removeEventListener("click", this.handleDocumentClick);
                document.addEventListener("click", this.handleDocumentClick);
                this.element.removeEventListener("touchstart", this.handleElementTouchStart);
                this.element.addEventListener("touchstart", this.handleElementTouchStart, {
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
                this.element.addEventListener("touchend", this.handleElementTouchEnd, {
                    once: true,
                });
                this.element.removeEventListener("touchmove", this.handleElementTouchMove);
                this.element.addEventListener("touchmove", this.handleElementTouchMove);
                this.touchStartX = event.touches[0].clientX;
            };
            handleElementTouchMove = (event) => {
                this.touchDeltaX =
                    event.touches && event.touches.length > 1
                        ? 0
                        : event.touches[0].clientX - this.touchStartX;
            };
            handleElementTouchEnd = (event) => {
                this.element.removeEventListener("touchmove", this.handleElementTouchMove);
                const absDeltaX = Math.abs(this.touchDeltaX);
                if (absDeltaX > this.swipeThreshold) {
                    // if absDeltaX / this.touchDeltaX < 0 slide to left
                    // if absDeltaX / this.touchDeltaY > 0 slide to right
                    this.show({
                        args: absDeltaX / this.touchDeltaX < 0 ? "next" : "prev",
                        event,
                    });
                }
                this.touchDeltaX = 0;
            };
            getNextItem = async ({ index }) => {
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
                if (index === "next") {
                    this.nextItemIndex = (this.currentItemIndex + 1) % this.items.length;
                    return;
                }
                if (index === "prev") {
                    this.nextItemIndex =
                        (this.currentItemIndex + this.items.length - 1) % this.items.length;
                    return;
                }
                this.nextItemIndex = this.items.findIndex((item) => {
                    return item.element.getAttribute(ATTRIBUTE_ITEM_ID) === index;
                });
            };
            getNextDirection = async () => {
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
                    return "right";
                }
                if (this.nextItemIndex === firstIndex &&
                    this.currentItemIndex === lastIndex) {
                    return "left";
                }
                return this.nextItemIndex > this.currentItemIndex ? "left" : "right";
            };
            show = async ({ args, event }) => {
                if (!args) {
                    return;
                }
                const carouselId = this.element.getAttribute(ATTRIBUTE_BASE_ID);
                if (!carouselId) {
                    return;
                }
                const items = this.element.querySelectorAll(`[${ATTRIBUTE_BASE_ID}="${carouselId}"][${ATTRIBUTE_ITEM_ID}]`);
                if (!items) {
                    return;
                }
                for (let _item of this.items) {
                    if (_item.animation) {
                        window.clearTimeout(_item.animation.timer);
                        _item.animation.promise.resolve();
                    }
                }
                this.items = [...items].map((element) => {
                    return new CarouselItem({
                        element: element,
                        carousel: this,
                    });
                });
                await this.getNextItem({ index: args });
                if (this.nextItemIndex === -1 || this.currentItemIndex === -1) {
                    return;
                }
                const direction = await this.getNextDirection();
                if (!direction) {
                    return;
                }
                const promises = [];
                for (let i = 0; i < this.items.length; i++) {
                    const item = this.items[i];
                    if (i === this.currentItemIndex) {
                        promises.push(item.hide({ args: direction, event }));
                    }
                    else if (i === this.nextItemIndex) {
                        promises.push(item.show({ args: direction, event }));
                    }
                    else {
                        promises.push(item.hide({ args: direction, event }));
                    }
                }
                this.currentItemIndex = this.nextItemIndex;
                await Promise.allSettled(promises);
            };
        }
        window.welpodron.carousel = Carousel;
    }
})(window);
//# sourceMappingURL=script.js.map