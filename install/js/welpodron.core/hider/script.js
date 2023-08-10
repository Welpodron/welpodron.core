"use strict";
(() => {
    class Hider {
        static #SUPPORTED_ACTIONS = ["toggle", "show", "close"];
        element;
        outsideControls;
        insideControls;
        observer;
        constructor({ element, config = {} }) {
            this.element = element;
            this.outsideControls = [
                ...document.querySelectorAll(`[data-hider-action][data-hider-id="${this.element.id}"]:not(#${this.element.id} *)`),
            ];
            this.insideControls = [
                ...this.element.querySelectorAll(`[data-hider-action][data-hider-id="${this.element.id}"]`),
            ];
            // track opening
            this.observer = new MutationObserver((mutations, observer) => {
                mutations.forEach(async (mutation) => {
                    if (mutation.attributeName === "data-hider-active") {
                        const isOpen = this.element.hasAttribute("data-hider-active");
                        if (!isOpen) {
                            this.insideControls.forEach((control) => {
                                control.removeEventListener("click", this.#handleControlClick);
                            });
                            return;
                        }
                        // set focus
                        const focusTarget = this.element.querySelector("[autofocus]");
                        if (focusTarget) {
                            focusTarget.focus();
                        }
                        else {
                            const focusable = this.element.querySelectorAll('button:not([disabled]):not(:scope [data-popover] *), [href]:not(:scope [data-popover] *), input:not([type="hidden"]):not([disabled]):not(:scope [data-popover] *), select:not([disabled]):not(:scope [data-popover] *), textarea:not([disabled]):not(:scope [data-popover] *), [tabindex]:not([tabindex="-1"]):not(:scope [data-popover] *)');
                            focusable[0]?.focus();
                        }
                        this.insideControls.forEach((control) => {
                            control.removeEventListener("click", this.#handleControlClick);
                            control.addEventListener("click", this.#handleControlClick);
                        });
                    }
                });
            });
            this.observer.observe(this.element, {
                attributes: true,
            });
            this.outsideControls.forEach((control) => {
                control.removeEventListener("click", this.#handleControlClick);
                control.addEventListener("click", this.#handleControlClick);
            });
        }
        toggle = () => {
            if (this.element.hasAttribute("data-hider-active")) {
                return this.close();
            }
            return this.show();
        };
        close = () => {
            this.element.removeAttribute("data-hider-active");
        };
        show = () => {
            this.element.setAttribute("data-hider-active", "");
        };
        #handleControlClick = (evt) => {
            evt.preventDefault();
            const { currentTarget } = evt;
            const action = currentTarget.getAttribute("data-hider-action");
            const actionArgs = currentTarget.getAttribute("data-hider-action-args");
            if (!Hider.#SUPPORTED_ACTIONS.includes(action))
                return;
            const actionFunc = this[action];
            if (actionFunc instanceof Function)
                return actionFunc({
                    args: actionArgs,
                    evt,
                });
        };
    }
    if (window.welpodron == null) {
        window.welpodron = {};
    }
    window.welpodron.hider = Hider;
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-hider]").forEach((element) => {
            new Hider({ element: element });
        });
    }, {
        once: true,
    });
})();
