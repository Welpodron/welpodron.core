const ATTRIBUTE_BASE_ID = 'data-w-modal-id';
const ATTRIBUTE_BASE_ACTIVE = 'data-w-modal-active';
const ATTRIBUTE_BASE_ONCE = 'data-w-modal-once';
const ATTRIBUTE_CONTENT = 'data-w-modal-content';
const ATTRIBUTE_CONTROL = 'data-w-modal-control';
const ATTRIBUTE_ACTION = 'data-w-modal-action';
const ATTRIBUTE_ACTION_ARGS = 'data-w-modal-action-args';
const ATTRIBUTE_ACTION_FLUSH = 'data-w-modal-action-flush';

const modalsListActive = new Set<Modal>();

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

    document.addEventListener('click', this.handleDocumentClick);
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

    const actionFlush = target.getAttribute(ATTRIBUTE_ACTION_FLUSH);

    if (!actionFlush) {
      event.preventDefault();
    }

    if (!action) {
      return;
    }

    const actionArgs = target.getAttribute(ATTRIBUTE_ACTION_ARGS);

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

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'pinch-zoom';
    this.element.setAttribute(ATTRIBUTE_BASE_ACTIVE, '');

    document.addEventListener('keydown', this.handleDocumentKeyDown);

    this.firstFocusableElement.focus();

    modalsListActive.add(this);

    this.isActive = true;
  };

  hide = () => {
    if (!this.isActive) {
      return;
    }

    document.removeEventListener('keydown', this.handleDocumentKeyDown);

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
      document.removeEventListener('click', this.handleDocumentClick);
      this.element.remove();
    }

    this.isActive = false;
  };

  destroy = () => {
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleDocumentKeyDown);
  };
}

export { Modal as modal, ModalConfigType, ModalPropsType, modalsListActive };
