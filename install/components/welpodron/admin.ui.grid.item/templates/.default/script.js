"use strict";
((window) => {
    if (!window.welpodron) {
        window.welpodron = {};
    }
    if (!window.welpodron.admin) {
        window.welpodron.admin = {};
    }
    if (window.welpodron.admin.zone) {
        return;
    }
    const isStringHTML = (string) => {
        const doc = new DOMParser().parseFromString(string, "text/html");
        return [...doc.body.childNodes].some((node) => node.nodeType === 1);
    };
    const renderHTML = ({ string, container, config, }) => {
        if (!isStringHTML(string)) {
            return;
        }
        const replace = config.replace;
        const templateElement = document.createElement("template");
        templateElement.innerHTML = string;
        const fragment = templateElement.content;
        fragment.querySelectorAll("script").forEach((scriptTag) => {
            const scriptParentNode = scriptTag.parentNode;
            scriptParentNode?.removeChild(scriptTag);
            const script = document.createElement("script");
            script.text = scriptTag.text;
            // Новое поведение для скриптов
            if (scriptTag.id) {
                script.id = scriptTag.id;
            }
            scriptParentNode?.append(script);
        });
        if (replace) {
            // омг, фикс для старых браузеров сафари, кринге
            if (!container.replaceChildren) {
                container.innerHTML = "";
                container.appendChild(fragment);
                return;
            }
            return container.replaceChildren(fragment);
        }
        return container.appendChild(fragment);
    };
    const MODULE_BASE = "zone";
    const EVENT_LOAD_BEFORE = `welpodron.${MODULE_BASE}:load:before`;
    const EVENT_LOAD_AFTER = `welpodron.${MODULE_BASE}:load:after`;
    const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
    const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
    const ATTRIBUTE_BASE_ONCE = `${ATTRIBUTE_BASE}-once`;
    const ATTRIBUTE_BASE_APPEND = `${ATTRIBUTE_BASE}-append`;
    const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
    const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
    const ATTRIBUTE_ACTION_ARGS = `${ATTRIBUTE_ACTION}-args`;
    const ATTRIBUTE_ACTION_ARGS_SENSITIVE = `${ATTRIBUTE_ACTION_ARGS}-sensitive`;
    const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;
    class Zone {
        sessid = "";
        element = null;
        isLoading = false;
        isOnce = false;
        isAppend = false;
        isLoaded = false;
        constructor({ element, sessid, config = {} }) {
            this.sessid = sessid;
            this.element = element;
            if (config.isOnce != null) {
                this.isOnce = config.isOnce;
            }
            else {
                this.isOnce = this.element.getAttribute(ATTRIBUTE_BASE_ONCE) != null;
            }
            if (config.isAppend != null) {
                this.isAppend = config.isAppend;
            }
            else {
                this.isAppend =
                    this.element.getAttribute(ATTRIBUTE_BASE_APPEND) != null;
            }
            document.removeEventListener("click", this.handleDocumentClick);
            document.addEventListener("click", this.handleDocumentClick);
        }
        handleDocumentClick = async (event) => {
            let { target } = event;
            // debugger;
            if (!target) {
                return;
            }
            target = target.closest(`[${ATTRIBUTE_BASE_ID}="${this.element?.getAttribute(ATTRIBUTE_BASE_ID)}"][${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}]`);
            if (!target) {
                return;
            }
            const action = target.getAttribute(ATTRIBUTE_ACTION);
            if (!action) {
                return;
            }
            const actionArgs = target.getAttribute(ATTRIBUTE_ACTION_ARGS);
            const actionArgsSensitive = target.getAttribute(ATTRIBUTE_ACTION_ARGS_SENSITIVE);
            const actionFlush = target.getAttribute(ATTRIBUTE_ACTION_FLUSH);
            if (!actionFlush) {
                event.preventDefault();
            }
            if (this.isOnce && this.isLoaded) {
                return;
            }
            if (this.isLoading) {
                return;
            }
            this.isLoaded = false;
            this.isLoading = true;
            const controls = document.querySelectorAll(`[${ATTRIBUTE_BASE_ID}="${this.element?.getAttribute(ATTRIBUTE_BASE_ID)}"][${ATTRIBUTE_ACTION}][${ATTRIBUTE_CONTROL}]`);
            controls.forEach((control) => {
                control.setAttribute("disabled", "");
            });
            const data = new FormData();
            const from = this.element?.getAttribute(ATTRIBUTE_BASE_ID);
            if (from) {
                data.set("from", from);
            }
            // composite and deep cache fix
            if (window.BX && window.BX.bitrix_sessid) {
                this.sessid = window.BX.bitrix_sessid();
            }
            data.set("sessid", this.sessid);
            if (actionArgs) {
                data.set("args", actionArgs);
            }
            if (actionArgsSensitive) {
                data.set("argsSensitive", actionArgsSensitive);
            }
            let dispatchedEvent = new CustomEvent(EVENT_LOAD_BEFORE, {
                bubbles: true,
                cancelable: true,
            });
            if (!this.element?.dispatchEvent(dispatchedEvent)) {
                controls.forEach((control) => {
                    control.removeAttribute("disabled");
                });
                dispatchedEvent = new CustomEvent(EVENT_LOAD_AFTER, {
                    bubbles: true,
                    cancelable: false,
                });
                this.element?.dispatchEvent(dispatchedEvent);
                this.isLoading = false;
                return;
            }
            try {
                const response = await fetch(action, {
                    method: "POST",
                    body: data,
                });
                if (!response.ok) {
                    throw new Error(response.statusText);
                }
                const bitrixResponse = await response.json();
                if (bitrixResponse.status === "error") {
                    console.error(bitrixResponse);
                    const error = bitrixResponse.errors[0];
                    renderHTML({
                        string: isStringHTML(error.message)
                            ? error.message
                            : `<p>${error.message}</p>`,
                        container: this.element,
                        config: {
                            replace: this.isAppend ? false : true,
                        },
                    });
                }
                else {
                    const { data: responseData } = bitrixResponse;
                    renderHTML({
                        string: isStringHTML(responseData)
                            ? responseData
                            : `<p>${responseData}</p>`,
                        container: this.element,
                        config: {
                            replace: this.isAppend ? false : true,
                        },
                    });
                    if (this.isOnce) {
                        document.removeEventListener("click", this.handleDocumentClick);
                    }
                    this.isLoaded = true;
                }
            }
            catch (error) {
                console.error(error);
            }
            finally {
                controls.forEach((control) => {
                    control.removeAttribute("disabled");
                });
                dispatchedEvent = new CustomEvent(EVENT_LOAD_AFTER, {
                    bubbles: true,
                    cancelable: false,
                });
                this.element.dispatchEvent(dispatchedEvent);
                this.isLoading = false;
            }
        };
    }
    // Form
    window.welpodron.admin.zone = Zone;
})(window);
