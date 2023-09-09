"use strict";
(() => {
    class Dialog {
        static #SUPPORTED_ACTIONS = ["show", "close"];
        element;
        once;
        force;
        outsideControls;
        insideControls;
        dialogAttrObserver;
        constructor({ element, config = {} }) {
            this.element = element;
            this.once =
                config.once ?? this.element.getAttribute("data-dialog-once") != null;
            this.force =
                config.force ?? this.element.getAttribute("data-dialog-force") != null;
            this.outsideControls = [
                ...document.querySelectorAll(`[data-dialog-action][data-dialog-id="${this.element.id}"]:not(#${this.element.id} *)`),
            ];
            this.insideControls = [
                ...this.element.querySelectorAll(`[data-dialog-action][data-dialog-id="${this.element.id}"]`),
            ];
            // track opening
            this.dialogAttrObserver = new MutationObserver((mutations, observer) => {
                mutations.forEach(async (mutation) => {
                    if (mutation.attributeName === "open") {
                        const dialog = mutation.target;
                        const isOpen = dialog.hasAttribute("open");
                        if (!isOpen)
                            return;
                        dialog.removeAttribute("inert");
                        // set focus
                        const focusTarget = dialog.querySelector("[autofocus]");
                        if (focusTarget) {
                            focusTarget.focus();
                        }
                        else {
                            const focusable = dialog.querySelectorAll('button:not([disabled]):not(:scope [data-dialog] *), [href]:not(:scope [data-dialog] *), input:not([type="hidden"]):not([disabled]):not(:scope [data-dialog] *), select:not([disabled]):not(:scope [data-dialog] *), textarea:not([disabled]):not(:scope [data-dialog] *), [tabindex]:not([tabindex="-1"]):not(:scope [data-dialog] *)');
                            focusable[0]?.focus();
                        }
                        this.insideControls.forEach((control) => {
                            control.removeEventListener("click", this.#handleControlClick);
                            control.addEventListener("click", this.#handleControlClick);
                        });
                        document.body.style.overflow = "hidden";
                    }
                });
            });
            this.dialogAttrObserver.observe(this.element, {
                attributes: true,
            });
            if (this.element.hasAttribute("open")) {
                this.element.removeAttribute("inert");
            }
            this.element.removeEventListener("close", this.#handleElementClose);
            this.element.addEventListener("close", this.#handleElementClose);
            this.outsideControls.forEach((control) => {
                control.removeEventListener("click", this.#handleControlClick);
                control.addEventListener("click", this.#handleControlClick);
            });
            if (this.force) {
                this.show();
            }
        }
        close = () => {
            this.element.close("dismiss");
        };
        show = () => {
            this.element.showModal();
        };
        #handleControlClick = (evt) => {
            evt.preventDefault();
            const { currentTarget } = evt;
            const action = currentTarget.getAttribute("data-dialog-action");
            const actionArgs = currentTarget.getAttribute("data-dialog-action-args");
            if (!Dialog.#SUPPORTED_ACTIONS.includes(action))
                return;
            const actionFunc = this[action];
            if (actionFunc instanceof Function)
                return actionFunc({
                    args: actionArgs,
                    evt,
                });
        };
        #handleElementClose = ({ currentTarget }) => {
            currentTarget.setAttribute("inert", "");
            const currentlyOpenedDialogs = document.querySelector("dialog[data-dialog][open]");
            if (!currentlyOpenedDialogs) {
                document.body.style.overflow = "";
            }
            this.insideControls.forEach((control) => {
                control.removeEventListener("click", this.#handleControlClick);
            });
            if (this.once) {
                this.outsideControls.forEach((control) => {
                    control.removeEventListener("click", this.#handleControlClick);
                    control.parentNode?.removeChild(control);
                });
                this.element.removeEventListener("close", this.#handleElementClose);
                this.element.parentNode?.removeChild(this.element);
            }
        };
    }
    if (window.welpodron == null) {
        window.welpodron = {};
    }
    window.welpodron.dialog = Dialog;
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("dialog[data-dialog]").forEach((element) => {
            new Dialog({ element: element });
        });
    }, {
        once: true,
    });
})();
//# sourceMappingURL=script.js.map