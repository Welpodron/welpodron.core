const MODULE_BASE = 'popover';
const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
const ATTRIBUTE_BASE_ACTIVE = `${ATTRIBUTE_BASE}-active`;
const ATTRIBUTE_BASE_HOVERABLE = `${ATTRIBUTE_BASE}-hoverable`;
const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
const ATTRIBUTE_ACTION_ARGS = `${ATTRIBUTE_ACTION}-args`;
const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;
class Popover {
    supportedActions = ['hide', 'show'];
    isHoverable = false;
    hoverableLeaveTimeout = null;
    isActive = false;
    element;
    lastFocusedElement;
    resizeObserver;
    currentAnchor;
    constructor({ element, config = {} }) {
        this.element = element;
        this.isActive = this.element.getAttribute(ATTRIBUTE_BASE_ACTIVE) != null;
        this.isHoverable =
            this.element.getAttribute(ATTRIBUTE_BASE_HOVERABLE) != null ||
                config.isHoverable === true;
        this.lastFocusedElement = document.activeElement;
        this.resizeObserver = new ResizeObserver((mutations, observer) => {
            for (const _ of mutations) {
                if (this.currentAnchor) {
                    this.calculatePosition({ anchor: this.currentAnchor });
                }
            }
        });
        if (this.isHoverable) {
            document.removeEventListener('mouseover', this.handleDocumentMouseOver);
            document.addEventListener('mouseover', this.handleDocumentMouseOver);
            document.removeEventListener('mouseout', this.handleDocumentMouseOut);
            document.addEventListener('mouseout', this.handleDocumentMouseOut);
        }
        else {
            document.removeEventListener('click', this.handleDocumentClick);
            document.addEventListener('click', this.handleDocumentClick);
        }
    }
    calculatePosition = ({ anchor }) => {
        const { width: anchorWidth, height: anchorHeight, left: anchorLeft, top: anchorTop, bottom: anchorBottom, } = anchor.getBoundingClientRect();
        this.element.style.left = anchorLeft + window.scrollX + 'px';
        this.element.style.top = anchorTop + anchorHeight + window.scrollY + 'px';
        //! Код ниже работает если находятся в одном relative контейнере
        // this.element.style.left = anchor.offsetLeft + "px";
        // this.element.style.top = anchor.offsetTop + anchorHeight + "px";
        const beforeClientHeight = document.documentElement.clientHeight;
        const beforeClientWidth = document.documentElement.clientWidth;
        const { width: elementWidth, height: elementHeight, left: elementLeft, top: elementTop, } = this.element.getBoundingClientRect();
        if (Math.ceil(elementLeft + elementWidth) >= beforeClientWidth) {
            this.element.style.left =
                anchorLeft + window.scrollX - elementWidth + anchorWidth + 'px';
        }
        if (Math.ceil(elementTop + elementHeight) >= beforeClientHeight) {
            this.element.style.top =
                anchorTop + window.scrollY - elementHeight + 'px';
        }
        //! Код ниже работает если находятся в одном relative контейнере
        // if (Math.ceil(elementLeft + elementWidth) >= beforeClientWidth) {
        //   this.element.style.left =
        //     anchor.offsetLeft - elementWidth + anchorWidth + "px";
        // }
        // if (Math.ceil(elementTop + elementHeight) >= beforeClientHeight) {
        //   this.element.style.top = anchor.offsetTop - elementHeight + "px";
        // }
    };
    show = async ({ args, event }) => {
        if (this.isActive) {
            return;
        }
        document.body.append(this.element);
        const anchorEl = [
            ...document.querySelectorAll(`[${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}][${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(`${ATTRIBUTE_BASE_ID}`)}"]:not([${ATTRIBUTE_BASE}][${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(`${ATTRIBUTE_BASE_ID}`)}"] *)`),
        ].find((control) => control.contains(event?.target));
        if (!anchorEl) {
            return;
        }
        this.currentAnchor = anchorEl;
        this.resizeObserver.observe(this.element);
        this.resizeObserver.observe(anchorEl);
        document.removeEventListener('keydown', this.handleDocumentKeyDown);
        document.addEventListener('keydown', this.handleDocumentKeyDown);
        window.removeEventListener('resize', this.handleWindowResize);
        window.addEventListener('resize', this.handleWindowResize);
        this.element.setAttribute(ATTRIBUTE_BASE_ACTIVE, '');
        this.calculatePosition({ anchor: anchorEl });
        this.isActive = true;
    };
    hide = async ({ args, event } = {}) => {
        if (!this.isActive) {
            return;
        }
        this.resizeObserver.disconnect();
        document.removeEventListener('keydown', this.handleDocumentKeyDown);
        this.lastFocusedElement?.focus();
        this.element.removeAttribute(ATTRIBUTE_BASE_ACTIVE);
        this.isActive = false;
    };
    handleDocumentKeyDown = (event) => {
        if (event.key === 'Escape') {
            return this.hide({ event });
        }
    };
    handleWindowResize = (event) => {
        if (!this.isActive) {
            return;
        }
        this.calculatePosition({ anchor: this.currentAnchor });
    };
    handleDocumentClick = (event) => {
        let { target } = event;
        if (!target) {
            return;
        }
        const control = target.closest(`[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(`${ATTRIBUTE_BASE_ID}`)}"][${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}]`);
        if (!control) {
            //! Проверка на содержание в документе необходима если DOM внутри был модифицирован пока модальное окно было открыто
            if (document.contains(target) &&
                !this.element.contains(target)) {
                return this.hide({ event });
            }
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
            if (!this.element.contains(target)) {
                // Проверить находится ли target вне модального окна
                // Если да, то сделать его последним активным элементом
                this.lastFocusedElement = target;
            }
            return actionFunc({
                args: actionArgs,
                event,
            });
        }
    };
    // Hoverbable
    handleDocumentMouseOver = async (event) => {
        let { target } = event;
        if (!target) {
            return;
        }
        const control = target.closest(`[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(`${ATTRIBUTE_BASE_ID}`)}"][${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}]`);
        if (!control) {
            return;
        }
        if (this.hoverableLeaveTimeout != null) {
            clearTimeout(this.hoverableLeaveTimeout);
        }
        const action = control.getAttribute(ATTRIBUTE_ACTION);
        const actionArgs = control.getAttribute(ATTRIBUTE_ACTION_ARGS);
        const actionFlush = control.getAttribute(ATTRIBUTE_ACTION_FLUSH);
        if (!actionFlush) {
            event.preventDefault();
        }
        if (!action || !this.supportedActions.includes(action)) {
            return;
        }
        const actionFunc = this[action];
        if (actionFunc instanceof Function) {
            if (!this.element.contains(control)) {
                // Проверить находится ли target вне модального окна
                // Если да, то сделать его последним активным элементом
                this.lastFocusedElement = control;
            }
            return actionFunc({
                args: actionArgs,
                event,
            });
        }
    };
    handleDocumentMouseOut = async (event) => {
        let { relatedTarget } = event;
        if (this.hoverableLeaveTimeout != null) {
            clearTimeout(this.hoverableLeaveTimeout);
        }
        this.hoverableLeaveTimeout = setTimeout(() => {
            if (!relatedTarget) {
                return this.hide({});
            }
            if (!this.element.contains(relatedTarget)) {
                return this.hide({});
            }
        }, 125);
    };
}

export { Popover as popover };
