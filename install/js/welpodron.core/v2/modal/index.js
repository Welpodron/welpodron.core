import { animate } from '../animate/index.js';

const modalsListActive = new Set();
const MODULE_BASE = 'modal';
const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
const ATTRIBUTE_BASE_ACTIVE = `${ATTRIBUTE_BASE}-active`;
const ATTRIBUTE_BASE_ONCE = `${ATTRIBUTE_BASE}-once`;
const ATTRIBUTE_CONTENT = `${ATTRIBUTE_BASE}-content`;
const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
const ATTRIBUTE_ACTION_ARGS = `${ATTRIBUTE_ACTION}-args`;
const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;
// FOR MINIFICATION PURPOSES
const DEFAULT_EVENT_CLICK = 'click';
const DEFAULT_EVENT_KEYDOWN = 'keydown';
class Modal {
    supportedActions = ['hide', 'show'];
    element;
    lastFocusedElement;
    firstFocusableElement;
    lastFocusableElement;
    isTranslating = false;
    isActive = false;
    isOnce = false;
    constructor({ element, config = {} }) {
        this.element = element;
        if (config.isOnce != null) {
            this.isOnce = config.isOnce;
        }
        else {
            this.isOnce = this.element.getAttribute(ATTRIBUTE_BASE_ONCE) != null;
        }
        this.isActive = this.element.getAttribute(ATTRIBUTE_BASE_ACTIVE) != null;
        this.lastFocusedElement = document.activeElement;
        this.firstFocusableElement = document.createElement('div');
        this.firstFocusableElement.setAttribute(ATTRIBUTE_CONTENT, '');
        this.firstFocusableElement.tabIndex = 0;
        this.lastFocusableElement = document.createElement('button');
        this.lastFocusableElement.style.cssText =
            'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0;';
        this.lastFocusableElement.onfocus = () => this.firstFocusableElement.focus();
        this.firstFocusableElement.append(...this.element.childNodes);
        this.element.append(this.firstFocusableElement);
        this.element.append(this.lastFocusableElement);
        document.addEventListener(DEFAULT_EVENT_CLICK, this.handleDocumentClick);
    }
    handleDocumentClick = (event) => {
        let { target } = event;
        if (!target) {
            return;
        }
        if (target === this.element) {
            return this.hide({ event });
        }
        target = target.closest(`[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(`${ATTRIBUTE_BASE_ID}`)}"][${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}]`);
        if (!target) {
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
    handleDocumentKeyDown = (event) => {
        if (event.code === 'Tab') {
            if (event.shiftKey) {
                if (event.target === this.firstFocusableElement) {
                    event.preventDefault();
                    return this.lastFocusableElement.focus();
                }
                return;
            }
        }
        if (event.key === 'Escape' && modalsListActive.size) {
            //! TODO: Исправить
            //! Так тут кароч вызывается несколько раз так как там все ниже асихроно и вообще
            //! получается что если открыто в настоящий момент несколько окон то они все закроются!
            const lastModal = [...modalsListActive][modalsListActive.size - 1];
            if (lastModal.isTranslating) {
                return;
            }
            lastModal.hide({ event });
        }
    };
    show = async ({ args, event } = {}) => {
        if (this.isTranslating || this.isActive) {
            return;
        }
        //! ТУТ ОЧЕНЬ ВАЖНО ЧТОБЫ У this.element Не было свойтсва inset потому что оно ломает все
        if (this.element.parentNode) {
            document.body.append(this.element);
        }
        this.isTranslating = true;
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'pinch-zoom';
        this.element.style.display = 'flex';
        // Магичесий хак
        this.element.scrollHeight;
        // Хак 2
        this.element.style.inset = '';
        const animation = animate({
            element: this.element,
            callback: () => {
                this.element.setAttribute(ATTRIBUTE_BASE_ACTIVE, '');
            },
        });
        await animation.promise;
        document.addEventListener(DEFAULT_EVENT_KEYDOWN, this.handleDocumentKeyDown);
        this.firstFocusableElement.focus();
        modalsListActive.add(this);
        this.isTranslating = false;
        this.isActive = true;
    };
    hide = async ({ args, event } = {}) => {
        if (this.isTranslating || !this.isActive) {
            return;
        }
        this.isTranslating = true;
        const animation = animate({
            element: this.element,
            callback: () => {
                this.element.removeAttribute(ATTRIBUTE_BASE_ACTIVE);
            },
        });
        await animation.promise;
        this.element.style.display = 'none';
        modalsListActive.delete(this);
        if (!modalsListActive.size) {
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('touch-action');
        }
        document.removeEventListener(DEFAULT_EVENT_KEYDOWN, this.handleDocumentKeyDown);
        this.lastFocusedElement?.focus();
        if (document.activeElement !== this.lastFocusedElement) {
            // Допустим кнопка стала не активной у другого модального окна
            if (modalsListActive.size) {
                const lastModal = [...modalsListActive].pop();
                if (lastModal) {
                    lastModal.firstFocusableElement.focus();
                }
            }
        }
        if (this.isOnce) {
            document.removeEventListener(DEFAULT_EVENT_CLICK, this.handleDocumentClick);
            this.element.remove();
        }
        this.isTranslating = false;
        this.isActive = false;
    };
}

export { Modal as modal, modalsListActive };
