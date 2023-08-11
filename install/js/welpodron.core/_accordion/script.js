"use strict";
((window) => {
    if (window.welpodron && window.welpodron.animate) {
        //! TODO: v3 Добавить поддержку событий
        //! TODO: Возможно стоит https://css-tricks.com/how-to-animate-the-details-element/
        if (window.welpodron.accordion) {
            return;
        }
        const MODULE_BASE = "accordion";
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
        class AccordionItem {
            supportedActions = ["hide", "show"];
            accordion;
            element;
            animation = null;
            constructor({ element, accordion, config = {} }) {
                this.element = element;
                this.accordion = accordion;
            }
            show = async ({ args, event }) => {
                if (this.animation) {
                    window.clearTimeout(this.animation.timer);
                }
                if (this.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) != null) {
                    return;
                }
                this.element.style.height = `0px`;
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
                        this.element.style.height = this.element.scrollHeight + "px";
                    },
                });
                await this.animation?.promise;
                this.element.style.removeProperty("height");
                this.animation = null;
            };
            hide = async ({ args, event }) => {
                if (this.animation) {
                    window.clearTimeout(this.animation.timer);
                }
                if (this.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) == null) {
                    return;
                }
                this.element.style.height = this.element.scrollHeight + "px";
                this.element.style.display = "block";
                this.animation = window.welpodron.animate({
                    element: this.element,
                    callback: () => {
                        this.element.style.height = this.element.scrollHeight + "px";
                        this.element.removeAttribute(ATTRIBUTE_ITEM_ACTIVE);
                        const controls = document.querySelectorAll(`[${ATTRIBUTE_ACTION_ARGS}="${this.element.getAttribute(`${ATTRIBUTE_ITEM_ID}`)}"]`);
                        controls.forEach((control) => {
                            control.removeAttribute(ATTRIBUTE_CONTROL_ACTIVE);
                        });
                        this.element.style.height = `0px`;
                    },
                });
                await this.animation?.promise;
                this.element.style.removeProperty("display");
                this.element.style.removeProperty("height");
                this.animation = null;
            };
        }
        class Accordion {
            supportedActions = ["show"];
            element;
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
                const accordionId = this.element.getAttribute(ATTRIBUTE_BASE_ID);
                if (!accordionId) {
                    return;
                }
                const items = this.element.querySelectorAll(`[${ATTRIBUTE_BASE_ID}="${accordionId}"][${ATTRIBUTE_ITEM_ID}]`);
                if (!items) {
                    return;
                }
                const item = [...items].find((element) => {
                    return element.getAttribute(ATTRIBUTE_ITEM_ID) === args;
                });
                if (!item) {
                    return;
                }
                const promises = [];
                for (let _item of items) {
                    const itemInstance = new AccordionItem({
                        element: _item,
                        accordion: this,
                    });
                    if (_item === item) {
                        promises.push(itemInstance.show({ args, event }));
                    }
                    else {
                        promises.push(itemInstance.hide({ args, event }));
                    }
                }
                await Promise.allSettled(promises);
            };
        }
        window.welpodron.accordion = Accordion;
    }
})(window);
