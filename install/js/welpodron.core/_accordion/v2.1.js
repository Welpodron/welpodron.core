"use strict";
(() => {
    if (window.welpodron && window.welpodron.animate) {
        // data-accordion-id
        // data-accordion-item-id
        // data-accordion-item-active
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
                if (this.element.getAttribute("data-w-accordion-item-active") != null) {
                    return;
                }
                this.element.style.height = `0px`;
                this.element.setAttribute("data-w-accordion-item-active", "");
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
                if (this.element.getAttribute("data-w-accordion-item-active") == null) {
                    return;
                }
                this.element.style.height = this.element.scrollHeight + "px";
                this.element.style.display = "block";
                this.animation = window.welpodron.animate({
                    element: this.element,
                    callback: () => {
                        this.element.style.height = this.element.scrollHeight + "px";
                        this.element.removeAttribute("data-w-accordion-item-active");
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
                target = target.closest(`[data-w-accordion-id][data-w-accordion-action]`);
                if (!target) {
                    return;
                }
                const accordionId = target.getAttribute("data-w-accordion-id");
                if (accordionId !== this.element.getAttribute("data-w-accordion-id")) {
                    return;
                }
                const action = target.getAttribute("data-w-accordion-action");
                const actionArgs = target.getAttribute("data-w-accordion-action-args");
                const actionFlush = target.getAttribute("data-w-accordion-action-flush");
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
                const accordionId = this.element.getAttribute("data-w-accordion-id");
                if (!accordionId) {
                    return;
                }
                const items = document.querySelectorAll(`[data-w-accordion-id="${accordionId}"][data-w-accordion-item-id]`);
                if (!items) {
                    return;
                }
                const item = [...items].find((element) => {
                    return element.getAttribute("data-w-accordion-item-id") === args;
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
})();
