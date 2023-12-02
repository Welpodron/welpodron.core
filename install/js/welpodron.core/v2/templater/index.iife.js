this.window = this.window || {};
(function (exports) {
    'use strict';

    const isStringHTML = (string) => {
        const doc = new DOMParser().parseFromString(string, 'text/html');
        return [...doc.body.childNodes].some((node) => node.nodeType === 1);
    };
    const renderHTML = ({ string, container, config, }) => {
        if (!isStringHTML(string)) {
            return;
        }
        const replace = config.replace;
        const templateElement = document.createElement('template');
        templateElement.innerHTML = string;
        const fragment = templateElement.content;
        fragment.querySelectorAll('script').forEach((scriptTag) => {
            const scriptParentNode = scriptTag.parentNode;
            scriptParentNode?.removeChild(scriptTag);
            const script = document.createElement('script');
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
                container.innerHTML = '';
                container.appendChild(fragment);
                return;
            }
            return container.replaceChildren(fragment);
        }
        return container.appendChild(fragment);
    };
    const templater = {
        isStringHTML,
        renderHTML,
    };

    exports.templater = templater;

})(this.window.welpodron = this.window.welpodron || {});
//# sourceMappingURL=index.iife.js.map
