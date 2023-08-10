"use strict";
(() => {
    if (window.welpodron && window.welpodron.animate) {
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
                if (this.element.getAttribute("data-w-carousel-item-active") != null) {
                    return;
                }
                // debugger;
                this.element.setAttribute("data-w-carousel-item-translating-from-left", "");
                this.element.setAttribute("data-w-carousel-item-active", "");
                // Магичесий хак
                this.element.scrollHeight;
                this.animation = window.welpodron.animate({
                    element: this.element,
                    callback: () => {
                        this.element.removeAttribute("data-w-carousel-item-translating-from-left");
                    },
                });
                await this.animation?.promise;
                this.animation = null;
            };
            hide = async ({ args, event }) => {
                if (this.animation) {
                    window.clearTimeout(this.animation.timer);
                }
                if (this.element.getAttribute("data-w-carousel-item-active") == null) {
                    return;
                }
                this.element.style.display = `block`;
                this.animation = window.welpodron.animate({
                    element: this.element,
                    callback: () => {
                        this.element.setAttribute("data-w-carousel-item-translating-to-right", "");
                        this.element.removeAttribute("data-w-carousel-item-active");
                    },
                });
                await this.animation?.promise;
                this.element.style.removeProperty("display");
                this.element.removeAttribute("data-w-carousel-item-translating-to-right");
                this.animation = null;
            };
        }
        class Carousel {
            supportedActions = ["show"];
            element;
            _items = [];
            constructor({ element, config = {} }) {
                this.element = element;
                document.removeEventListener("click", this.handleDocumentClick);
                document.addEventListener("click", this.handleDocumentClick);
            }
            handleDocumentClick = (event) => {
                let { target } = event;
                if (!target) {
                    return;
                }
                target = target.closest(`[data-w-carousel-id][data-w-carousel-action]`);
                if (!target) {
                    return;
                }
                const carouselId = target.getAttribute("data-w-carousel-id");
                if (carouselId !== this.element.getAttribute("data-w-carousel-id")) {
                    return;
                }
                const action = target.getAttribute("data-w-carousel-action");
                const actionArgs = target.getAttribute("data-w-carousel-action-args");
                const actionFlush = target.getAttribute("data-w-carousel-action-flush");
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
            show = async ({ args, event }) => {
                if (!args) {
                    return;
                }
                const carouselId = this.element.getAttribute("data-w-carousel-id");
                if (!carouselId) {
                    return;
                }
                const items = document.querySelectorAll(`[data-w-carousel-id="${carouselId}"][data-w-carousel-item-id]`);
                if (!items) {
                    return;
                }
                const item = [...items].find((element) => {
                    return element.getAttribute("data-w-carousel-item-id") === args;
                });
                if (!item) {
                    return;
                }
                for (let _item of this._items) {
                    if (_item.animation) {
                        window.clearTimeout(_item.animation.timer);
                        _item.animation.promise.resolve();
                    }
                }
                this._items = [...items].map((element) => {
                    return new CarouselItem({
                        element: element,
                        carousel: this,
                    });
                });
                const promises = [];
                for (let _item of this._items) {
                    if (_item.element === item) {
                        promises.push(_item.show({ args, event }));
                    }
                    else {
                        promises.push(_item.hide({ args, event }));
                    }
                }
                await Promise.allSettled(promises);
            };
        }
        window.welpodron.carousel = Carousel;
    }
})();
