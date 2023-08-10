"use strict";
(() => {
    if (window.welpodron && window.welpodron.animate) {
        // data-tabs-id
        // data-tabs-item-id
        // data-tabs-item-active
        class TabsItem {
            supportedActions = ["hide", "show"];
            tabs;
            element;
            animation = null;
            constructor({ element, tabs, config = {} }) {
                this.element = element;
                this.tabs = tabs;
            }
            show = async ({ args, event }) => {
                if (this.animation) {
                    window.clearTimeout(this.animation.timer);
                }
                if (this.element.getAttribute("data-w-tabs-item-active") != null) {
                    return;
                }
                // debugger;
                this.element.setAttribute("data-w-tabs-item-active", "");
                this.element.style.opacity = `0`;
                // Магичесий хак
                this.element.scrollHeight;
                this.animation = window.welpodron.animate({
                    element: this.element,
                    callback: () => {
                        this.element.style.opacity = `1`;
                    },
                });
                await this.animation?.promise;
                this.element.style.removeProperty("opacity");
                this.animation = null;
            };
            hide = async ({ args, event }) => {
                if (this.animation) {
                    window.clearTimeout(this.animation.timer);
                }
                if (this.element.getAttribute("data-w-tabs-item-active") == null) {
                    return;
                }
                this.animation = window.welpodron.animate({
                    element: this.element,
                    callback: () => {
                        this.element.removeAttribute("data-w-tabs-item-active");
                    },
                });
                await this.animation?.promise;
                this.animation = null;
            };
        }
        class Tabs {
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
                target = target.closest(`[data-w-tabs-id][data-w-tabs-action]`);
                if (!target) {
                    return;
                }
                const tabsId = target.getAttribute("data-w-tabs-id");
                if (tabsId !== this.element.getAttribute("data-w-tabs-id")) {
                    return;
                }
                const action = target.getAttribute("data-w-tabs-action");
                const actionArgs = target.getAttribute("data-w-tabs-action-args");
                const actionFlush = target.getAttribute("data-w-tabs-action-flush");
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
                const tabsId = this.element.getAttribute("data-w-tabs-id");
                if (!tabsId) {
                    return;
                }
                const items = document.querySelectorAll(`[data-w-tabs-id="${tabsId}"][data-w-tabs-item-id]`);
                if (!items) {
                    return;
                }
                const item = [...items].find((element) => {
                    return element.getAttribute("data-w-tabs-item-id") === args;
                });
                if (!item) {
                    return;
                }
                for (let _item of this._items) {
                    if (_item.animation) {
                        window.clearTimeout(_item.animation.timer);
                    }
                }
                this._items = [...items].map((element) => {
                    return new TabsItem({
                        element: element,
                        tabs: this,
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
        window.welpodron.tabs = Tabs;
    }
})();
