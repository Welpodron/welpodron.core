"use strict";
(() => {
    class Popover {
        static #SUPPORTED_ACTIONS = ["toggle", "show", "close"];
        element;
        pinned;
        hoverable;
        hoverableLeaveTimeout = null;
        lastAnchor = null;
        outsideControls;
        insideControls;
        dialogAttrObserver;
        constructor({ element, config = {} }) {
            this.element = element;
            this.pinned =
                config.pinned ??
                    this.element.getAttribute("data-popover-pinned") != null;
            this.hoverable =
                config.hoverable ??
                    this.element.getAttribute("data-popover-hoverable") != null;
            this.outsideControls = [
                ...document.querySelectorAll(`[data-popover-action][data-popover-id="${this.element.id}"]:not(#${this.element.id} *)`),
            ];
            this.insideControls = [
                ...this.element.querySelectorAll(`[data-popover-action][data-popover-id="${this.element.id}"]`),
            ];
            // track opening
            this.dialogAttrObserver = new MutationObserver((mutations, observer) => {
                mutations.forEach(async (mutation) => {
                    if (mutation.attributeName === "open") {
                        const dialog = mutation.target;
                        const isOpen = dialog.hasAttribute("open");
                        if (!isOpen)
                            return;
                        // set focus
                        // const focusTarget = dialog.querySelector(
                        //   "[autofocus]"
                        // ) as HTMLElement;
                        // if (focusTarget) {
                        //   focusTarget.focus();
                        // } else {
                        //   const focusable = dialog.querySelectorAll(
                        //     'button:not([disabled]):not(:scope [data-popover] *), [href]:not(:scope [data-popover] *), input:not([type="hidden"]):not([disabled]):not(:scope [data-popover] *), select:not([disabled]):not(:scope [data-popover] *), textarea:not([disabled]):not(:scope [data-popover] *), [tabindex]:not([tabindex="-1"]):not(:scope [data-popover] *)'
                        //   ) as unknown as HTMLElement[];
                        //   focusable[0]?.focus();
                        // }
                        if (this.hoverable) {
                            this.element.removeEventListener("mouseenter", this.#handleElementMouseEnter);
                            this.element.addEventListener("mouseenter", this.#handleElementMouseEnter);
                            this.element.removeEventListener("mouseleave", this.#handleElementMouseLeave);
                            this.element.addEventListener("mouseleave", this.#handleElementMouseLeave);
                        }
                        this.insideControls.forEach((control) => {
                            control.removeEventListener("click", this.#handleControlClick);
                            control.addEventListener("click", this.#handleControlClick);
                        });
                        document.removeEventListener("click", this.#handleDocumentClick);
                        document.addEventListener("click", this.#handleDocumentClick);
                        document.removeEventListener("keydown", this.#handleDocumentKeydown);
                        document.addEventListener("keydown", this.#handleDocumentKeydown);
                        window.removeEventListener("resize", this.#handleWindowResize);
                        window.addEventListener("resize", this.#handleWindowResize);
                    }
                });
            });
            this.dialogAttrObserver.observe(this.element, {
                attributes: true,
            });
            if (this.element.hasAttribute("open")) {
                document.removeEventListener("click", this.#handleDocumentClick);
                document.addEventListener("click", this.#handleDocumentClick);
                document.removeEventListener("keydown", this.#handleDocumentKeydown);
                document.addEventListener("keydown", this.#handleDocumentKeydown);
                window.removeEventListener("resize", this.#handleWindowResize);
                window.addEventListener("resize", this.#handleWindowResize);
                if (this.hoverable) {
                    this.element.removeEventListener("mouseleave", this.#handleElementMouseLeave);
                    this.element.addEventListener("mouseleave", this.#handleElementMouseLeave);
                }
                // TODO: Исправить начальный поиск якоря
                this.lastAnchor = this.outsideControls[0];
                this.#calculatePosition({ anchor: this.lastAnchor });
            }
            this.element.removeEventListener("close", this.#handleElementClose);
            this.element.addEventListener("close", this.#handleElementClose);
            this.outsideControls.forEach((control) => {
                control.removeEventListener("click", this.#handleControlClick);
                control.addEventListener("click", this.#handleControlClick);
                if (this.hoverable) {
                    control.removeEventListener("mouseenter", this.#handleControlMouseEnter);
                    control.removeEventListener("mouseleave", this.#handleControlMouseLeave);
                    control.addEventListener("mouseenter", this.#handleControlMouseEnter);
                    control.addEventListener("mouseleave", this.#handleControlMouseLeave);
                }
            });
        }
        #handleControlMouseEnter = (evt) => {
            if (this.hoverableLeaveTimeout != null) {
                clearTimeout(this.hoverableLeaveTimeout);
            }
            if (this.element.hasAttribute("open")) {
                return;
            }
            this.show({ evt });
        };
        #handleControlMouseLeave = (evt) => {
            if (this.hoverableLeaveTimeout != null) {
                clearTimeout(this.hoverableLeaveTimeout);
            }
            this.hoverableLeaveTimeout = setTimeout(() => {
                if (this.element.contains(document.activeElement)) {
                    return;
                }
                if (this.element.hasAttribute("open")) {
                    this.close();
                }
            }, 100);
        };
        #handleElementMouseEnter = (evt) => {
            if (this.hoverableLeaveTimeout != null) {
                clearTimeout(this.hoverableLeaveTimeout);
            }
        };
        #handleElementMouseLeave = (evt) => {
            if (this.hoverableLeaveTimeout != null) {
                clearTimeout(this.hoverableLeaveTimeout);
            }
            this.hoverableLeaveTimeout = setTimeout(() => {
                if (this.element.contains(document.activeElement)) {
                    return;
                }
                if (this.element.hasAttribute("open")) {
                    this.close();
                }
            }, 100);
        };
        toggle = ({ evt }) => {
            if (this.element.hasAttribute("open")) {
                return this.close();
            }
            return this.show({ evt });
        };
        close = () => {
            this.element.close("dismiss");
        };
        show = ({ evt }) => {
            const anchorEl = this.outsideControls.find((control) => control.contains(evt.target));
            if (anchorEl) {
                this.lastAnchor = anchorEl;
                this.element.style.visibility = "hidden";
                this.element.show();
                this.#calculatePosition({ anchor: anchorEl });
                this.element.style.visibility = "visible";
            }
        };
        #calculatePosition = ({ anchor }) => {
            const { width: anchorWidth, height: anchorHeight, left: anchorLeft, top: anchorTop, } = anchor.getBoundingClientRect();
            let x = 0;
            let y = 0;
            this.element.style.left = x + "px";
            this.element.style.top = y + anchorHeight + "px";
            if (this.pinned) {
                return;
            }
            const { width: elementWidth, height: elementHeight, left: elementLeft, top: elementTop, } = this.element.getBoundingClientRect();
            if (Math.ceil(elementWidth + elementWidth) >=
                document.documentElement.clientWidth) {
                this.element.style.left = x - elementWidth + anchorWidth + "px";
            }
            if (Math.ceil(elementTop + elementHeight) >=
                document.documentElement.clientHeight) {
                this.element.style.top = y - elementHeight + "px";
            }
        };
        #handleControlClick = (evt) => {
            // evt.preventDefault();
            const { currentTarget } = evt;
            const action = currentTarget.getAttribute("data-popover-action");
            const actionArgs = currentTarget.getAttribute("data-popover-action-args");
            if (!Popover.#SUPPORTED_ACTIONS.includes(action))
                return;
            const actionFunc = this[action];
            if (actionFunc instanceof Function)
                return actionFunc({
                    args: actionArgs,
                    evt,
                });
        };
        #handleDocumentClick = ({ target }) => {
            if (this.outsideControls.some((control) => control.contains(target)) ||
                this.element.contains(target)) {
                return;
            }
            this.close();
        };
        #handleDocumentKeydown = ({ key }) => {
            if (key === "Escape") {
                this.close();
            }
        };
        #handleElementClose = ({ currentTarget }) => {
            if (this.hoverable) {
                this.element.removeEventListener("mouseenter", this.#handleElementMouseEnter);
                this.element.removeEventListener("mouseleave", this.#handleElementMouseLeave);
            }
            window.removeEventListener("resize", this.#handleWindowResize);
            document.removeEventListener("click", this.#handleDocumentClick);
            document.removeEventListener("keydown", this.#handleDocumentKeydown);
            this.insideControls.forEach((control) => {
                control.removeEventListener("click", this.#handleControlClick);
            });
        };
        #handleWindowResize = () => {
            if (this.lastAnchor) {
                this.#calculatePosition({ anchor: this.lastAnchor });
            }
        };
    }
    if (window.welpodron == null) {
        window.welpodron = {};
    }
    window.welpodron.popover = Popover;
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("dialog[data-popover]").forEach((element) => {
            new Popover({ element: element });
        });
    }, {
        once: true,
    });
})();
//# sourceMappingURL=script.js.map