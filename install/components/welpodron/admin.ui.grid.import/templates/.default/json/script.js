"use strict";
((window) => {
    if (!window.welpodron) {
        window.welpodron = {};
    }
    if (!window.welpodron.admin) {
        window.welpodron.admin = {};
    }
    if (window.welpodron.admin.json) {
        return;
    }
    const MODULE_BASE = "admin.json";
    class JsonIblock {
        element;
        textarea;
        constructor({ element, textarea, config = {} }) {
            this.element = element;
            this.textarea = textarea;
            this.element.removeEventListener("click", this.handleElementClick);
            this.element.addEventListener("click", this.handleElementClick);
        }
        handleElementClick = async (event) => {
            const iblockIdRaw = prompt("Введите Iblock Id", "") || "";
            const iblockId = parseInt(iblockIdRaw);
            if (isNaN(iblockId) || iblockId <= 0) {
                return;
            }
            try {
                const data = new FormData();
                data.set("iblockId", iblockId.toString());
                if (window.BX && window.BX.bitrix_sessid) {
                    data.set("sessid", window.BX.bitrix_sessid());
                }
                const response = await fetch("/bitrix/services/main/ajax.php?action=welpodron%3Aseocities.Receiver.exportWebflyIblock", {
                    method: "POST",
                    body: data,
                });
                let json = await response.json();
                json = JSON.stringify(json.data, null, 2);
                this.textarea.element.value = json;
                const inputEvent = new Event("input", {
                    bubbles: true,
                    cancelable: true,
                });
                this.textarea.element.dispatchEvent(inputEvent);
            }
            catch (error) {
                console.error(error);
            }
        };
    }
    class JsonFetch {
        element;
        textarea;
        constructor({ element, textarea, config = {} }) {
            this.element = element;
            this.textarea = textarea;
            this.element.removeEventListener("click", this.handleElementClick);
            this.element.addEventListener("click", this.handleElementClick);
        }
        handleElementClick = async (event) => {
            let url = prompt("Введите URL", "") || "";
            url = url.trim();
            if (!url.length) {
                return;
            }
            try {
                const response = await fetch(url);
                let json = await response.json();
                json = JSON.stringify(json, null, 2);
                this.textarea.element.value = json;
                const inputEvent = new Event("input", {
                    bubbles: true,
                    cancelable: true,
                });
                this.textarea.element.dispatchEvent(inputEvent);
            }
            catch (error) {
                console.error(error);
            }
        };
    }
    class JsonUpload {
        element;
        textarea;
        constructor({ element, textarea, config = {} }) {
            this.element = element;
            this.textarea = textarea;
            this.element.removeEventListener("change", this.handleElementChange);
            this.element.addEventListener("change", this.handleElementChange);
        }
        handleElementChange = (event) => {
            const file = event.target.files?.[0];
            this.element.value = "";
            if (!file || file.type !== "application/json") {
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result;
                if (!result) {
                    return;
                }
                let json = result.toString();
                try {
                    json = JSON.parse(json);
                    json = JSON.stringify(json, null, 2);
                }
                catch (_) { }
                this.textarea.element.value = json;
                const inputEvent = new Event("input", {
                    bubbles: true,
                    cancelable: true,
                });
                this.textarea.element.dispatchEvent(inputEvent);
            };
            reader.readAsText(file);
        };
    }
    class JsonDropzone {
        element;
        textarea;
        placeholderElement;
        constructor({ element, textarea, config = {} }) {
            this.element = element;
            this.textarea = textarea;
            if (config.placeholderElement) {
                this.placeholderElement = config.placeholderElement;
            }
            else {
                const placeholderElement = this.element.querySelector("[data-w-json-dropzone-placeholder]");
                if (placeholderElement) {
                    this.placeholderElement = placeholderElement;
                }
            }
            [
                "drag",
                "dragstart",
                "dragend",
                "dragover",
                "dragenter",
                "dragleave",
                "drop",
            ].forEach((event) => {
                this.element.addEventListener(event, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });
            this.element.removeEventListener("drop", this.handleElementDrop);
            this.element.addEventListener("drop", this.handleElementDrop);
            this.element.removeEventListener("dragover", this.handleElementDragOver);
            this.element.addEventListener("dragover", this.handleElementDragOver);
            this.element.removeEventListener("dragleave", this.handleElementDragLeave);
            this.element.addEventListener("dragleave", this.handleElementDragLeave);
        }
        handleElementDrop = (event) => {
            if (this.placeholderElement) {
                this.placeholderElement.style.visibility = "hidden";
            }
            const file = event.dataTransfer?.files?.[0];
            if (!file || file.type !== "application/json") {
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result;
                if (!result) {
                    return;
                }
                let json = result.toString();
                try {
                    json = JSON.parse(json);
                    json = JSON.stringify(json, null, 2);
                }
                catch (_) { }
                this.textarea.element.value = json;
                const inputEvent = new Event("input", {
                    bubbles: true,
                    cancelable: true,
                });
                this.textarea.element.dispatchEvent(inputEvent);
            };
            reader.readAsText(file);
        };
        handleElementDragOver = (event) => {
            if (this.placeholderElement) {
                this.placeholderElement.style.visibility = "visible";
            }
        };
        handleElementDragLeave = (event) => {
            if (this.placeholderElement) {
                this.placeholderElement.style.visibility = "hidden";
            }
        };
    }
    class JsonTextArea {
        element;
        dropzone;
        upload;
        fetch;
        iblock;
        constructor({ element, config = {} }) {
            this.element = element;
            if (config.uploadElement) {
                this.upload = new JsonUpload({
                    element: config.uploadElement,
                    textarea: this,
                });
            }
            else {
                const uploadElement = document.querySelector(`[data-w-json-upload][data-w-json-id="${this.element.getAttribute("data-w-json-id")}"]`);
                if (uploadElement) {
                    this.upload = new JsonUpload({
                        element: uploadElement,
                        textarea: this,
                    });
                }
            }
            if (config.dropzoneElement) {
                this.dropzone = new JsonDropzone({
                    element: config.dropzoneElement,
                    textarea: this,
                });
            }
            else {
                const dropzoneElement = document.querySelector(`[data-w-json-dropzone][data-w-json-id="${this.element.getAttribute("data-w-json-id")}"]`);
                if (dropzoneElement) {
                    this.dropzone = new JsonDropzone({
                        element: dropzoneElement,
                        textarea: this,
                    });
                }
            }
            if (config.fetchElement) {
                this.fetch = new JsonFetch({
                    element: config.fetchElement,
                    textarea: this,
                });
            }
            else {
                const fetchElement = document.querySelector(`[data-w-json-fetch][data-w-json-id="${this.element.getAttribute("data-w-json-id")}"]`);
                if (fetchElement) {
                    this.fetch = new JsonFetch({
                        element: fetchElement,
                        textarea: this,
                    });
                }
            }
            if (config.iblockElement) {
                this.iblock = new JsonIblock({
                    element: config.iblockElement,
                    textarea: this,
                });
            }
            else {
                const iblockElement = document.querySelector(`[data-w-json-iblock][data-w-json-id="${this.element.getAttribute("data-w-json-id")}"]`);
                if (iblockElement) {
                    this.iblock = new JsonIblock({
                        element: iblockElement,
                        textarea: this,
                    });
                }
            }
            this.element.removeEventListener("paste", this.handleElementPaste);
            this.element.addEventListener("paste", this.handleElementPaste);
            this.element.removeEventListener("input", this.handleElementInput);
            this.element.addEventListener("input", this.handleElementInput);
        }
        handleElementPaste = async (event) => {
            try {
                const clipboardData = event.clipboardData || window.clipboardData;
                if (!clipboardData) {
                    return;
                }
                const item = clipboardData?.items[0];
                if (!item) {
                    return;
                }
                if (item.kind !== "file" || item.type !== "application/json") {
                    return;
                }
                const blob = item.getAsFile();
                if (!blob) {
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    const result = event.target?.result;
                    if (!result) {
                        return;
                    }
                    let json = result.toString();
                    try {
                        json = JSON.parse(json);
                        json = JSON.stringify(json, null, 2);
                    }
                    catch (_) { }
                    this.element.value = json;
                    const inputEvent = new Event("input", {
                        bubbles: true,
                        cancelable: true,
                    });
                    this.element.dispatchEvent(inputEvent);
                };
                reader.readAsText(blob);
            }
            catch (_) { }
        };
        handleElementInput = (event) => {
            const value = this.element.value;
            if (!value || !value.trim().length) {
                this.element.setCustomValidity("");
                this.element.reportValidity();
                this.element.checkValidity();
                return;
            }
            try {
                JSON.parse(value);
                this.element.setCustomValidity("");
            }
            catch (error) {
                this.element.setCustomValidity("JSON не является валидным");
            }
            this.element.reportValidity();
        };
    }
    window.welpodron.admin.json = JsonTextArea;
})(window);
