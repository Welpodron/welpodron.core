this.window = this.window || {};
(function (exports, animate) {
    'use strict';

    const MODULE_BASE = 'tabs';
    const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
    const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
    const ATTRIBUTE_ITEM = `${ATTRIBUTE_BASE}-item`;
    const ATTRIBUTE_ITEM_ID = `${ATTRIBUTE_ITEM}-id`;
    const ATTRIBUTE_ITEM_ACTIVE = `${ATTRIBUTE_ITEM}-active`;
    const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
    const ATTRIBUTE_CONTROL_ACTIVE = `${ATTRIBUTE_CONTROL}-active`;
    const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
    const ATTRIBUTE_ACTION_ARGS = `${ATTRIBUTE_ACTION}-args`;
    const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;
    // data-tabs-id
    // data-tabs-item-id
    // data-tabs-item-active
    class TabsItem {
        supportedActions = ['hide', 'show'];
        tabs;
        element;
        animation = null;
        constructor({ element, tabs, config = {} }) {
            this.element = element;
            this.tabs = tabs;
        }
        show = async ({ args, event }) => {
            if (this.animation) {
                clearTimeout(this.animation.timer);
            }
            if (this.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) != null) {
                return;
            }
            this.element.setAttribute(ATTRIBUTE_ITEM_ACTIVE, '');
            const controls = document.querySelectorAll(`[${ATTRIBUTE_ACTION_ARGS}="${this.element.getAttribute(`${ATTRIBUTE_ITEM_ID}`)}"]`);
            controls.forEach((control) => {
                control.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, '');
            });
            this.element.style.opacity = `0`;
            // Магичесий хак
            this.element.scrollHeight;
            this.animation = animate.animate({
                element: this.element,
                callback: () => {
                    this.element.style.opacity = `1`;
                },
            });
            await this.animation?.promise;
            this.element.style.removeProperty('opacity');
            this.animation = null;
        };
        hide = async ({ args, event }) => {
            if (this.animation) {
                clearTimeout(this.animation.timer);
            }
            if (this.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) == null) {
                return;
            }
            this.animation = animate.animate({
                element: this.element,
                callback: () => {
                    this.element.removeAttribute(ATTRIBUTE_ITEM_ACTIVE);
                    const controls = document.querySelectorAll(`[${ATTRIBUTE_ACTION_ARGS}="${this.element.getAttribute(`${ATTRIBUTE_ITEM_ID}`)}"]`);
                    controls.forEach((control) => {
                        control.removeAttribute(ATTRIBUTE_CONTROL_ACTIVE);
                    });
                },
            });
            await this.animation?.promise;
            this.animation = null;
        };
    }
    class Tabs {
        supportedActions = ['show'];
        element;
        _items = [];
        constructor({ element, config = {} }) {
            this.element = element;
            document.addEventListener('click', this.handleDocumentClick);
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
        show = async ({ args, event }) => {
            if (!args) {
                return;
            }
            const tabsId = this.element.getAttribute(ATTRIBUTE_BASE_ID);
            if (!tabsId) {
                return;
            }
            const items = this.element.querySelectorAll(`[${ATTRIBUTE_BASE_ID}="${tabsId}"][${ATTRIBUTE_ITEM_ID}]`);
            if (!items) {
                return;
            }
            const item = [...items].find((element) => {
                return element.getAttribute(ATTRIBUTE_ITEM_ID) === args;
            });
            if (!item) {
                return;
            }
            for (let _item of this._items) {
                if (_item.animation) {
                    clearTimeout(_item.animation.timer);
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

    exports.tabs = Tabs;
    exports.tabsItem = TabsItem;

})(this.window.welpodron = this.window.welpodron || {}, window.welpodron);
//# sourceMappingURL=index.iife.js.map
