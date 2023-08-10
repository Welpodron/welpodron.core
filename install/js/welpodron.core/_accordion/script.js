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
            isTranslating = false;
            isActive = false;
            constructor({ element, accordion, config = {} }) {
                this.element = element;
                this.accordion = accordion;
                this.isActive =
                    this.element.getAttribute("data-w-accordion-item-active") != null;
            }
            show = async ({ args, event }) => {
                if (this.isTranslating || this.isActive) {
                    return;
                }
                this.isTranslating = true;
                this.element.style.height = `0px`;
                this.element.style.display = "block";
                // Магичесий хак
                this.element.scrollHeight;
                await window.welpodron.animate({
                    element: this.element,
                    callback: () => {
                        this.element.style.height = this.element.scrollHeight + "px";
                    },
                });
                this.element.setAttribute("data-w-accordion-item-active", "");
                this.element.style.removeProperty("height");
                this.element.style.removeProperty("display");
                this.isTranslating = false;
                this.isActive = true;
            };
            hide = async ({ args, event }) => {
                if (this.isTranslating || !this.isActive) {
                    return;
                }
                this.isTranslating = true;
                this.element.style.height = this.element.scrollHeight + "px";
                this.element.style.display = "block";
                await window.welpodron.animate({
                    element: this.element,
                    callback: () => {
                        this.element.style.height = this.element.scrollHeight + "px";
                        this.element.removeAttribute("data-w-accordion-item-active");
                        this.element.style.height = `0px`;
                    },
                });
                this.element.style.removeProperty("display");
                this.element.style.removeProperty("height");
                this.isTranslating = false;
                this.isActive = false;
            };
        }
        class Accordion {
            supportedActions = ["show"];
            element;
            isTranslating = false;
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
                if (this.isTranslating) {
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
                this.isTranslating = true;
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
                this.isTranslating = false;
            };
        }
        window.welpodron.accordion = Accordion;
    }
})();
