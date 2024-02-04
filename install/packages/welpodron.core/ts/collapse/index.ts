const ATTRIBUTE_BASE_ID = 'data-w-collapse-id';
const ATTRIBUTE_BASE_ACTIVE = 'data-w-collapse-active';
const ATTRIBUTE_CONTROL = 'data-w-collapse-control';
const ATTRIBUTE_CONTROL_ACTIVE = 'data-w-collapse-control-active';
const ATTRIBUTE_ACTION = 'data-w-collapse-action';
const ATTRIBUTE_ACTION_FLUSH = 'data-w-collapse-action-flush';

// FOR MINIFICATION
const DEFAULT_CANCEL_ANIMATION_FRAME = window.cancelAnimationFrame;

type CollapsePropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
};

class Collapse<BaseElementType extends HTMLElement = HTMLElement> {
  element: BaseElementType;

  animationFrame = 0;

  constructor({ element }: CollapsePropsType<BaseElementType>) {
    this.element = element;

    this.element.ontransitionend = this.handleTransitionEnd;

    document.addEventListener('click', this.handleDocumentClick);
  }

  //! НЕ ВЫЗЫВАЕТСЯ ПРИ prefers-reduced-motion: reduce
  handleTransitionEnd = (event: TransitionEvent) => {
    if (event.target !== this.element) {
      return;
    }

    if (event.propertyName !== 'height') {
      return;
    }

    this.element.style.removeProperty('height');
    this.element.style.removeProperty('display');
  };

  handleDocumentClick = (event: MouseEvent) => {
    let { target } = event;

    if (!(target instanceof HTMLElement)) {
      return;
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

    const actionFunc = this[action];

    if (actionFunc instanceof Function) {
      return actionFunc();
    }
  };

  show = () => {
    if (this.element.hasAttribute(ATTRIBUTE_BASE_ACTIVE)) {
      return;
    }

    if (this.animationFrame) {
      DEFAULT_CANCEL_ANIMATION_FRAME(this.animationFrame);
    }

    document
      .querySelectorAll(
        `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
          `${ATTRIBUTE_BASE_ID}`
        )}"][${ATTRIBUTE_CONTROL}]`
      )
      .forEach((control) => {
        control.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, '');
      });

    this.element.style.height = this.element.style.height || '0';

    this.element.setAttribute(ATTRIBUTE_BASE_ACTIVE, '');

    this.element.style.height = this.element.scrollHeight + 'px';
  };

  hide = () => {
    if (!this.element.hasAttribute(ATTRIBUTE_BASE_ACTIVE)) {
      return;
    }

    if (this.animationFrame) {
      DEFAULT_CANCEL_ANIMATION_FRAME(this.animationFrame);
    }

    document
      .querySelectorAll(
        `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
          `${ATTRIBUTE_BASE_ID}`
        )}"][${ATTRIBUTE_CONTROL}]`
      )
      .forEach((control) => {
        control.removeAttribute(ATTRIBUTE_CONTROL_ACTIVE);
      });

    this.element.style.height =
      this.element.style.height || this.element.scrollHeight + 'px';

    this.element.style.display = 'block';

    this.element.removeAttribute(ATTRIBUTE_BASE_ACTIVE);

    this.animationFrame = window.requestAnimationFrame(() => {
      this.element.style.height = '0';
      this.animationFrame = 0;
    });
  };

  toggle = () => {
    if (this.animationFrame) {
      DEFAULT_CANCEL_ANIMATION_FRAME(this.animationFrame);
    }

    return this.element.hasAttribute(ATTRIBUTE_BASE_ACTIVE)
      ? this.hide()
      : this.show();
  };

  destroy = () => {
    this.element.ontransitionend = null;

    if (this.animationFrame) {
      DEFAULT_CANCEL_ANIMATION_FRAME(this.animationFrame);
    }

    document.removeEventListener('click', this.handleDocumentClick);
  };
}

export { Collapse as collapse, CollapsePropsType };
