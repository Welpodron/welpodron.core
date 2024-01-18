// Its cool to write english comments along with russian comments KEK Its like Im a fucking bipolar or smth idk
const modalsListActive = new Set<Modal>();

const MODULE_BASE = 'modal';

const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
const ATTRIBUTE_BASE_ACTIVE = `${ATTRIBUTE_BASE}-active`;
const ATTRIBUTE_BASE_ONCE = `${ATTRIBUTE_BASE}-once`;
const ATTRIBUTE_CONTENT = `${ATTRIBUTE_BASE}-content`;
const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
const ATTRIBUTE_CONTROL_ACTIVE = `${ATTRIBUTE_CONTROL}-active`;
const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
const ATTRIBUTE_ACTION_ARGS = `${ATTRIBUTE_ACTION}-args`;
const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;

// FOR MINIFICATION PURPOSES
const DEFAULT_EVENT_CLICK = 'click';
const DEFAULT_EVENT_KEYDOWN = 'keydown';

type ModalConfigType = {
  isOnce?: boolean;
};

type ModalPropsType = {
  element: HTMLElement;
  config?: ModalConfigType;
};

class Modal {
  supportedActions = ['hide', 'show'];

  element: HTMLElement;

  lastFocusedElement: HTMLElement | null;
  firstFocusableElement: HTMLElement;
  lastFocusableElement: HTMLElement;

  isActive = false;
  isOnce = false;

  constructor({ element, config = {} }: ModalPropsType) {
    this.element = element;

    if (config.isOnce != null) {
      this.isOnce = config.isOnce;
    } else {
      this.isOnce = this.element.getAttribute(ATTRIBUTE_BASE_ONCE) != null;
    }

    this.isActive = this.element.getAttribute(ATTRIBUTE_BASE_ACTIVE) != null;

    this.lastFocusedElement = document.activeElement as HTMLElement | null;

    this.firstFocusableElement = document.createElement('div');
    this.firstFocusableElement.setAttribute(ATTRIBUTE_CONTENT, '');

    this.firstFocusableElement.tabIndex = 0;

    this.lastFocusableElement = document.createElement('button');

    this.lastFocusableElement.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0;';

    this.lastFocusableElement.onfocus = () =>
      this.firstFocusableElement.focus();

    this.firstFocusableElement.append(...this.element.childNodes);

    this.element.append(this.firstFocusableElement);
    this.element.append(this.lastFocusableElement);

    document.addEventListener(DEFAULT_EVENT_CLICK, this.handleDocumentClick);
  }

  handleDocumentClick = (event: MouseEvent) => {
    let { target } = event;

    if (!target) {
      return;
    }

    if (target === this.element) {
      return this.hide({ event });
    }

    target = (target as Element).closest(
      `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
        `${ATTRIBUTE_BASE_ID}`
      )}"][${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}]`
    );

    if (!target) {
      return;
    }

    const action = (target as Element).getAttribute(
      ATTRIBUTE_ACTION
    ) as keyof this;

    const actionArgs = (target as Element).getAttribute(ATTRIBUTE_ACTION_ARGS);

    const actionFlush = (target as Element).getAttribute(
      ATTRIBUTE_ACTION_FLUSH
    );

    if (!actionFlush) {
      event.preventDefault();
    }

    if (!action || !this.supportedActions.includes(action as string)) {
      return;
    }

    const actionFunc = this[action] as any;

    if (actionFunc instanceof Function) {
      if (!this.element.contains(target as Node)) {
        // Проверить находится ли target вне модального окна
        // Если да, то сделать его последним активным элементом
        this.lastFocusedElement = target as HTMLElement;
      }

      return actionFunc({
        args: actionArgs,
        event,
      });
    }
  };

  handleDocumentKeyDown = (event: KeyboardEvent) => {
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
      const lastModal = [...modalsListActive][modalsListActive.size - 1];
      lastModal.hide();
    }
  };

  // NOW IT IS SYNC SOOOO NO RACE CONDITIONS
  show = ({ args, event }: { args?: unknown; event?: Event } = {}) => {
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

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'pinch-zoom';
    this.element.setAttribute(ATTRIBUTE_BASE_ACTIVE, '');

    document.addEventListener(
      DEFAULT_EVENT_KEYDOWN,
      this.handleDocumentKeyDown
    );

    this.firstFocusableElement.focus();

    modalsListActive.add(this);

    this.isActive = true;
  };

  // NOW IT IS SYNC SOOOO NO RACE CONDITIONS
  hide = ({ args, event }: { args?: unknown; event?: Event } = {}) => {
    if (!this.isActive) {
      return;
    }

    document.removeEventListener(
      DEFAULT_EVENT_KEYDOWN,
      this.handleDocumentKeyDown
    );

    this.element.removeAttribute(ATTRIBUTE_BASE_ACTIVE);

    this.lastFocusedElement?.focus();

    modalsListActive.delete(this);

    if (!modalsListActive.size) {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
    }

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
      document.removeEventListener(
        DEFAULT_EVENT_CLICK,
        this.handleDocumentClick
      );
      this.element.remove();
    }

    this.isActive = false;
  };
}

export { Modal as modal, ModalConfigType, ModalPropsType, modalsListActive };
