"use strict";
(() => {
    if (window.welpodron && window.welpodron.animate) {
        class Collapse {
            supportedActions = ["hide", "show", "toggle"];
            element;
            animation = null;
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
                target = target.closest(`[data-w-collapse-id][data-w-collapse-action]`);
                if (!target) {
                    return;
                }
                const collapseId = target.getAttribute("data-w-collapse-id");
                if (collapseId !== this.element.getAttribute("data-w-collapse-id")) {
                    return;
                }
                const action = target.getAttribute("data-w-collapse-action");
                const actionArgs = target.getAttribute("data-w-collapse-action-args");
                const actionFlush = target.getAttribute("data-w-collapse-action-flush");
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
                if (this.animation) {
                    window.clearTimeout(this.animation.timer);
                }
                if (this.element.getAttribute("data-w-collapse-active") != null) {
                    return;
                }
                this.element.style.height = `0px`;
                this.element.setAttribute("data-w-collapse-active", "");
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
                if (this.element.getAttribute("data-w-collapse-active") == null) {
                    return;
                }
                this.element.style.height = this.element.scrollHeight + "px";
                this.element.style.display = "block";
                this.animation = window.welpodron.animate({
                    element: this.element,
                    callback: () => {
                        this.element.style.height = this.element.scrollHeight + "px";
                        this.element.removeAttribute("data-w-collapse-active");
                        this.element.style.height = `0px`;
                    },
                });
                await this.animation?.promise;
                this.element.style.removeProperty("display");
                this.element.style.removeProperty("height");
                this.animation = null;
            };
            toggle = async ({ args, event }) => {
                if (this.animation) {
                    window.clearTimeout(this.animation.timer);
                }
                return this.element.getAttribute("data-w-collapse-active") != null
                    ? this.hide({ args, event })
                    : this.show({ args, event });
            };
        }
        window.welpodron.collapse = Collapse;
    }
})();
//# sourceMappingURL=script.js.map