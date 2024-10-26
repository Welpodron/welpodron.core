//! v4 Добавить поддержку событий
const MODULE_BASE = "modal";
const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
const ATTRIBUTE_BASE_ACTIVE = `${ATTRIBUTE_BASE}-active`;
const ATTRIBUTE_BASE_ONCE = `${ATTRIBUTE_BASE}-once`;
const ATTRIBUTE_CONTENT = `${ATTRIBUTE_BASE}-content`;
const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;

// FOR MINIFICATION PURPOSES
const DEFAULT_EVENT_CLICK = "click";
const DEFAULT_EVENT_KEYDOWN = "keydown";

type ModalConfigType = {
  isOnce?: boolean;
};

type ModalPropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
  config?: ModalConfigType;
};

class Modal<BaseElementType extends HTMLElement = HTMLElement> {
  element: BaseElementType;

  lastFocusedElement: HTMLElement | null;
  firstFocusableElement: HTMLElement;
  lastFocusableElement: HTMLElement;

  isActive = false;
  isOnce = false;

  constructor({ element, config = {} }: ModalPropsType<BaseElementType>) {
    this.element = element;

    this.isOnce =
      config.isOnce != null
        ? config.isOnce
        : this.element.hasAttribute(ATTRIBUTE_BASE_ONCE);

    this.isActive = this.element.hasAttribute(ATTRIBUTE_BASE_ACTIVE);

    this.lastFocusedElement = document.activeElement as HTMLElement | null;

    this.firstFocusableElement = document.createElement("div");
    this.firstFocusableElement.setAttribute(ATTRIBUTE_CONTENT, "");

    this.firstFocusableElement.tabIndex = 0;

    this.lastFocusableElement = document.createElement("button");

    this.lastFocusableElement.style.cssText =
      "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0;";

    this.lastFocusableElement.onfocus = () =>
      this.firstFocusableElement.focus();

    this.firstFocusableElement.append(...this.element.childNodes);

    this.element.append(this.firstFocusableElement);
    this.element.append(this.lastFocusableElement);

    document.addEventListener(DEFAULT_EVENT_CLICK, this.handleDocumentClick);
  }

  handleDocumentClick = (event: MouseEvent) => {
    let { target } = event;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target === this.element) {
      return this.hide();
    }

    target = target.closest(
      `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
        `${ATTRIBUTE_BASE_ID}`
      )}"][${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}]`
    );

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.getAttribute(ATTRIBUTE_ACTION) as keyof this;

    if (!action) {
      return;
    }

    const actionFunc = this[action];

    if (actionFunc instanceof Function) {
      const actionFlush = target.getAttribute(ATTRIBUTE_ACTION_FLUSH);

      if (!actionFlush) {
        event.preventDefault();
      }

      if (!this.element.contains(target)) {
        this.lastFocusedElement = target;
      }

      return actionFunc({
        event,
      });
    }
  };

  handleElementKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Tab") {
      if (event.shiftKey) {
        if (event.target === this.firstFocusableElement) {
          event.preventDefault();
          return this.lastFocusableElement.focus();
        }
        return;
      }
    }
    if (event.key === "Escape") {
      this.hide();
    }
  };

  show = () => {
    if (this.isActive) {
      return;
    }

    // Solve z-index problem
    // Now moves only once
    if (document.body.lastChild !== this.element) {
      if (this.element.parentNode) {
        document.body.append(this.element);
        // Force reflow to catch up with the DOM changes before css transition
        this.element.offsetWidth;
      }
    }

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "pinch-zoom";
    this.element.setAttribute(ATTRIBUTE_BASE_ACTIVE, "");

    this.element.addEventListener(
      DEFAULT_EVENT_KEYDOWN,
      this.handleElementKeyDown
    );

    this.firstFocusableElement.focus();

    this.isActive = true;
  };

  hide = () => {
    if (!this.isActive) {
      return;
    }

    this.element.removeEventListener(
      DEFAULT_EVENT_KEYDOWN,
      this.handleElementKeyDown
    );

    this.element.removeAttribute(ATTRIBUTE_BASE_ACTIVE);

    this.lastFocusedElement?.focus();

    if (!document.querySelector(`[${ATTRIBUTE_BASE_ACTIVE}]`)) {
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("touch-action");
    }

    if (this.isOnce) {
      document.removeEventListener(
        DEFAULT_EVENT_CLICK,
        this.handleDocumentClick
      );
      this.element.remove();
    }

    this.isActive = false;
  };

  removeEventsListeners = () => {
    this.element.removeEventListener(
      DEFAULT_EVENT_KEYDOWN,
      this.handleElementKeyDown
    );
    document.removeEventListener(DEFAULT_EVENT_CLICK, this.handleDocumentClick);
  };
}

export { Modal as modal, ModalConfigType, ModalPropsType };
